import { Knex } from "knex";
import {
  listSchemas,
  listTables,
  listColumns,
  listPrimaryKeys,
  listForeignKeys,
} from "./listFunctions";
import { DatabaseError } from "../errors/handler";

export async function introspectDB(pg: Knex) {
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

    return { schemas, nodes, edges };
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
}
