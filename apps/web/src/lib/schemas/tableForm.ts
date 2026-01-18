import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
const PK_TYPE_VALUES = ["uuid", "bigint", "integer", "text"] as const;
type PkType = (typeof PK_TYPE_VALUES)[number];

export const makeSchema = (existingNamesLower: Set<string>) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Table name is required")
      .refine(
        (v) => !existingNamesLower.has(v.toLowerCase()),
        "A table with this name already exists",
      ),
    schema: z.string().trim().min(1, "Schema is required"),
    pkName: z.string().trim().min(1, "Primary key name is required"),
    pkType: z
      .union([z.literal(""), z.enum(PK_TYPE_VALUES)])
      .refine(
        (v): v is Exclude<PkType, ""> => v !== "",
        "Primary key type is required",
      ),
    pkDefault: z.string().optional(),
  });

export type FormValues = {
  name: string;
  schema: string;
  pkName: string;
  pkType: "" | PkType;
  pkDefault?: string;
};
