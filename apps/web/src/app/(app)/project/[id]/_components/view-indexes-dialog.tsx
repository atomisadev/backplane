"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIndexes } from "../_hooks/use-indexes";
import { useParams } from "next/navigation";
import { Loader2, Fingerprint, Check, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewIndexesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetTable: {
    schema: string;
    name: string;
  } | null;
}

export function ViewIndexesDialog({
  open,
  onOpenChange,
  targetTable,
}: ViewIndexesDialogProps) {
  const { id: projectId } = useParams() as { id: string };

  const {
    data: indexes,
    isLoading,
    error,
  } = useIndexes(projectId, targetTable?.schema, targetTable?.name, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader className="px-6 py-5 border-b border-border/40 bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Fingerprint className="size-4 text-primary" />
                Table Indexes
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary/50" />
                {targetTable?.schema}.{targetTable?.name}
              </DialogDescription>
            </div>
            {indexes && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {indexes.length} Index{indexes.length !== 1 ? "es" : ""}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-0 min-h-[200px] max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[200px] gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary/50" />
              <p className="text-xs font-medium">
                Fetching index definitions...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-destructive p-6 text-center">
              <Shield className="size-8 opacity-50" />
              <p className="text-sm font-semibold">Failed to load indexes</p>
              <p className="text-xs opacity-70">{(error as Error).message}</p>
            </div>
          ) : !indexes?.length ? (
            <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-muted-foreground">
              <p className="text-sm">No indexes found on this table.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {indexes.map((idx) => {
                const columns = Array.isArray(idx.columns)
                  ? idx.columns
                  : typeof idx.columns === "string"
                    ? (idx.columns as string).replace(/^{|}$/g, "").split(",")
                    : [];

                return (
                  <div
                    key={idx.name}
                    className={cn(
                      "group flex flex-col gap-3 p-5 transition-colors hover:bg-muted/30",
                      idx.primary && "bg-amber-500/5 hover:bg-amber-500/10",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium truncate text-foreground">
                            {idx.name}
                          </span>
                          {idx.primary && (
                            <Badge className="h-4 px-1.5 text-[9px] bg-amber-500 hover:bg-amber-600 border-transparent text-white">
                              PRIMARY
                            </Badge>
                          )}
                          {idx.unique && !idx.primary && (
                            <Badge
                              variant="secondary"
                              className="h-4 px-1.5 text-[9px]"
                            >
                              UNIQUE
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                          {idx.method}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {columns.map((col) => (
                        <div
                          key={col}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-background border border-border/60 text-[11px] font-mono text-muted-foreground shadow-sm"
                        >
                          <span className="opacity-50 mr-1.5">#</span>
                          {col}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
