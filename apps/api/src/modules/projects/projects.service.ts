import { prisma } from "../../db";
import { DatabaseError } from "../../errors";
import { encrypt } from "../../lib/crypto";
import { DbType } from "@prisma/client";
import knex, { Knex } from "knex";

interface CreateProjectInput {
  userId: string;
  name: string;
  dbType: DbType;
  connectionUri: string;
}

async function listColumns(knex: Knex, schemas: string[]) {
  const result = await knex.raw(
    `
    SELECT
      table_schema,
      table_name,
      column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = ANY (?)
    ORDER BY table_schema, table_name, ordinal_position;
  `,
    [schemas],
  );

  return result.rows as {
    table_schema: string;
    table_name: string;
    column_name: string;
    data_type: string;
    udt_name: string;
    is_nullable: "YES" | "NO";
    column_default: string | null;
    ordinal_position: number;
  }[];
}

async function listForeignKeys(knex: Knex, schemas: string[]) {
  const result = await knex.raw(
    `
    SELECT
      tc.constraint_name AS fk_name,
      tc.table_schema    AS source_schema,
      tc.table_name      AS source_table,
      kcu.column_name    AS source_column,
      ccu.table_schema   AS target_schema,
      ccu.table_name     AS target_table,
      ccu.column_name    AS target_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.constraint_schema = kcu.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = ANY (?)
    ORDER BY source_schema, source_table, fk_name, kcu.ordinal_position;
  `,
    [schemas],
  );

  return result.rows as {
    fk_name: string;
    source_schema: string;
    source_table: string;
    source_column: string;
    target_schema: string;
    target_table: string;
    target_column: string;
  }[];
}

async function listPrimaryKeys(knex: Knex, schemas: string[]) {
  const result = await knex.raw(
    `
    SELECT
      tc.table_schema,
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.constraint_schema = kcu.constraint_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = ANY (?)
    ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position;
  `,
    [schemas],
  );

  return result.rows as {
    table_schema: string;
    table_name: string;
    column_name: string;
  }[];
}

async function listSchemas(knex: Knex) {
  const result = await knex.raw(`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schema_name;
  `);
  return result.rows as { schema_name: string }[];
}

async function listTables(knex: Knex, schemas: string[]) {
  const result = await knex.raw(
    `
    SELECT table_schema, table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = ANY (?)
    ORDER BY table_schema, table_name;
  `,
    [schemas],
  );

  return result.rows as {
    table_schema: string;
    table_name: string;
    table_type: "BASE TABLE" | "VIEW";
  }[];
}

export const projectService = {
  async create(data: CreateProjectInput) {
    const encryptedUri = encrypt(data.connectionUri);

    let pg: Knex | null = null;
    let schemaSnapshot: {
      schemas: string[];
      nodes: {
        id: string;
        schema: string;
        name: string;
        type: "BASE TABLE" | "VIEW";
        primaryKey: string[];
        columns: any[];
      }[];
      edges: {
        id: string;
        source: string;
        sourceColumn: string;
        target: string;
        targetColumn: string;
        label: string;
      }[];
    } | null = null;

    pg = knex({
      client: "pg",
      connection: data.connectionUri,
      pool: { min: 0, max: 5 },
    });

    // Test connection before proceeding
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

      // Group columns & PKs by table for convenient UI use
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

      schemaSnapshot = { schemas, nodes, edges };
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
        schemaSnapshot: schemaSnapshot,
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
