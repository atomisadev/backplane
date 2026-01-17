import { z } from "zod";

export const ColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
  udt: z.string(),
  nullable: z.boolean(),
  default: z.string().nullable(),
  position: z.number(),
});

export const NodeSchema = z.object({
  id: z.string(),
  schema: z.string(),
  name: z.string(),
  type: z.enum(["BASE TABLE", "VIEW"]),
  primaryKey: z.array(z.string()),
  columns: z.array(ColumnSchema),
});

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceColumn: z.string(),
  target: z.string(),
  targetColumn: z.string(),
  label: z.string(),
});

export const DbSchemaGraphSchema = z.object({
  schemas: z.array(z.string()),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

export type DbSchemaGraph = z.infer<typeof DbSchemaGraphSchema>;
