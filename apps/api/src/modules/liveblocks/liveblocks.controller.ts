import { Elysia, t } from "elysia";
import { Liveblocks } from "@liveblocks/node";
import { getAuthSession } from "../../auth";
import { prisma } from "../../db";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export const liveblocksController = new Elysia({ prefix: "/liveblocks" }).post(
  "/auth",
  async ({ request, body, set }) => {
    const sessionAuth = await getAuthSession(request.headers);

    console.log(sessionAuth);

    if (!sessionAuth) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const roomId = body.room;
    const projectId = roomId.replace(/^project:/, "");

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true },
    });

    if (!project) {
      set.status = 404;
      return { error: "Project not found" };
    }

    const userId = sessionAuth.user.id;
    const userName = sessionAuth.user.name ?? sessionAuth.user.email ?? "User";

    const lbSession = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        email: sessionAuth.user.email,
      },
    });

    lbSession.allow(roomId, lbSession.FULL_ACCESS);

    const { status, body: tokenBody } = await lbSession.authorize();

    set.status = status;
    set.headers["content-type"] = "application/json";
    return tokenBody;
  },
  {
    body: t.Object({
      room: t.String(),
    }),
  },
);
