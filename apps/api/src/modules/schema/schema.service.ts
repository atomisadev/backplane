import { Knex } from "knex";
import knex from "knex";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { decrypt } from "../../lib/crypto";
import { NotFoundError, DatabaseError } from "../../errors";
import { ChangesDefinition, ChangesDefinitionType } from "../../lib/types";
import { introspectDB } from "../../introspect/introspect";
import {
  listSchemas,
  listTables,
  listColumns,
  listPrimaryKeys,
  listForeignKeys,
} from "../../introspect/listFunctions";

export const schemaService = {
  async getProjectConnection(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundError("Project not found");
    }

    const connectionString = decrypt(project.connectionUri);

    const pg = knex({
      client: "pg",
      connection: connectionString,
      pool: { min: 0, max: 1 },
    });

    try {
      await pg.raw("SELECT 1");
    } catch (e) {
      await pg.destroy();
      throw new DatabaseError("Could not connect to project db", e);
    }

    return pg;
  },

  async getIndexes(pg: Knex, schema: string, table: string) {
    try {
      const result = await pg.raw(
        `
        SELECT
          i.relname as index_name,
          array_agg(a.attname)::text[] as columns,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary,
          am.amname as method
        FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a,
          pg_namespace n,
          pg_am am
        WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname = ?
          AND n.oid = t.relnamespace
          AND n.nspname = ?
          AND i.relam = am.oid
        GROUP BY
          i.relname,
          ix.indisunique,
          ix.indisprimary,
          am.amname;
      `,
        [table, schema],
      );

      return result.rows.map((row: any) => ({
        name: row.index_name,
        columns: row.columns,
        unique: row.is_unique,
        primary: row.is_primary,
        method: row.method,
      }));
    } catch (error) {
      console.error("Failed to fetch indexes:", error);
      throw new DatabaseError("Failed to fetch indexes", error);
    }
  },

  async createColumn(
    pg: Knex,
    schema: string,
    table: string,
    column: {
      name: string;
      type: string;
      nullable: boolean;
      defaultValue?: string;
    },
  ) {
    try {
      await pg.schema.withSchema(schema).table(table, (t) => {
        const col = t.specificType(column.name, column.type);

        if (!column.nullable) {
          col.notNullable();
        }

        if (column.defaultValue) {
          col.defaultTo(pg.raw(column.defaultValue));
        }
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to create column:", error);
      throw new DatabaseError("Failed to create column", error);
    }
  },

  async parseUpdates(
    pg: Knex,
    changes: ChangesDefinitionType,
    projectId: string,
  ) {
    for (const { type, schema, column, table, oldColumn } of changes) {
      if (type === "CREATE_COLUMN" && column) {
        try {
          await pg.schema.withSchema(schema).table(table, (t) => {
            const col = t.specificType(column.name, column.type);

            if (!column.nullable) {
              col.notNullable();
            }

            if (column.defaultValue) {
              col.defaultTo(pg.raw(column.defaultValue));
            }
          });
        } catch (error) {
          console.error("Failed to create column:", error);
          throw new DatabaseError("Failed to create column", error);
        }
      } else if (type === "CREATE_TABLE" && column) {
        try {
          await pg.schema.withSchema(schema).createTable(table, (t) => {
            const colBuilder = t.specificType(column.name, column.type);

            if (!column.nullable) colBuilder.notNullable();
            else colBuilder.nullable();

            if (
              column.defaultValue &&
              String(column.defaultValue).trim() !== ""
            ) {
              const dv = String(column.defaultValue).trim();
              const looksLikeExpression =
                /[()]/.test(dv) ||
                /\bnow\b|\bcurrent_timestamp\b|\bgen_random_uuid\b|\buuid_generate_v4\b/i.test(
                  dv,
                );

              colBuilder.defaultTo(looksLikeExpression ? pg.raw(dv) : dv);
            }

            t.primary([column.name]);
          });
        } catch (error) {
          console.error("Failed to create table:", error);
          throw new DatabaseError("Failed to create table", error);
        }
      } else if (type === "UPDATE_COLUMN" && column && oldColumn) {
        try {
          if (oldColumn.name !== column.name) {
            await pg.schema.withSchema(schema).alterTable(table, (newTable) => {
              newTable.renameColumn(oldColumn.name, column.name);
            });
          }

          if (oldColumn.nullable !== column.nullable) {
            if (column.nullable) {
              await pg.schema
                .withSchema(schema)
                .alterTable(table, (newTable) => {
                  newTable.setNullable(column.name);
                });
            } else {
              await pg.schema
                .withSchema(schema)
                .alterTable(table, (newTable) => {
                  newTable.dropNullable(column.name);
                });
            }
          }

          const oldDefault = oldColumn.defaultValue?.trim() || null;
          const newDefault = column.defaultValue?.trim() || null;

          if (oldDefault !== newDefault) {
            if (newDefault) {
              const looksLikeExpression =
                /[()]/.test(newDefault) ||
                /\bnow\b|\bcurrent_timestamp\b|\bgen_random_uuid\b|\buuid_generate_v4\b/i.test(
                  newDefault,
                );

              if (looksLikeExpression) {
                await pg.raw(
                  "ALTER TABLE ??.?? ALTER COLUMN ?? SET DEFAULT ??",
                  [schema, table, column.name, newDefault], // defaultValue as a literal
                );
              } else {
                await pg.raw(
                  "ALTER TABLE ??.?? ALTER COLUMN ?? SET DEFAULT ??",
                  [schema, table, column.name, newDefault.replace(/'/g, "''")], // defaultValue as a literal
                );
              }
            } else {
              await pg.raw(`ALTER TABLE ?? ALTER COLUMN ?? DROP DEFAULT`, [
                table,
                column.name,
              ]);
            }
          }
        } catch (error) {
          console.error("Failed to update column:", error);
          throw new DatabaseError("Failed to update column", error);
        }
      } else if (type === "DROP_TABLE") {
        try {
          await pg.schema.withSchema(schema).dropTable(table);
        } catch (error) {
          console.error("Failed to drop table:", error);
          throw new DatabaseError("Failed to drop table", error);
        }
      }
    }

    const IGNORED_SCHEMAS = new Set([
      "information_schema",
      "pg_catalog",
      "pg_toast",
      "cron",
      "auth",
    ]);

    try {
      const allSchemas = await listSchemas(pg);

      const schemas = allSchemas
        .map((s) => s.schema_name)
        .filter((name) => {
          if (IGNORED_SCHEMAS.has(name)) return false;
          if (name.startsWith("pg_toast")) return false;
          if (name.startsWith("pg_temp")) return false;
          return true;
        });

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

      const schemaSnapshot = {
        schemas,
        nodes,
        edges,
      } as unknown as Prisma.InputJsonValue;

      await prisma.project.update({
        where: { id: projectId },
        data: { schemaSnapshot },
      });
    } catch (error) {
      console.error("Failed to update schema snapshot:", error);
    }

    return { success: true };
  },
};
