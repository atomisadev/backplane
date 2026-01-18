import { Elysia } from "elysia";
import { mockService } from "../modules/mock/mock.service";
import { UnauthorizedError, ForbiddenError } from "../errors/handler";
import { Prisma } from "@prisma/client";

type MockSessionWithProject = Prisma.MockSessionGetPayload<{
  include: { project: true };
}>;

export const mockAuthMiddleware = new Elysia({ name: "mock-auth" })
  .decorate("mockSession", null as MockSessionWithProject | null)
  .derive(async ({ request: { headers } }) => {
    const authHeader = headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { mockSession: null };
    }

    const token = authHeader.slice(7);

    try {
      const session = await mockService.validateSession(token);
      return { mockSession: session };
    } catch (e) {
      return { mockSession: null };
    }
  })
  .macro({
    requireMockAuth: {
      async resolve({ mockSession, set }) {
        if (!mockSession) {
          set.status = 401;
          throw new UnauthorizedError("Invalid or expired mock session token");
        }
      },
    },
  });
