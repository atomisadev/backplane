import { Elysia } from "elysia";
import { auth } from "../../auth";

export const authController = new Elysia({ prefix: "/auth" }).mount(
  auth.handler,
);
