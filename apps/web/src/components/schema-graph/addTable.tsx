import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import React, { useMemo, useState } from "react";
import { PendingChange } from "@/app/(app)/project/[id]/page";
import { DbSchemaGraphData } from "./types";
import { FormValues, makeSchema } from "@/lib/schemas/tableForm";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

interface AddTableProps {
  schemaSnapshot: DbSchemaGraphData;
  currentChanges: PendingChange[];
  setChanges: React.Dispatch<React.SetStateAction<PendingChange[]>>;
}

type PkType = "uuid" | "bigint" | "integer" | "text" | "";

const PK_TYPES: { value: PkType; label: string; hint?: string }[] = [
  { value: "uuid", label: "UUID", hint: "Best default for distributed IDs" },
  { value: "bigint", label: "Bigint (int8)", hint: "Numeric autoincrement" },
  { value: "integer", label: "Integer (int4)", hint: "Smaller autoincrement" },
  { value: "text", label: "Text", hint: "Natural key (use carefully)" },
];

export default function AddTable({
  schemaSnapshot: schemaData,
  currentChanges,
  setChanges,
}: AddTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const existingTableNamesLower = useMemo(() => {
    const s = new Set<string>();

    for (const n of schemaData?.nodes ?? []) {
      const tableName = n.name;

      if (typeof tableName === "string") {
        s.add(tableName.toLowerCase());
      }
    }

    return s;
  }, [schemaData]);

  const formSchema = useMemo(
    () => makeSchema(existingTableNamesLower),
    [existingTableNamesLower],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      schema: "public",
      pkName: "id",
      pkType: "integer",
      pkDefault: "",
    },
  });

  const onValid = (values: FormValues) => {
    const newTable: PendingChange = {
      type: "CREATE_TABLE",
      table: values.name,
      schema: values.schema,
      column: {
        name: values.pkName,
        type: values.pkType,
        nullable: false,
        defaultValue: values.pkDefault ?? "",
      },
    };

    setChanges([...currentChanges, newTable]);
    setDialogOpen(false);
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (open) {
          reset({
            schema: "public",
            name: `table_${schemaData?.nodes.length ?? "0"}`,
            pkName: "id",
            pkType: "integer",
            pkDefault: "",
          });
        }
      }}
    >
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <Plus className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">New Table</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-[440px] gap-0 p-0 overflow-hidden border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit(onValid)}>
          <DialogHeader className="px-6 py-5 border-b border-border/40 bg-muted/5">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Create New Table
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Configure table properties and primary key.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium leading-none text-foreground">
                Table Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="schema"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Schema
                  </Label>
                  <Input
                    id="schema"
                    className="h-9 bg-muted/20 border-border/60 focus:bg-background transition-all"
                    {...register("schema")}
                  />
                  {errors.schema && (
                    <p className="text-[10px] text-destructive">
                      {errors.schema.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Table Name
                  </Label>
                  <Input
                    id="name"
                    className="h-9 bg-muted/20 border-border/60 focus:bg-background transition-all"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium leading-none text-foreground">
                Primary Key
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="pkName"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Column Name
                    </Label>
                    <Input
                      id="pkName"
                      placeholder="e.g. id"
                      className="h-9 bg-muted/20 border-border/60 focus:bg-background transition-all"
                      {...register("pkName")}
                    />
                    {errors.pkName && (
                      <p className="text-[10px] text-destructive">
                        {errors.pkName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Data Type
                    </Label>
                    <Controller
                      control={control}
                      name="pkType"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full h-9 bg-muted/20 border-border/60">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {PK_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="text-xs font-medium">
                                    {t.label}
                                  </span>
                                  {t.hint && (
                                    <span className="text-[9px] text-muted-foreground">
                                      {t.hint}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.pkType && (
                      <p className="text-[10px] text-destructive">
                        {errors.pkType.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="pkDefault"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Default Value{" "}
                    <span className="text-muted-foreground/50 italic">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    id="pkDefault"
                    placeholder="e.g. gen_random_uuid()"
                    className="h-9 bg-muted/20 border-border/60 focus:bg-background transition-all font-mono text-xs"
                    {...register("pkDefault")}
                  />
                  {errors.pkDefault && (
                    <p className="text-[10px] text-destructive">
                      {errors.pkDefault.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-muted/5 border-t border-border/40">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="h-8 text-xs">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="h-8 text-xs font-medium"
              disabled={!isValid || isSubmitting}
            >
              Create Table
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
