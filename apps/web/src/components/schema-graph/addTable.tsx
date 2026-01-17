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
  const [name, setName] = useState("");
  const [pkName, setPkName] = useState("");
  const [schema, setSchema] = useState("public");
  const [pkType, setPkType] = useState<PkType>("");
  const [pkDefault, setPkDefault] = useState("");

  // console.log(schemaData);

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
    mode: "onChange", // validates as user types/selects
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
          setSchema("public");
          setName(`table_${schemaData?.nodes.length ?? "0"}`);
          setPkName("id");
          setPkType("");
          setPkDefault("");
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

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onValid)}>
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
            <DialogDescription>
              Does not affect your actual database until you click the Publish
              to DB button.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name-1">Name</Label>
              <Input id="name-1" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="schema-1">Schema</Label>
              <Input id="schema-1" {...register("schema")} />
              {errors.schema && (
                <p className="text-sm text-destructive">
                  {errors.schema.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pk-1">Primary Key Name</Label>
              <Input id="pk-1" {...register("pkName")} />
              {errors.pkName && (
                <p className="text-sm text-destructive">
                  {errors.pkName.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Primary Key Type</Label>
              <Controller
                control={control}
                name="pkType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a primary key type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PK_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.pkType && (
                <p className="text-sm text-destructive">
                  {errors.pkType.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pk-2">Set Default Value</Label>
              <Input id="pk-2" {...register("pkDefault")} />
              {errors.pkDefault && (
                <p className="text-sm text-destructive">
                  {errors.pkDefault.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button type="submit" disabled={!isValid || isSubmitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
