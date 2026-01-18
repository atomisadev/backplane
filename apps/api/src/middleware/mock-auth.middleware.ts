import { Elysia } from "elysia";
import { mockService } from "../modules/mock/mock.service";
import { UnauthorizedError } from "../errors/handler";
import { Prisma } from "@prisma/client";

type MockSessionWithProject = Prisma.MockSessionGetPayload<{
  include: { project: true };
}>;

export const mockAuthMiddleware = new Elysia({ name: "mock-auth" })
  .decorate("mockSession", null as MockSessionWithProject | null)
  .macro({
    requireMockAuth: {
      async resolve({ request: { headers }, set }) {
        const authHeader = headers.get("authorization");

        if (!authHeader) {
          set.status = 401;
          throw new UnauthorizedError("Missing Authorization header");
        }

        if (!authHeader.startsWith("Bearer ")) {
          set.status = 401;
          throw new UnauthorizedError(
            "Invalid Authorization format. Expected 'Bearer <token>'",
          );
        }

        const rawToken = authHeader.slice(7).trim();
        if (!rawToken) {
          set.status = 401;
          throw new UnauthorizedError("Missing token");
        }

        const session = await mockService.validateSession(rawToken);

        // This return makes it available to downstream handlers as `mockSession`
        return { mockSession: session };
      },
    },
  });
