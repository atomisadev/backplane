import { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { DatabaseError } from "../../errors";
import { encrypt } from "../../lib/crypto";
import { DbType } from "@prisma/client";
import knex, { Knex } from "knex";
import {
  listColumns,
  listForeignKeys,
  listPrimaryKeys,
  listSchemas,
  listTables,
} from "../../introspect/listFunctions";

interface CreateProjectInput {
  userId: string;
  name: string;
  dbType: DbType;
  connectionUri: string;
}

export const projectService = {
  async create(data: CreateProjectInput) {
    const encryptedUri = encrypt(data.connectionUri);

    let pg: Knex | null = null;
    let schemaSnapshot: Prisma.InputJsonValue | null = null;

    pg = knex({
      client: "pg",
      connection: data.connectionUri,
      pool: { min: 0, max: 5 },
    });

    await pg.raw("SELECT 1");

    try {
      const schemas = (await listSchemas(pg)).map((s) => s.schema_name);

      if (schemas.length === 0) {
        throw new DatabaseError(
          "No schemas found in the database. Please ensure the database contains at least one schema.",
        );
      }

      const [tables, columns, pks, fks] = await Promise.all([
        listTables(pg, schemas),
        listColumns(pg, schemas),
        listPrimaryKeys(pg, schemas),
        listForeignKeys(pg, schemas),
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

  async introspectDB(pg: Knex) {},
};
