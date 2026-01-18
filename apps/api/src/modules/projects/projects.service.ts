import { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { DatabaseError, NotFoundError } from "../../errors";
import { encrypt } from "../../lib/crypto";
import { DbType } from "@prisma/client";
import knex, { Knex } from "knex";
import {
  listColumns as listColumnsPg,
  listForeignKeys as listForeignKeysPg,
  listPrimaryKeys as listPrimaryKeysPg,
  listSchemas as listSchemasPg,
  listTables as listTablesPg,
} from "../../introspect/listFunctions";

interface CreateProjectInput {
  userId: string;
  name: string;
  dbType: DbType;
  connectionUri: string;
}

const IGNORED_SCHEMAS = new Set([
  "information_schema",
  "pg_catalog",
  "pg_toast",
  "cron",
  "auth",
  "mysql",
  "performance_schema",
  "sys",
]);

const isPgClient = (clientName: string) =>
  String(clientName || "")
    .toLowerCase()
    .startsWith("pg");

export const projectService = {
  async create(data: CreateProjectInput) {
    const encryptedUri = encrypt(data.connectionUri);

    let db: Knex | null = null;
    let schemaSnapshot: Prisma.InputJsonValue | null = null;

    const client =
      data.dbType === "postgres" || data.dbType === "postgresql"
        ? "pg"
        : "mysql2";

    db = knex({
      client,
      connection: data.connectionUri,
      pool: { min: 0, max: 5 },
    });

    try {
      await db.raw("SELECT 1");

      if (client === "pg") {
        const allSchemas = await listSchemasPg(db as any);

        const schemas = allSchemas
          .map((s) => s.schema_name)
          .filter((name) => {
            if (!name) return false;
            if (IGNORED_SCHEMAS.has(name)) return false;
            if (name.startsWith("pg_toast")) return false;
            if (name.startsWith("pg_temp")) return false;
            return true;
          });

        if (schemas.length === 0) {
          throw new DatabaseError(
            "No schemas found in the database. Please ensure the database contains at least one schema.",
          );
        }

        const [tables, columns, pks, fks] = await Promise.all([
          listTablesPg(db as any, schemas),
          listColumnsPg(db as any, schemas),
          listPrimaryKeysPg(db as any, schemas),
          listForeignKeysPg(db as any, schemas),
        ]);

        const key = (s: string, t: string) => `${s}.${t}`;

        const columnsByTable = new Map<string, any[]>();
        for (const c of columns) {
          const k = key(c.table_schema, c.table_name);
          const arr = columnsByTable.get(k) ?? [];
          arr.push({
            name: c.column_name,
            type: c.data_type,
            udt: c.udt_name,
            nullable: c.is_nullable === "YES",
            default: c.column_default,
            position: c.ordinal_position,
          });
          columnsByTable.set(k, arr);
        }

        const pkByTable = new Map<string, string[]>();
        for (const pk of pks) {
          const k = key(pk.table_schema, pk.table_name);
          const arr = pkByTable.get(k) ?? [];
          arr.push(pk.column_name);
          pkByTable.set(k, arr);
        }

        const nodes = tables.map((t) => {
          const k = key(t.table_schema, t.table_name);
          return {
            id: k,
            schema: t.table_schema,
            name: t.table_name,
            type: t.table_type,
            primaryKey: pkByTable.get(k) ?? [],
            columns: columnsByTable.get(k) ?? [],
          };
        });

        const edges = fks.map((fk) => ({
          id: fk.fk_name,
          source: `${fk.source_schema}.${fk.source_table}`,
          sourceColumn: fk.source_column,
          target: `${fk.target_schema}.${fk.target_table}`,
          targetColumn: fk.target_column,
          label: `${fk.source_column} → ${fk.target_column}`,
        }));

        schemaSnapshot = {
          schemas,
          nodes,
          edges,
        } as unknown as Prisma.InputJsonValue;
      } else {
        let schemas: string[] = [];
        try {
          const currentDbRaw = await db.raw(`SELECT DATABASE() AS current_db;`);
          const currentDbRows = (currentDbRaw &&
            (currentDbRaw[0] ?? currentDbRaw.rows ?? currentDbRaw)) as any[];
          const currentDbVal =
            Array.isArray(currentDbRows) && currentDbRows.length > 0
              ? (currentDbRows[0].current_db ??
                currentDbRows[0].DATABASE ??
                currentDbRows[0].database ??
                Object.values(currentDbRows[0])[0])
              : undefined;

          if (typeof currentDbVal === "string" && currentDbVal.trim() !== "") {
            schemas = [currentDbVal];
          } else {
            const rawSchemas = await db.raw(
              `
              SELECT schema_name
              FROM information_schema.schemata
              WHERE schema_name NOT IN ('mysql','information_schema','performance_schema','sys')
              ORDER BY schema_name;
            `,
            );
            const schemasRows = (rawSchemas &&
              (rawSchemas[0] ?? rawSchemas.rows ?? rawSchemas)) as any[];
            schemas = (schemasRows || [])
              .map(
                (r) => r && (r.schema_name ?? r.SCHEMA_NAME ?? r.Schema_name),
              )
              .filter(Boolean);
          }
        } catch (err) {
          try {
            const rawSchemas = await db.raw(
              `
              SELECT schema_name
              FROM information_schema.schemata
              WHERE schema_name NOT IN ('mysql','information_schema','performance_schema','sys')
              ORDER BY schema_name;
            `,
            );
            const schemasRows = (rawSchemas &&
              (rawSchemas[0] ?? rawSchemas.rows ?? rawSchemas)) as any[];
            schemas = (schemasRows || [])
              .map(
                (r) => r && (r.schema_name ?? r.SCHEMA_NAME ?? r.Schema_name),
              )
              .filter(Boolean);
          } catch (innerErr) {
            console.error(
              "Failed to detect MySQL schemas/databases:",
              err,
              innerErr,
            );
            schemas = [];
          }
        }

        if (schemas.length === 0) {
          throw new DatabaseError(
            "No schemas (databases) found in the MySQL server. Please ensure the server contains at least one non-system database.",
          );
        }

        const targetSchema = schemas[0];

        // tables
        const rawTables = await db.raw(
          `
          SELECT TABLE_SCHEMA as table_schema, TABLE_NAME as table_name, TABLE_TYPE as table_type
          FROM information_schema.tables
          WHERE TABLE_SCHEMA = ?
          ORDER BY TABLE_SCHEMA, TABLE_NAME;
        `,
          [targetSchema],
        );
        const tables = (rawTables &&
          (rawTables[0] ?? rawTables.rows ?? rawTables)) as any[];

        // columns
        const rawColumns = await db.raw(
          `
          SELECT TABLE_SCHEMA as table_schema, TABLE_NAME as table_name, COLUMN_NAME as column_name,
                 DATA_TYPE as data_type, COLUMN_TYPE as udt_name, IS_NULLABLE as is_nullable,
                 COLUMN_DEFAULT as column_default, ORDINAL_POSITION as ordinal_position
          FROM information_schema.columns
          WHERE TABLE_SCHEMA = ?
          ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;
        `,
          [targetSchema],
        );
        const columns = (rawColumns &&
          (rawColumns[0] ?? rawColumns.rows ?? rawColumns)) as any[];

        // primary keys
        const rawPks = await db.raw(
          `
          SELECT k.TABLE_SCHEMA as table_schema, k.TABLE_NAME as table_name, k.COLUMN_NAME as column_name
          FROM information_schema.table_constraints t
          JOIN information_schema.key_column_usage k
            ON t.CONSTRAINT_NAME = k.CONSTRAINT_NAME
           AND t.TABLE_SCHEMA = k.TABLE_SCHEMA
          WHERE t.CONSTRAINT_TYPE = 'PRIMARY KEY'
            AND t.TABLE_SCHEMA = ?
          ORDER BY k.TABLE_SCHEMA, k.TABLE_NAME, k.ORDINAL_POSITION;
        `,
          [targetSchema],
        );
        const pks = (rawPks && (rawPks[0] ?? rawPks.rows ?? rawPks)) as any[];

        // foreign keys
        const rawFks = await db.raw(
          `
          SELECT
            k.CONSTRAINT_NAME AS fk_name,
            k.TABLE_SCHEMA    AS source_schema,
            k.TABLE_NAME      AS source_table,
            k.COLUMN_NAME     AS source_column,
            k.REFERENCED_TABLE_SCHEMA AS target_schema,
            k.REFERENCED_TABLE_NAME   AS target_table,
            k.REFERENCED_COLUMN_NAME  AS target_column
          FROM information_schema.key_column_usage k
          JOIN information_schema.referential_constraints rc
            ON k.CONSTRAINT_NAME = rc.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
          WHERE k.TABLE_SCHEMA = ?
          ORDER BY source_schema, source_table, fk_name, k.ORDINAL_POSITION;
        `,
          [targetSchema],
        );
        const fks = (rawFks && (rawFks[0] ?? rawFks.rows ?? rawFks)) as any[];

        const key = (s: string, t: string) => `${s}.${t}`;

        const columnsByTable = new Map<string, any[]>();
        for (const c of columns) {
          const k = key(c.table_schema, c.table_name);
          const arr = columnsByTable.get(k) ?? [];
          arr.push({
            name: c.column_name,
            type: c.data_type,
            udt: c.udt_name,
            nullable:
              c.is_nullable === "YES" ||
              c.is_nullable === "Yes" ||
              c.is_nullable === "yes",
            default: c.column_default,
            position: c.ordinal_position,
          });
          columnsByTable.set(k, arr);
        }

        const pkByTable = new Map<string, string[]>();
        for (const pk of pks) {
          const k = key(pk.table_schema, pk.table_name);
          const arr = pkByTable.get(k) ?? [];
          arr.push(pk.column_name);
          pkByTable.set(k, arr);
        }

        const nodes = (tables || []).map((t: any) => {
          const k = key(t.table_schema, t.table_name);
          return {
            id: k,
            schema: t.table_schema,
            name: t.table_name,
            type: t.table_type,
            primaryKey: pkByTable.get(k) ?? [],
            columns: columnsByTable.get(k) ?? [],
          };
        });

        const edges = (fks || []).map((fk: any) => ({
          id: fk.fk_name,
          source: `${fk.source_schema}.${fk.source_table}`,
          sourceColumn: fk.source_column,
          target: `${fk.target_schema}.${fk.target_table}`,
          targetColumn: fk.target_column,
          label: `${fk.source_column} → ${fk.target_column}`,
        }));

        schemaSnapshot = {
          schemas,
          nodes,
          edges,
        } as unknown as Prisma.InputJsonValue;
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new DatabaseError(
        `Failed to introspect database structure: ${errorMessage}`,
        {
          originalError: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
    } finally {
      if (db) {
        try {
          await db.destroy();
        } catch (e) {
          console.error("Failed to destroy knex connection:", e);
        }
      }
    }

    return await prisma.project.create({
      data: {
        userId: data.userId,
        name: data.name,
        dbType: data.dbType,
        connectionUri: encryptedUri,
        schemaSnapshot: schemaSnapshot ?? Prisma.JsonNull,
      },
    });
  },

  async getAllByUser(userId: string) {
    return await prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        dbType: true,
        createdAt: true,
      },
    });
  },

  async getById(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return null;
    }

    return project;
  },

  async update(userId: string, projectId: string, data: { graphLayout?: any }) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundError("Project not found");
    }

    return await prisma.project.update({
      where: { id: projectId },
      data: {
        graphLayout: data.graphLayout ?? undefined,
      },
    });
  },

  async delete(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundError("Project not found");
    }

    return await prisma.project.delete({
      where: { id: projectId },
    });
  },

  async introspectDB(pg: Knex) {},
};
