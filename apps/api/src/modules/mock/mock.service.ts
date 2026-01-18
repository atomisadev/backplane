import knex, { Knex } from "knex";
import { DatabaseError, NotFoundError, UnauthorizedError } from "../../errors";
import { keyof, StringFormatParams } from "better-auth/*";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "../../db";

const generateToken = () => {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
};

const validateToken = (rawToken: string, storedHash: string) => {
  const hash = createHash("sha256").update(rawToken).digest("hex");
  return hash === storedHash;
};

const getPrimaryKey = async (
  pg: Knex,
  tableName: string,
  schemaName?: string,
) => {
  const query = pg("pg_index as i")
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

  if (schemaName) {
    query.andWhere("n.nspname", schemaName);
  }

  const result = await query;
  const pk = result?.pk_cols?.[0];

  if (!pk) {
    throw new DatabaseError(
      `Could not find primary key for table: ${tableName}`,
    );
  }

  return pk;
};

export const mockService = {
  async createSession(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundError("Project not found");
    }

    const { raw, hash } = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const session = await prisma.mockSession.create({
      data: {
        projectId,
        token: hash,
        expiresAt,
      },
    });

    return {
      sessionId: session.id,
      token: raw,
      expiresAt: session.expiresAt,
    };
  },

  async validateSession(rawToken: string) {
    const hash = createHash("sha256").update(rawToken).digest("hex");

    const session = await prisma.mockSession.findUnique({
      where: { token: hash },
      include: { project: true },
    });

    if (!session) {
      throw new UnauthorizedError("Invalid mock session token");
    }

    if (new Date() > session.expiresAt) {
      await prisma.mockSession
        .delete({ where: { id: session.id } })
        .catch(() => {});
      throw new UnauthorizedError("Mock session expired");
    }

    return session;
  },

  async endSession(sessionId: string, userId: string) {
    const session = await prisma.mockSession.findUnique({
      where: { id: sessionId },
      include: { project: true },
    });

    if (!session || session.project.userId !== userId) {
      throw new NotFoundError("Session not found");
    }

    await prisma.mockSession.delete({
      where: { id: sessionId },
    });

    return { success: true };
  },

  async findAllRecords(
    pg: Knex,
    tableName: string,
    schemaName: string = "public",
  ) {
    try {
      return await pg.withSchema(schemaName).from(tableName).select("");
    } catch (e) {
      throw new DatabaseError(
        `Failed to fetch records from ${schemaName}.${tableName}`,
        e,
      );
    }
  },

  async findRecordWithID(
    pg: Knex,
    tableName: string,
    id: any,
    schemaName: string = "public",
  ) {
    const pk = await getPrimaryKey(pg, tableName, schemaName);
    const record = await pg
      .withSchema(schemaName)
      .from(tableName)
      .where(pk, id)
      .first();

    if (!record) {
      throw new Error(
        `Record with ID ${id} not found in ${schemaName}.${tableName}`,
      );
    }

    return record;
  },
  async addRecord(
    pg: Knex,
    tableName: string,
    record: object,
    schemaName: string = "public",
  ) {
    const rows = await pg("information_schema.columns")
      .select("column_name")
      .where({
        table_schema: schemaName,
        table_name: tableName,
      });

    const tableColumns = new Set(rows.map((r) => r.column_name));
    const inputColumns = Object.keys(record);
    const extraColumns = inputColumns.filter((k) => !tableColumns.has(k));

    if (extraColumns.length > 0) {
      throw new DatabaseError(
        `Input contains columns that do not exist in table: ${extraColumns.join(", ")}`,
      );
    }

    try {
      const [inserted] = await pg
        .withSchema(schemaName)
        .table(tableName)
        .insert(record)
        .returning("*");

      return inserted;
    } catch (e) {
      throw new DatabaseError("Failed to insert record", e);
    }
  },
  async updateRecord(
    pg: Knex,
    tableName: string,
    id: any,
    updates: object,
    schemaName: string = "public",
  ) {
    const pk = await getPrimaryKey(pg, tableName, schemaName);

    const rows = await pg("information_schema.columns")
      .select("column_name")
      .where({
        table_schema: schemaName,
        table_name: tableName,
      });

    const tableColumns = new Set(rows.map((r) => r.column_name));
    const cleanUpdates: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (tableColumns.has(key)) {
        cleanUpdates[key] = value;
      }
    });

    if (Object.keys(cleanUpdates).length === 0) {
      throw new DatabaseError("No valid columns provided for this update");
    }

    try {
      const [updated] = await pg
        .withSchema(schemaName)
        .from(tableName)
        .where(pk, id)
        .update(cleanUpdates)
        .returning("*");

      if (!updated) {
        throw new NotFoundError(`Record with ID ${id} not found`);
      }

      return updated;
    } catch (e) {
      if (e instanceof NotFoundError) throw e;
      throw new DatabaseError("Failed to update record", e);
    }
  },
  async deleteRecord(
    pg: Knex,
    tableName: string,
    id: any,
    schemaName: string = "public",
  ) {
    const pk = await getPrimaryKey(pg, tableName, schemaName);

    try {
      const [deleted] = await pg
        .withSchema(schemaName)
        .from(tableName)
        .where(pk, id)
        .del()
        .returning("*");

      if (!deleted) {
        throw new NotFoundError(`Record with ID ${id} not found`);
      }

      return deleted;
    } catch (e) {
      if (e instanceof NotFoundError) throw e;
      throw new DatabaseError("Failed to delete record", e);
    }
  },
};
