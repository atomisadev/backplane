import { Elysia, t } from "elysia";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import knex from "knex";
import { decrypt } from "../../lib/crypto";
import { mockService } from "./mock.service";
import { ForbiddenError, NotFoundError } from "../../errors";
import { getAuthSession } from "../../auth";
import { mockAuthMiddleware } from "../../middleware/mock-auth.middleware";

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
  .post(
    "/session",
    async ({ request, body, set }) => {
      const authSession = await getAuthSession(request.headers);
      if (!authSession) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const result = await mockService.createSession(
          body.projectId,
          authSession.user.id,
        );
        return { success: true, data: result };
      } catch (e) {
        console.error("Failed to create mock session", e);
        throw e;
      }
    },
    {
      body: t.Object({
        projectId: t.String(),
      }),
    },
  )
  .group("/:projectID", (app) =>
    app
      .use(mockAuthMiddleware)
      .guard({ requireMockAuth: true })
      .onBeforeHandle(({ params: { projectID }, mockSession }) => {
        if (!mockSession || mockSession.projectId !== projectID) {
          throw new ForbiddenError(
            "This session token is not valid for the requested project",
          );
        }
      })
      .get(
        "/:tableName",
        async ({
          params: { projectID, tableName },
          query: { schema },
          set,
        }) => {
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
        "/:tableName/:id",
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
        "/:tableName",
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
        "/:tableName/:id",
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
        "/:tableName/:id",
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
      ),
  );
