import { DatabaseError } from "../../errors";
import { GoogleGenAI } from "@google/genai";

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_KEY;

export const aiService = {
  async streamChat(
    model: string,
    systemPrompt: string,
    messages: { role: string; content: string }[],
  ) {
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_KEY is not set");
    }

    const client = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

    const apiModel = model.includes("flash")
      ? "gemini-3-flash-preview"
      : "gemini-2.5-pro";

    const formattedContents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    try {
      console.log(`[AI Service] Stream chat requested for model: ${apiModel}`);
      console.log(`[AI Service] Messages count: ${formattedContents.length}`);

      const responseStream = await client.models.generateContentStream({
        model: apiModel,
        contents: formattedContents,
        config: {
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          temperature: 0.2,
          maxOutputTokens: 2000,
        },
      });

      console.log("[AI Service] Stream established successfully");
      return responseStream;
    } catch (error: any) {
      console.error(
        "[AI Service] Google AI Error details:",
        JSON.stringify(error, null, 2),
      );
      throw new DatabaseError(`AI Provider Error: ${error.message}`);
    }
  },
};
