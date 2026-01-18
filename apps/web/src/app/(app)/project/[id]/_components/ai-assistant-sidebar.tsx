import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, User as UserIcon, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useAiChat } from "../_hooks/use-ai-chat";

interface AiAssistantSidebarProps {
  onClose: () => void;
}

export function AiAssistantSidebar({ onClose }: AiAssistantSidebarProps) {
  const { data: session } = authClient.useSession();
  const { messages, isLoading, sendMessage, stopGeneration } = useAiChat();

  const [input, setInput] = useState("");
  const [model, setModel] = useState("gemini-2.5-pro");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input, model);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-[400px] h-full border-l border-border bg-background flex flex-col shadow-xl z-20 animate-in slide-in-from-right-10 duration-200">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-foreground" />
          <span className="text-sm font-semibold">AI Architect</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-4",
                msg.role === "user" ? "flex-row-reverse" : "",
              )}
            >
              <Avatar className="h-8 w-8 shrink-0 border border-border">
                {msg.role === "user" ? (
                  <>
                    <AvatarImage src={session?.user?.image ?? undefined} />
                    <AvatarFallback className="bg-muted text-xs">
                      {session?.user?.name ? (
                        session.user.name.charAt(0).toUpperCase()
                      ) : (
                        <UserIcon className="size-3" />
                      )}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                    AI
                  </AvatarFallback>
                )}
              </Avatar>

              <div
                className={cn(
                  "space-y-1 flex flex-col max-w-[85%]",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div className="text-sm font-medium">
                  {msg.role === "user"
                    ? session?.user?.name || "You"
                    : "Backplane AI"}
                </div>
                <div
                  className={cn(
                    "text-sm leading-relaxed whitespace-pre-wrap font-sans",
                    msg.role === "user"
                      ? "text-foreground bg-muted/50 px-3 py-2 rounded-md text-right"
                      : "text-muted-foreground",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading &&
            messages[messages.length - 1]?.role === "assistant" &&
            messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-4">
                <Avatar className="h-8 w-8 shrink-0 border border-border">
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs text-muted-foreground animate-pulse self-center">
                  Thinking...
                </div>
              </div>
            )}
        </div>
      </ScrollArea>

      {/* Footer Area */}
      <div className="p-4 border-t border-border bg-background shrink-0">
        <div className="relative">
          <Textarea
            placeholder="Describe your schema changes..."
            className="min-h-[120px] pb-12 resize-none bg-transparent"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Select
              defaultValue={model}
              onValueChange={setModel}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-3-flash" className="text-xs">
                  Gemini 3 Flash
                </SelectItem>
                <SelectItem value="gemini-2.5-pro" className="text-xs">
                  Gemini 2.5 Pro
                </SelectItem>
              </SelectContent>
            </Select>

            {isLoading ? (
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={stopGeneration}
                variant="destructive"
              >
                <StopCircle className="size-3.5" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
