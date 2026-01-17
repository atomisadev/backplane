"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Table2,
  Columns,
  Trash2,
  ArrowRight,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingChange } from "../page";

interface ReviewChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: PendingChange[];
  onRemoveChange: (index: number) => void;
  onDiscardAll: () => void;
  onPublish: () => void;
  isPublishing: boolean;
}

export function ReviewChangesDialog({
  open,
  onOpenChange,
  changes,
  onRemoveChange,
  onDiscardAll,
  onPublish,
  isPublishing,
}: ReviewChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader className="px-6 py-5 border-b border-border/40 bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Review Changes
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Review your pending schema migrations before applying them.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="h-6 gap-1.5 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {changes.length} Pending
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] min-h-[200px]">
          <div className="p-0 divide-y divide-border/40">
            {changes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-3">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <Save className="size-6 opacity-20" />
                </div>
                <p className="text-sm">No pending changes found.</p>
              </div>
            ) : (
              changes.map((change, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border/50 bg-background shadow-sm">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {idx + 1}
                        </span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ChangeTypeBadge type={change.type} />
                        <span className="text-xs font-mono text-muted-foreground">
                          {change.schema}.{change.table}
                        </span>
                      </div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        {change.type === "CREATE_TABLE" ? (
                          <>
                            <Table2 className="size-3.5 text-primary" />
                            <span>Create table</span>
                            <code className="bg-muted/50 px-1 py-0.5 rounded text-xs">
                              {change.table}
                            </code>
                          </>
                        ) : (
                          <>
                            <Columns className="size-3.5 text-muted-foreground" />
                            <span>Add column</span>
                            <code className="bg-muted/50 px-1 py-0.5 rounded text-xs">
                              {change.column.name}
                            </code>
                            <span className="text-muted-foreground text-xs">
                              as
                            </span>
                            <span className="font-mono text-xs text-primary">
                              {change.column.type}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => onRemoveChange(idx)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between px-6 py-4 bg-muted/5 border-t border-border/40 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscardAll}
            disabled={changes.length === 0 || isPublishing}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5 mr-2" />
            Discard All
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onPublish}
              disabled={changes.length === 0 || isPublishing}
              className="min-w-[100px]"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="size-3.5 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  Publish
                  <ArrowRight className="size-3.5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeTypeBadge({ type }: { type: string }) {
  if (type === "CREATE_TABLE") {
    return (
      <Badge
        variant="secondary"
        className="h-5 px-1.5 text-[9px] bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"
      >
        CREATE TABLE
      </Badge>
    );
  }
  if (type === "CREATE_COLUMN") {
    return (
      <Badge
        variant="secondary"
        className="h-5 px-1.5 text-[9px] bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
      >
        ADD COLUMN
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="h-5 px-1.5 text-[9px]">
      {type}
    </Badge>
  );
}
