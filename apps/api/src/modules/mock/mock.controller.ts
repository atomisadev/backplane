import { Elysia, t } from "elysia";
import { requireAPIToken } from "../../middleware/mockAuto.middleware";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import knex from "knex";
import { decrypt } from "../../lib/crypto";
import { mockService } from "./mock.service";
import { NotFoundError } from "../../errors";

const getProjectConnection = async (projectID: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectID },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const connectionString = decrypt(project.connectionUri);

  return knex({
    client: "pg",
    connection: connectionString,
    pool: { min: 0, max: 5 },
  });
};

export const mockController = new Elysia({ prefix: "/mock" })
  .get(
    "/:projectID/:tableName",
    async ({ params: { projectID, tableName }, query: { schema }, set }) => {
      const pg = await getProjectConnection(projectID);

      try {
        const res = await mockService.findAllRecords(
          pg,
          tableName,
          schema ?? "public",
        );
        return { success: true, data: res };
      } finally {
        await pg.destroy();
      }
    },
    {
      params: t.Object({
        projectID: t.String(),
        tableName: t.String(),
      }),
      query: t.Object({
        schema: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/:projectID/:tableName/:id",
    async ({
      params: { projectID, tableName, id },
      query: { schema },
      set,
    }) => {
      const pg = await getProjectConnection(projectID);

      try {
        const res = await mockService.findRecordWithID(
          pg,
          tableName,
          id,
          schema ?? "public",
        );
        return { success: true, data: res };
      } finally {
        await pg.destroy();
      }
    },
    {
      params: t.Object({
        projectID: t.String(),
        tableName: t.String(),
        id: t.String(),
      }),
      query: t.Object({
        schema: t.Optional(t.String()),
      }),
    },
  )

  .post(
    "/:projectID/:tableName",
    async ({
      params: { projectID, tableName },
      query: { schema },
      body,
      set,
    }) => {
      const pg = await getProjectConnection(projectID);

      try {
        const res = await mockService.addRecord(
          pg,
          tableName,
          body,
          schema ?? "public",
        );
        set.status = 201;
        return { success: true, data: res };
      } finally {
        await pg.destroy();
      }
    },
    {
      params: t.Object({
        projectID: t.String(),
        tableName: t.String(),
      }),
      query: t.Object({
        schema: t.Optional(t.String()),
      }),
      body: t.Object({}, { additionalProperties: true }),
    },
  )

  .patch(
    "/:projectID/:tableName/:id",
    async ({
      params: { projectID, tableName, id },
      query: { schema },
      body,
      set,
    }) => {
      const pg = await getProjectConnection(projectID);

      try {
        const res = await mockService.updateRecord(
          pg,
          tableName,
          id,
          body,
          schema ?? "public",
        );
        return { success: true, data: res };
      } finally {
        await pg.destroy();
      }
    },
    {
      params: t.Object({
        projectID: t.String(),
        tableName: t.String(),
        id: t.String(),
      }),
      query: t.Object({
        schema: t.Optional(t.String()),
      }),
      body: t.Object({}, { additionalProperties: true }),
    },
  )

  .delete(
    "/:projectID/:tableName/:id",
    async ({
      params: { projectID, tableName, id },
      query: { schema },
      set,
    }) => {
      const pg = await getProjectConnection(projectID);

      try {
        const res = await mockService.deleteRecord(
          pg,
          tableName,
          id,
          schema ?? "public",
        );
        return { success: true, data: res };
      } finally {
        await pg.destroy();
      }
    },
    {
      params: t.Object({
        projectID: t.String(),
        tableName: t.String(),
        id: t.String(),
      }),
      query: t.Object({
        schema: t.Optional(t.String()),
      }),
    },
  );
