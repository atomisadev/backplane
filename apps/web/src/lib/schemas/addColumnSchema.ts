// validation/add-column.schema.ts
import { z } from "zod";

export const POSTGRES_TYPES = [
  { label: "Text / String", options: ["VARCHAR", "TEXT", "CHAR"] },
  {
    label: "Number",
    options: ["INTEGER", "BIGINT", "DECIMAL", "NUMERIC", "REAL"],
  },
  { label: "Boolean", options: ["BOOLEAN"] },
  { label: "Date / Time", options: ["TIMESTAMP", "DATE", "TIME"] },
  { label: "Advanced", options: ["UUID", "JSONB", "JSON"] },
] as const;

export const ALL_TYPES: string[] = POSTGRES_TYPES.flatMap((g) => [
  ...g.options,
]);

export const NEEDS_LENGTH = new Set<string>(["VARCHAR", "CHAR"]);

export const makeAddColumnSchema = (existingColumns: string[]) => {
  const existingNamesLower = new Set(
    (existingColumns ?? [])
      .map((c) => (c ?? "").toString().toLowerCase())
      .filter(Boolean),
  );

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
      type: z
        .string()
        .refine((v) => ALL_TYPES.includes(v), "Data type is required"),
      length: z.string().optional(),
      isNullable: z.boolean(),
      defaultValue: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      const needsLength = NEEDS_LENGTH.has(val.type);
      if (!needsLength) return;

      const raw = (val.length ?? "").trim();
      if (!raw) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["length"],
          message: "Length is required for this type",
        });
        return;
      }

      const n = Number(raw);
      if (!Number.isInteger(n) || n <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["length"],
          message: "Length must be a positive integer",
        });
      }
    });
};

export type AddColumnFormValues = z.infer<
  ReturnType<typeof makeAddColumnSchema>
>;
