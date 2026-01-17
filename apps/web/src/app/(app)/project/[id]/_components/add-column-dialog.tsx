"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  POSTGRES_TYPES,
  NEEDS_LENGTH,
  makeAddColumnSchema,
  type AddColumnFormValues,
} from "@/lib/schemas/addColumnSchema";

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
    columns: ColumnDefinition[];
  } | null;

  onAdd: (column: ColumnDefinition) => void;
}

export function AddColumnDialog({
  open,
  onOpenChange,
  targetTable,
  onAdd,
}: AddColumnDialogProps) {
  const existingColumns = targetTable?.columns.map((c) => c.name.toLowerCase());
  const schema = useMemo(
    () => makeAddColumnSchema(existingColumns ?? []),
    [existingColumns],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AddColumnFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      type: "VARCHAR",
      length: "255",
      isNullable: true,
      defaultValue: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        type: "VARCHAR",
        length: "255",
        isNullable: true,
        defaultValue: "",
      });
    }
  }, [open, reset]);

  const selectedType = watch("type");
  const needsLength = NEEDS_LENGTH.has(selectedType);
  const isNullable = watch("isNullable");

  const onValid = (values: AddColumnFormValues) => {
    let sqlType = values.type;

    if (NEEDS_LENGTH.has(values.type)) {
      sqlType = `${values.type}(${(values.length ?? "").trim()})`;
    }

    onAdd({
      name: values.name.trim(),
      type: sqlType,
      nullable: values.isNullable,
      defaultValue: values.defaultValue?.trim()
        ? values.defaultValue.trim()
        : undefined,
    });

    onOpenChange(false);
  };

  const topError =
    errors.name?.message ||
    errors.type?.message ||
    errors.length?.message ||
    undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] gap-0 p-0 overflow-hidden border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit(onValid)}>
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
            {topError && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                {topError}
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
                placeholder="e.g. is_active"
                className="font-mono text-sm bg-muted/20 border-border/60 focus:bg-background transition-all"
                autoFocus
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
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

                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />

                {errors.type && (
                  <p className="text-xs text-destructive">
                    {errors.type.message}
                  </p>
                )}
              </div>

              {needsLength && (
                <div className="col-span-2 space-y-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Length
                  </Label>
                  <Input
                    className="font-mono text-sm h-9 bg-muted/20 border-border/60"
                    {...register("length")}
                  />
                  {errors.length && (
                    <p className="text-xs text-destructive">
                      {errors.length.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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

            <div className="space-y-2">
              <Label
                htmlFor="default"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Default Value
              </Label>
              <Input
                id="default"
                placeholder="e.g. 'active' or NOW()"
                className="font-mono text-sm bg-muted/20 border-border/60 focus:bg-background transition-all"
                {...register("defaultValue")}
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

            <Button
              type="submit"
              className="h-8 text-xs font-medium gap-2"
              disabled={!isValid || isSubmitting}
            >
              Add Column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
