import { ColumnDefinition } from "@/app/(app)/project/[id]/_components/add-column-dialog";
import { Node } from "@xyflow/react";

export interface Column {
  name: string;
  type: string;
  udt: string;
  nullable: boolean;
  default: string | null;
  position: number;
  isPending?: boolean;
}

export interface TableData {
  id: string;
  schema: string;
  name: string;
  type: string;
  primaryKey: string[];
  columns: Column[];
}

export type SchemaNodeData = {
  table: TableData;
  onAddColumn?: (
    schema: string,
    table: string,
    columns: ColumnDefinition[],
  ) => void;
};

export type SchemaNode = Node<SchemaNodeData, "table">;

export interface Relationship {
  id: string;
  source: string;
  sourceColumn: string;
  target: string;
  targetColumn: string;
  label: string;
}

export interface DbSchemaGraphData {
  schemas: string[];
  nodes: TableData[];
  edges: Relationship[];
}
