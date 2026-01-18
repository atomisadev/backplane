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
import { Table2, Columns, Trash2, Loader2, ArrowUpRight } from "lucide-react";
import { PendingChange } from "@/lib/types";

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
      <DialogContent className="sm:max-w-[550px] gap-0 p-0 overflow-hidden border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader className="px-6 py-5 border-b border-border/40">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Review Changes
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Verify the schema migrations below before publishing.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] min-h-[150px]">
          <div className="flex flex-col">
            {changes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 gap-2">
                <div className="size-8 rounded-full border border-border/50 flex items-center justify-center">
                  <ArrowUpRight className="size-4" />
                </div>
                <p className="text-xs font-medium">No pending changes</p>
              </div>
            ) : (
              changes.map((change, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between px-6 py-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4 overflow-hidden">
                    <div className="mt-0.5 flex-shrink-0 text-muted-foreground/40 text-[10px] font-mono w-4">
                      {(idx + 1).toString().padStart(2, "0")}
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {change.type === "CREATE_TABLE" ? (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/70">
                            Create Table
                          </span>
                        ) : change.type === "DROP_TABLE" ? (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-destructive">
                            Drop Table
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Update Table
                          </span>
                        )}
                      </div>

                      <div className="text-sm flex items-center gap-2 truncate">
                        {change.type === "CREATE_TABLE" ? (
                          <>
                            <Table2 className="size-3.5 text-foreground/50" />
                            <span className="font-mono text-foreground font-medium">
                              {change.table}
                            </span>
                          </>
                        ) : change.type === "DROP_TABLE" ? (
                          <>
                            <Trash2 className="size-3.5 text-destructive/50" />
                            <span className="font-mono text-destructive font-medium line-through opacity-80">
                              {change.table}
                            </span>
                          </>
                        ) : change.type === "UPDATE_COLUMN" ? (
                          <div className="flex flex-col gap-2">
                            {change.oldColumn?.name !== change.column?.name && (
                              <div className="text-sm flex items-center gap-2 truncate">
                                <Columns className="size-3.5 text-muted-foreground/50" />
                                <span className="text-muted-foreground">
                                  Edit column
                                </span>
                                <code className="font-mono text-foreground font-medium bg-muted/50 px-1 rounded-[2px]">
                                  {change.oldColumn?.name || "unknown"}
                                </code>
                                <span className="text-muted-foreground text-xs">
                                  in
                                </span>
                                <span className="font-mono text-muted-foreground/80">
                                  {change.table}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  to
                                </span>
                                <code className="font-mono text-foreground font-medium bg-muted/50 px-1 rounded-[2px]">
                                  {change.column?.name || "unknown"}
                                </code>
                              </div>
                            )}

                            {change.oldColumn?.nullable !==
                              change.column?.nullable && (
                              <div className="text-sm flex items-center gap-2 truncate">
                                <Columns className="size-3.5 text-muted-foreground/50" />
                                <span className="text-muted-foreground">
                                  Edit column
                                </span>
                                <code className="font-mono text-foreground font-medium bg-muted/50 px-1 rounded-[2px]">
                                  {change.oldColumn?.name || "unknown"}
                                </code>
                                <span className="text-muted-foreground text-xs">
                                  in
                                </span>
                                <span className="font-mono text-muted-foreground/80">
                                  {change.table}
                                </span>
                                <span className="text-muted-foreground">
                                  is{" "}
                                  {change.column?.nullable
                                    ? "now"
                                    : "no longer"}{" "}
                                  nullable.
                                </span>
                              </div>
                            )}

                            {change.oldColumn?.defaultValue !==
                              change.column?.defaultValue && (
                              <div className="text-sm flex items-center gap-2 truncate">
                                <Columns className="size-3.5 text-muted-foreground/50" />
                                <span className="text-muted-foreground">
                                  Changed default value of column
                                </span>
                                <code className="font-mono text-foreground font-medium bg-muted/50 px-1 rounded-[2px]">
                                  {change.oldColumn?.name || "unknown"}
                                </code>
                                <span className="text-muted-foreground text-xs">
                                  in
                                </span>
                                <span className="font-mono text-muted-foreground/80">
                                  {change.table}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  to
                                </span>
                                <code className="font-mono text-foreground font-medium bg-muted/50 px-1 rounded-[2px]">
                                  {change.column?.defaultValue}
                                </code>
                              </div>
                            )}
                          </div>
                        ) : change.type === "DELETE_COLUMN" ? (
                          <>
                            <Columns className="size-3.5 text-muted-foreground/50" />
                            <span className="text-muted-foreground">
                              Delete column
                            </span>
                            <code className="font-mono text-foreground font-medium bg-muted/50 px-1 rounded-[2px]">
                              {change.column?.name || "unknown"}
                            </code>
                            <span className="text-muted-foreground text-xs">
                              from
                            </span>
                            <span className="font-mono text-muted-foreground/80">
                              {change.table}
                            </span>
                          </>
                        ) : (
                          <>
                            <Columns className="size-3.5 text-muted-foreground/50" />
                            <span className="text-muted-foreground">
                              Add column
                            </span>
                            <code className="font-mono text-foreground font-medium bg-muted/50 px-1 rounded-[2px]">
                              {change.column?.name || "unknown"}
                            </code>
                            <span className="text-muted-foreground text-xs">
                              to
                            </span>
                            <span className="font-mono text-muted-foreground/80">
                              {change.table}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-4"
                    onClick={() => onRemoveChange(idx)}
                  >
                    <Trash2 className="size-3.5" />
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
            className="text-muted-foreground hover:text-destructive hover:bg-transparent px-0 h-auto font-normal text-xs"
          >
            <Trash2 className="size-3 mr-1.5" />
            Discard all
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPublishing}
              className="text-muted-foreground hover:text-foreground"
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
                <Loader2 className="size-3.5 mr-2 animate-spin" />
              ) : (
                <ArrowUpRight className="size-3.5 mr-2" />
              )}
              {isPublishing ? "Applying..." : "Publish"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
