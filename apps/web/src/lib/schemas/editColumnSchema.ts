import { z } from "zod";
import type { ColumnDefinition } from "../types";

function normalizeName(s?: string) {
  return (s ?? "").trim();
}

function normalizeDefault(s?: string) {
  const v = (s ?? "").trim();
  return v === "" ? null : v;
}

export const makeEditColumnSchema = (
  existingColumns: string[],
  currentColumn: ColumnDefinition,
) => {
  const currentNameLower = normalizeName(currentColumn.name).toLowerCase();

  // Exclude current column name from uniqueness check
  const existingNamesLower = new Set(
    (existingColumns ?? [])
      .map((c) => normalizeName(c).toLowerCase())
      .filter((n) => n && n !== currentNameLower),
  );

  const currentComparable = {
    name: normalizeName(currentColumn.name),
    nullable: !!currentColumn.nullable,
    defaultValue: normalizeDefault(currentColumn.defaultValue),
  };

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Column name is required")
        .regex(
          /^[a-zA-Z_][a-zA-Z0-9_]*$/,
          "Use letters, numbers, underscores; must not start with a number",
        )
        .refine(
          (v) => !existingNamesLower.has(v.toLowerCase()),
          "A column with this name already exists",
        ),
      isNullable: z.boolean(),
      defaultValue: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      // Require at least one change (you can also enforce this via isDirty in the component)
      const editedComparable = {
        name: normalizeName(val.name),
        nullable: !!val.isNullable,
        defaultValue: normalizeDefault(val.defaultValue),
      };

      const changed =
        editedComparable.name !== currentComparable.name ||
        editedComparable.nullable !== currentComparable.nullable ||
        editedComparable.defaultValue !== currentComparable.defaultValue;

      if (!changed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["name"],
          message: "Make at least one change before saving",
        });
      }
    });
};

export type EditColumnFormValues = z.infer<
  ReturnType<typeof makeEditColumnSchema>
>;
