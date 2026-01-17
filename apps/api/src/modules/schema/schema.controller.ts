import { Elysia, t } from "elysia";
import { getAuthSession } from "../../auth";
import { schemaService } from "./schema.service";

export const schemaController = new Elysia({ prefix: "/schema" })
  .get(
    "/:projectId/indexes",
    async ({ request, params: { projectId }, query, set }) => {
      const session = await getAuthSession(request.headers);

      if (!session) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const pg = await schemaService.getProjectConnection(
        session.user.id,
        projectId,
      );

      try {
        const indexes = await schemaService.getIndexes(
          pg,
          query.schema,
          query.table,
        );

        return {
          success: true,
          data: indexes,
        };
      } finally {
        await pg.destroy();
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      query: t.Object({
        schema: t.String(),
        table: t.String(),
      }),
    },
  )
  .post(
    "/:projectId/columns",
    async ({ request, params: { projectId }, body, set }) => {
      const session = await getAuthSession(request.headers);
      if (!session) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const pg = await schemaService.getProjectConnection(
        session.user.id,
        projectId,
      );

      try {
        await schemaService.createColumn(
          pg,
          body.schema,
          body.table,
          body.column,
        );

        return {
          success: true,
          message: "Column created successfully",
        };
      } finally {
        await pg.destroy();
      }
    },
    {
      params: t.Object({
        projectId: t.String(),
      }),
      body: t.Object({
        schema: t.String(),
        table: t.String(),
        column: t.Object({
          name: t.String({ minLength: 1 }),
          type: t.String({ minLength: 1 }),
          nullable: t.Boolean(),
          defaultValue: t.Optional(t.String()),
        }),
      }),
    },
  );
