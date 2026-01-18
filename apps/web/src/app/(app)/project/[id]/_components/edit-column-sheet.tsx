"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDefinition, TableData } from "@/lib/types";

import {
  makeEditColumnSchema,
  type EditColumnFormValues,
} from "@/lib/schemas/editColumnSchema";

interface EditColumnSheetProps {
  sheetOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  columnInfo: {
    table: TableData;
    column: ColumnDefinition;
  };
  updateColumn: (
    name: string,
    schema: string,
    column: ColumnDefinition,
  ) => void;
  deleteColumn: (
    table: string,
    schema: string,
    column: ColumnDefinition,
  ) => void;
}

export default function EditColumnSheet({
  sheetOpen,
  setOpen,
  columnInfo: { table, column },
  updateColumn,
  deleteColumn,
}: EditColumnSheetProps) {
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const existingColumns = useMemo(
    () => table.columns.map((c) => c.name),
    [table.columns],
  );

  const zodSchema = useMemo(
    () => makeEditColumnSchema(existingColumns, column),
    [existingColumns, column.name, column.nullable, column.defaultValue],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<EditColumnFormValues>({
    resolver: zodResolver(zodSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      isNullable: true,
      defaultValue: "",
    },
  });

  const isNullable = useWatch({ control, name: "isNullable" });

  const isPrimaryKey = useMemo(() => {
    const pks = (table.primaryKey ?? []).map((k) => k.toLowerCase());
    return pks.includes((column.name ?? "").toLowerCase());
  }, [table.primaryKey, column.name]);

  useEffect(() => {
    if (!sheetOpen) return;

    setDeleteError(null);

    reset({
      name: column.name ?? "",
      isNullable: column.nullable ?? true,
      defaultValue: column.defaultValue ?? "",
    });
  }, [sheetOpen, column, reset]);

  const onValid = (values: EditColumnFormValues) => {
    const updated: ColumnDefinition = {
      ...column,
      name: values.name.trim(),
      nullable: values.isNullable,
      defaultValue: values.defaultValue?.trim()
        ? values.defaultValue.trim()
        : undefined,
    };

    updateColumn(table.name, table.schema, updated);
    setOpen(false);
  };

  const topError =
    deleteError ||
    errors.name?.message ||
    errors.defaultValue?.message ||
    undefined;

  return (
    <Dialog open={sheetOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[440px] gap-0 p-0 overflow-hidden border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit(onValid)}>
          <DialogHeader className="px-6 py-5 border-b border-border/40 bg-muted/5">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Edit Column
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary/50" />
              {table.schema}.{table.name}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {topError && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                {topError}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="col-name"
                className="text-xs font-medium text-muted-foreground"
              >
                Column Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="col-name"
                className="text-sm bg-muted/20 border-border/60 focus:bg-background transition-all"
                autoFocus
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Constraints
              </Label>

              <div
                className={cn(
                  "flex items-start space-x-3 rounded-lg border p-3 transition-colors",
                  !isNullable
                    ? "bg-primary/5 border-primary/20"
                    : "bg-transparent border-border/60 hover:bg-muted/20",
                )}
              >
                <Controller
                  control={control}
                  name="isNullable"
                  render={({ field }) => (
                    <Checkbox
                      id="not-null"
                      checked={!field.value}
                      onCheckedChange={(c) => field.onChange(!c)}
                      className="mt-0.5"
                    />
                  )}
                />
                <div className="grid gap-1 leading-none">
                  <label
                    htmlFor="not-null"
                    className="text-sm font-medium leading-none"
                  >
                    NOT NULL
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Prevents NULL values from being stored.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="default"
                className="text-xs font-medium text-muted-foreground"
              >
                Default Value
              </Label>
              <Input
                id="default"
                placeholder="e.g. 'active' or NOW()"
                className="text-sm bg-muted/20 border-border/60 focus:bg-background transition-all"
                {...register("defaultValue")}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-muted/5 border-t border-border/40 w-full flex">
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "h-8 text-xs font-medium gap-2",
                isPrimaryKey
                  ? "text-muted-foreground/60 cursor-not-allowed"
                  : "hover:text-red-400",
              )}
              disabled={isPrimaryKey}
              onClick={() => {
                if (isPrimaryKey) {
                  setDeleteError(
                    "You can’t delete a primary key column. Drop or change the primary key first.",
                  );
                  return;
                }
                setDeleteError(null);
                console.log(column);
                deleteColumn(table.name, table.schema, column);
                setOpen(false);
              }}
            >
              Delete
            </Button>

            <div className="grow" />

            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="h-8 text-xs font-medium gap-2"
              disabled={!isValid || !isDirty || isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
