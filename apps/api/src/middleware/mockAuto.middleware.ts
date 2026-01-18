import { Elysia } from "elysia";

export const requireAPIToken = () =>
  new Elysia({ name: "requireApiToken" }).onBeforeHandle(({ request, set }) => {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ")
      ? auth.slice("Bearer ".length)
      : "";

    // Check if token is in db or somethign.
  });
