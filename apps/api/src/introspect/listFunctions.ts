import { Knex } from "knex";

export async function listColumns(knex: Knex, schemas: string[]) {
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

export async function listForeignKeys(knex: any, schemas: string[]) {
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

export async function listPrimaryKeys(knex: Knex, schemas: string[]) {
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

export async function listSchemas(knex: Knex) {
  const result = await knex.raw(`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schema_name;
  `);
  return result.rows as { schema_name: string }[];
}

export async function listTables(knex: Knex, schemas: string[]) {
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
