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
import React, { useState } from "react";
import { DbSchemaGraph } from "@/lib/schemas/dbGraph";

interface AddTableProps {
  schemaSnapshot: DbSchemaGraph;
  setData: React.Dispatch<React.SetStateAction<DbSchemaGraph>>;
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
  setData,
}: AddTableProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [name, setName] = useState("");
  const [pkName, setPkName] = useState("");
  const [schema, setSchema] = useState("public");
  const [pkType, setPkType] = useState<PkType>("");

  console.log(schemaData);

  return (
    <Dialog
      onOpenChange={(open) => {
        console.log(open);
        if (!open) {
          setSchema("public");
          setName("");
          setPkName("");
          setPkType("integer");
        }
      }}
    >
      <form>
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
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
            <DialogDescription>
              Does not affect your actual database until you click the Publish
              to DB button.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input
                id="name-1"
                name="name"
                defaultValue={`table_${schemaData?.nodes.length ?? "0"}`}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="schema-1">Schema</Label>
              <Input
                id="schema-1"
                name="schema"
                defaultValue={`public`}
                onChange={(e) => setSchema(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="pk-1">Primary Key Name</Label>
              <Input
                id="pk-1"
                name="primaryKey"
                defaultValue="id"
                onChange={(e) => setPkName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label>Primary Key Type</Label>
              <Select
                value={pkType}
                onValueChange={(v) => setPkType(v as PkType)}
                required
              >
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
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
