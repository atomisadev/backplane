import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./auth";
import { apiModules } from "./modules";
import { introspectController } from "./introspect/introspect.controller";
import { errorHandler } from "./errors/handler";

const app = new Elysia()
  .use(errorHandler)
  .use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(apiModules)
  .all("/api/auth/*", async ({ request, set }) => {
    try {
      const response = await auth.handler(request);
      return response;
    } catch (error) {
      console.error("Auth handler error:", error);
      set.status = 500;
      throw error;
    }
  })
  .use(introspectController)
  .get("/", () => "Hello Elysia")
  .listen(3001);

export type App = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
