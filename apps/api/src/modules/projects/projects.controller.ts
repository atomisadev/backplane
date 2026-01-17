import { Elysia, t } from "elysia";
import { getAuthSession } from "../../auth";
import { projectService } from "./projects.service";

const DbTypeEnum = t.Union([t.Literal("postgres"), t.Literal("mysql")]);

export const projectsController = new Elysia({ prefix: "/projects" })
  .post(
    "/",
    async ({ request, body, set }) => {
      const session = await getAuthSession(request.headers);
      if (!session) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      try {
        const project = await projectService.create({
          userId: session.user.id,
          name: body.name,
          dbType: body.db_type as "postgres" | "mysql",
          connectionUri: body.connection_uri,
        });

        return {
          success: true,
          data: project,
        };
      } catch (e) {
        console.error("Project creation error:", e);
        set.status = 500;
        return { success: false, message: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        db_type: DbTypeEnum,
        connection_uri: t.String({ minLength: 5 }),
      }),
    },
  )

  .get("/", async ({ request, set }) => {
    const session = await getAuthSession(request.headers);
    if (!session) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    const projects = await projectService.getAllByUser(session.user.id);

    return {
      success: true,
      data: projects,
    };
  })

  .get(
    "/:id",
    async ({ request, params: { id }, set }) => {
      const session = await getAuthSession(request.headers);
      if (!session) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const project = await projectService.getById(session.user.id, id);

      if (!project) {
        set.status = 404;
        return { success: false, message: "Project not found" };
      }

      return {
        success: true,
        data: project,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
