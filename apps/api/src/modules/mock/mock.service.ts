import knex, { Knex } from "knex";
import { DatabaseError } from "../../errors";

export const mockService = {
  async findAllRecords(pg: Knex, tableName: string) {
    return await pg(tableName).select("*");
  },
  async findAllRecordsWithSchema(
    pg: Knex,
    schemaName: string,
    tableName: string,
  ) {
    return await pg.withSchema(schemaName).select("*").from(tableName);
  },
  async findRecordWithID(pg: Knex, tableName: string, id: any) {
    const primaryKeys = await pg("pg_index as i")
      .join("pg_class as c", "c.oid", "i.indrelid")
      .join("pg_namespace as n", "n.oid", "c.relnamespace")
      .join("pg_attribute as a", function () {
        this.on("a.attrelid", "c.oid").andOn(
          "a.attnum",
          "=",
          pg.raw("ANY(i.indkey)"),
        );
      })
      .where("i.indisprimary", true)
      .andWhere("c.relname", tableName)
      .select(pg.raw("array_agg(a.attname order by a.attnum) as pk_cols"))
      .first();

    const pk = primaryKeys?.pk_cols?.[0];

    if (!pk) {
      throw new DatabaseError("Could not find primary key.");
    }

    return await pg(tableName).where(pk, id).first();
  },
  async findRecordWithIDAndSchema(
    pg: Knex,
    schemaName: string,
    tableName: string,
    id: any,
  ) {
    const primaryKeys = await pg("pg_index as i")
      .join("pg_class as c", "c.oid", "i.indrelid")
      .join("pg_namespace as n", "n.oid", "c.relnamespace")
      .join("pg_attribute as a", function () {
        this.on("a.attrelid", "c.oid").andOn(
          "a.attnum",
          "=",
          pg.raw("ANY(i.indkey)"),
        );
      })
      .where("i.indisprimary", true)
      .andWhere("n.nspname", schemaName)
      .andWhere("c.relname", tableName)
      .select(pg.raw("array_agg(a.attname order by a.attnum) as pk_cols"))
      .first();

    const pk = primaryKeys?.pk_cols?.[0];

    if (!pk) {
      throw new DatabaseError("Could not find primary key.");
    }

    return await pg
      .withSchema(schemaName)
      .from(tableName)
      .where(pk, id)
      .first();
  },
  async addRecord(pg: Knex, tableName: string, record: object) {
    const rows = await pg("information_schema.columns")
      .select({
        name: "column_name",
        data_type: "data-type",
        is_nullable: "is_nullable",
      })
      .where(tableName)
      .orderBy("ordinal_position", "asc");

    const tableSet = new Set(rows);
    const objSet = new Set(Object.keys(record));

    const missingInTable = Object.keys(record).filter((k) => !tableSet.has(k));
    const extraInTable = rows.filter((c) => !objSet.has(c));

    if (missingInTable.length !== 0 || extraInTable.length !== 0) {
      throw new DatabaseError(
        "Input does not match table columns. Input: " +
          JSON.stringify(record) +
          "\n Expected: " +
          JSON.stringify(rows),
      );
    }

    return await pg(tableName).insert(record);
  },
  async addRecordWithSchema(
    pg: Knex,
    schemaName: string,
    tableName: string,
    record: object,
  ) {
    const rows = await pg("information_schema.columns")
      .select({
        name: "column_name",
        data_type: "data-type",
        is_nullable: "is_nullable",
      })
      .where({
        table_schema: schemaName,
        table_name: tableName,
      })
      .orderBy("ordinal_position", "asc");

    const tableSet = new Set(rows);
    const objSet = new Set(Object.keys(record));

    const missingInTable = Object.keys(record).filter((k) => !tableSet.has(k));
    const extraInTable = rows.filter((c) => !objSet.has(c));

    if (missingInTable.length !== 0 || extraInTable.length !== 0) {
      throw new DatabaseError(
        "Input does not match table columns. Input: " +
          JSON.stringify(record) +
          "\n Expected: " +
          JSON.stringify(rows),
      );
    }

    return await pg.withSchema(schemaName).select(tableName).insert(record);
  },
  async deleteRecord(pg: Knex, tableName: string, id: any) {
    const primaryKeys = await pg("pg_index as i")
      .join("pg_class as c", "c.oid", "i.indrelid")
      .join("pg_namespace as n", "n.oid", "c.relnamespace")
      .join("pg_attribute as a", function () {
        this.on("a.attrelid", "c.oid").andOn(
          "a.attnum",
          "=",
          pg.raw("ANY(i.indkey)"),
        );
      })
      .where("i.indisprimary", true)
      .andWhere("c.relname", tableName)
      .select(pg.raw("array_agg(a.attname order by a.attnum) as pk_cols"))
      .first();

    const pk = primaryKeys?.pk_cols?.[0];

    if (!pk) {
      throw new DatabaseError("Could not find primary key.");
    }

    return await pg(tableName).where(pk, id).del().returning("*");
  },
  async deleteRecordWithSchema(
    pg: Knex,
    schemaName: string,
    tableName: string,
    id: any,
  ) {
    const primaryKeys = await pg("pg_index as i")
      .join("pg_class as c", "c.oid", "i.indrelid")
      .join("pg_namespace as n", "n.oid", "c.relnamespace")
      .join("pg_attribute as a", function () {
        this.on("a.attrelid", "c.oid").andOn(
          "a.attnum",
          "=",
          pg.raw("ANY(i.indkey)"),
        );
      })
      .where("i.indisprimary", true)
      .andWhere("n.nspname", schemaName)
      .andWhere("c.relname", tableName)
      .select(pg.raw("array_agg(a.attname order by a.attnum) as pk_cols"))
      .first();

    const pk = primaryKeys?.pk_cols?.[0];

    if (!pk) {
      throw new DatabaseError("Could not find primary key.");
    }

    return await pg
      .withSchema(schemaName)
      .from(tableName)
      .where(pk, id)
      .del()
      .returning("*");
  },
};
