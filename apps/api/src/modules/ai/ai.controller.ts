import { Elysia, t } from "elysia";
import { getAuthSession } from "../../auth";
import { aiService } from "./ai.service";
import { prisma } from "../../db";
import { NotFoundError } from "../../errors";
import { Stream } from "@elysiajs/stream";

export const aiController = new Elysia({ prefix: "/ai" }).post(
  "/chat",
  async ({ request, body, set }) => {
    const session = await getAuthSession(request.headers);
    if (!session) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    const { projectId, messages, model } = body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, schemaSnapshot: true, dbType: true },
    });

    if (!project || project.userId !== session.user.id) {
      throw new NotFoundError("Project not found");
    }

    const schemaContext = project.schemaSnapshot
      ? JSON.stringify(project.schemaSnapshot)
      : "No schema defined yet.";

    const systemPrompt = `
      You are Backplane AI, an expert database architect.
      CONTEXT:
      - Database Type: ${project.dbType}
      - Current Schema: ${schemaContext}
      INSTRUCTIONS:
      - Help the user design their database.
      - Suggest tables, columns, and indexes.
      - If asked for SQL, write valid SQL for ${project.dbType}.
      - Be concise, technical, and helpful.
    `;

    try {
      const googleStream = await aiService.streamChat(
        model,
        systemPrompt,
        messages,
      );

      console.log("[AI Controller] Starting stream response");

      return new Stream(async function* () {
        let chunkCount = 0;
        try {
          for await (const chunk of googleStream) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              console.log(
                `[AI Controller] Yielding chunk #${++chunkCount}: ${text.length} chars`,
              );
              yield text;
            }
          }
          console.log(
            `[AI Controller] Stream finished. Total chunks: ${chunkCount}`,
          );
        } catch (streamErr) {
          console.error("[AI Controller] Error during streaming:", streamErr);
          throw streamErr;
        }
      });
    } catch (error) {
      console.error("[AI Controller] Stream setup error", error);
      throw error;
    }
  },
  {
    body: t.Object({
      projectId: t.String(),
      messages: t.Array(
        t.Object({
          role: t.String(),
          content: t.String(),
        }),
      ),
      model: t.String(),
    }),
  },
);
