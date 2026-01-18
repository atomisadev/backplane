import { Elysia } from "elysia";
import { authController } from "./auth/auth.controller";
import { projectsController } from "./projects/projects.controller";
import { schemaController } from "./schema/schema.controller";
import { mockController } from "./mock/mock.controller";
import { liveblocksController } from "./liveblocks/liveblocks.controller";

export const apiModules = new Elysia({ prefix: "/api" })
  .use(authController)
  .use(projectsController)
  .use(schemaController)
  .use(mockController)
  .use(liveblocksController);
