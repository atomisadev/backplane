import { Elysia } from "elysia";
import type { Session, User } from "better-auth";
import { auth } from "../auth";

export const authMiddleware = new Elysia().macro({
  auth: {
    async resolve({ request: { headers }, set }) {
      const session = await auth.api.getSession({
        headers,
      });

      if (!session) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});
