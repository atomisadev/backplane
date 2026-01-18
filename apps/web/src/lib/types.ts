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

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export type SchemaNodeData = {
  table: TableData;
  onViewIndexes?: (schema: string, table: string) => void;
  onAddColumn?: (
    schema: string,
    table: string,
    columns: ColumnDefinition[],
  ) => void;
  onDeleteTable?: (id: string) => void;
  onColumnClick?: (table: TableData, column: ColumnDefinition) => void;
};

export type PendingChange = {
  type: "CREATE_COLUMN" | "CREATE_TABLE" | "UPDATE_COLUMN" | "DROP_TABLE";
  schema: string;
  table: string;
  column?: ColumnDefinition;
  defaultValue?: boolean;
  oldColumn?: ColumnDefinition;
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
  layout?: Record<string, { x: number; y: number }>;
}
