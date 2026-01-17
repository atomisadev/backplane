"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSchemaMutation } from "../_hooks/use-schema-mutation";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetTable: {
    schema: string;
    name: string;
  } | null;
  onAdd: (column: ColumnDefinition) => void;
}

const POSTGRES_TYPES = [
  { label: "Text / String", options: ["VARCHAR", "TEXT", "CHAR"] },
  {
    label: "Number",
    options: ["INTEGER", "BIGINT", "DECIMAL", "NUMERIC", "REAL"],
  },
  { label: "Boolean", options: ["BOOLEAN"] },
  { label: "Date / Time", options: ["TIMESTAMP", "DATE", "TIME"] },
  { label: "Advanced", options: ["UUID", "JSONB", "JSON"] },
];

export function AddColumnDialog({
  open,
  onOpenChange,
  targetTable,
  onAdd,
}: AddColumnDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("VARCHAR");
  const [length, setLength] = useState("255");
  const [isNullable, setIsNullable] = useState(true);
  const [defaultValue, setDefaultValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setType("VARCHAR");
      setLength("255");
      setIsNullable(true);
      setDefaultValue("");
      setError(null);
    }
  }, [open]);

  const needsLength = ["VARCHAR", "CHAR"].includes(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Column name is required");
      return;
    }

    let sqlType = type;
    if (needsLength && length) {
      sqlType = `${type}(${length})`;
    }

    onAdd({
      name,
      type: sqlType,
      nullable: isNullable,
      defaultValue: defaultValue || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] gap-0 p-0 overflow-hidden border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 py-5 border-b border-border/40 bg-muted/5">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Add Column
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-muted-foreground pt-1 flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary/50" />
              {targetTable?.schema}.{targetTable?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="col-name"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Column Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="col-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. is_active"
                className="font-mono text-sm bg-muted/20 border-border/60 focus:bg-background transition-all"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-5 gap-4">
              <div
                className={cn(
                  "space-y-2",
                  needsLength ? "col-span-3" : "col-span-5",
                )}
              >
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Data Type <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="font-mono text-xs h-9 bg-muted/20 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {POSTGRES_TYPES.map((group) => (
                      <React.Fragment key={group.label}>
                        <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                          {group.label}
                        </div>
                        {group.options.map((t) => (
                          <SelectItem
                            key={t}
                            value={t}
                            className="font-mono text-xs pl-4"
                          >
                            {t}
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsLength && (
                <div className="col-span-2 space-y-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Length
                  </Label>
                  <Input
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="font-mono text-sm h-9 bg-muted/20 border-border/60"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Constraints
              </Label>
              <div className="grid grid-cols-1 gap-3">
                <div
                  className={cn(
                    "flex items-start space-x-3 rounded-lg border p-3 transition-colors",
                    !isNullable
                      ? "bg-primary/5 border-primary/20"
                      : "bg-transparent border-border/60 hover:bg-muted/20",
                  )}
                >
                  <Checkbox
                    id="not-null"
                    checked={!isNullable}
                    onCheckedChange={(c) => setIsNullable(!c)}
                    className="mt-0.5"
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor="not-null"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      NOT NULL
                    </label>
                    <p className="text-[10px] text-muted-foreground">
                      Prevents NULL values from being stored.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="default"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Default Value
              </Label>
              <Input
                id="default"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="e.g. 'active' or NOW()"
                className="font-mono text-sm bg-muted/20 border-border/60 focus:bg-background transition-all"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-muted/5 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-8 text-xs font-medium gap-2">
              Add Column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
