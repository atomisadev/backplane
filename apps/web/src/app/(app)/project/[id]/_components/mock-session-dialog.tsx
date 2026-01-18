"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Terminal,
  Plus,
  Trash2,
  Copy,
  Check,
  Key,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useMockSessions } from "../_hooks/use-mock-session";
import { toast } from "sonner";

interface MockSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MockSessionDialog({
  open,
  onOpenChange,
}: MockSessionDialogProps) {
  const { id: projectId } = useParams() as { id: string };
  const { sessions, createSession, revokeSession } = useMockSessions(projectId);

  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const handleCreate = async () => {
    try {
      const result = await createSession.mutateAsync();
      if (result) {
        setGeneratedToken(result.token);
        toast.success("Mock session created successfully");
      }
    } catch (e) {
      toast.error("Failed to create session");
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeSession.mutateAsync(id);
      toast.success("Session revoked");
    } catch (e) {
      toast.error("Failed to revoke session");
    }
  };

  const copyToClipboard = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    toast.success("API Key copied to clipboard");
  };

  const copyCurl = () => {
    if (!generatedToken) return;
    const curlCommand = `curl -X GET http://localhost:3001/api/mock/${projectId}/<table_name> \\
  -H "Authorization: Bearer ${generatedToken}"`;
    navigator.clipboard.writeText(curlCommand);
    toast.success("cURL command copied");
  };

  const handleClose = () => {
    if (generatedToken) {
      setGeneratedToken(null);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader className="px-6 py-5 border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Mock Sessions
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                Manage temporary API keys for testing your schema.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          {generatedToken ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="size-4 text-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    Save this key securely
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 group">
                    <Input
                      readOnly
                      value={generatedToken}
                      className="font-mono text-xs h-9 bg-muted/30 pr-10"
                    />
                    <div className="absolute right-0 top-0 h-full w-10 flex items-center justify-center pointer-events-none">
                      <Key className="size-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-9 min-w-[80px]"
                  >
                    {hasCopied ? (
                      <Check className="size-3.5 mr-1.5" />
                    ) : (
                      <Copy className="size-3.5 mr-1.5" />
                    )}
                    {hasCopied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Quick Start (Terminal)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs font-mono justify-between text-muted-foreground"
                    onClick={copyCurl}
                  >
                    <span>Copy cURL Command</span>
                    <Terminal className="size-3" />
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground mt-3">
                  This key grants read/write access to the mock endpoints. It
                  will not be shown again once you close this dialog.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGeneratedToken(null)}
                >
                  I have saved it
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Active Sessions</h3>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleCreate}
                  disabled={createSession.isPending}
                >
                  <Plus className="size-3.5" />
                  Create Session
                </Button>
              </div>

              <div className="rounded-lg border border-border/50 bg-background/50 overflow-hidden">
                <ScrollArea className="h-[200px]">
                  {sessions.isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                      <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : sessions.data?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground/50 text-center p-4">
                      <Terminal className="size-8 mb-2 opacity-20" />
                      <p className="text-xs">No active mock sessions.</p>
                      <p className="text-[10px]">
                        Create one to start testing your API.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {sessions.data?.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="font-mono text-[10px] h-5 rounded-md px-1.5"
                              >
                                {session.id.slice(0, 8)}...
                              </Badge>
                              <span className="text-[10px] font-medium text-foreground/80 flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-foreground/80" />
                                Active
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                Created{" "}
                                {new Date(
                                  session.createdAt,
                                ).toLocaleDateString()}
                              </span>
                              <span className="opacity-30">•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                Expires{" "}
                                {new Date(session.expiresAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevoke(session.id)}
                            disabled={revokeSession.isPending}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="rounded-md bg-muted/30 p-3 text-[10px] text-muted-foreground border border-border/40">
                <p className="font-medium text-foreground mb-1.5">How to use</p>
                <p className="mb-2 opacity-80">
                  Include the token in your request headers:
                </p>
                <code className="block p-2 bg-background border border-border/50 rounded font-mono text-xs select-all text-foreground">
                  Authorization: Bearer &lt;token&gt;
                </code>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
