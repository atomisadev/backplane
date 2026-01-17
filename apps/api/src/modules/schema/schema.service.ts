import { Knex } from "knex";
import knex from "knex";
import { prisma } from "../../db";
import { decrypt } from "../../lib/crypto";
import { NotFoundError, DatabaseError } from "../../errors";

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
          array_agg(a.attname) as columns,
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
};
