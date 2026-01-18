import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useAiChat() {
  const { id: projectId } = useParams() as { id: string };
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello. I can help you design your schema, suggest indexes, or generate migration SQL.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, model: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: Message = { role: "user", content };

      setMessages((prev) => [
        ...prev,
        userMsg,
        { role: "assistant", content: "" },
      ]);

      setIsLoading(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("http://localhost:3001/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            projectId,
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            model,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized. Please sign in again.");
          }
          const text = await response.text();
          throw new Error(text || "Failed to send message");
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = "";
        let buffer = ""; // Buffer for SSE lines

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split("\n");
          // Keep the last line in buffer as it might be incomplete
          buffer = lines.pop() || "";

          for (const line of lines) {
            // Check for both "data: " prefix and raw chunks if backend doesn't send "data:"
            let data = "";
            if (line.trim().startsWith("data: ")) {
              data = line.trim().slice(6);
            } else if (line.trim().length > 0) {
              // Try to handle raw text lines if not SSE formatted
              data = line;
            }

            if (data && data !== "[DONE]") {
              // If it looks like JSON string (old format), parse it
              if (data.startsWith('"') && data.endsWith('"')) {
                try {
                  assistantMessage += JSON.parse(data);
                } catch {
                  assistantMessage += data;
                }
              } else {
                assistantMessage += data;
              }
            }
          }

          setMessages((prev) => {
            const newHistory = [...prev];
            const lastMsg = newHistory[newHistory.length - 1];
            if (lastMsg.role === "assistant") {
              lastMsg.content = assistantMessage;
            }
            return newHistory;
          });
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Chat error:", error);
          toast.error("Failed to generate response. Check console.");

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last.role === "assistant" && last.content === "") {
              return prev.slice(0, -1);
            }
            return prev;
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [projectId, messages, isLoading],
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    stopGeneration,
  };
}
