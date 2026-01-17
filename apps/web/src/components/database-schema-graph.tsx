"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Custom CSS for themed control icons and proper text colors
const customStyles = `
  .react-flow__controls button svg {
    fill: hsl(var(--foreground)) !important;
  }
  .react-flow__controls button {
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
  }
  .react-flow__controls button:hover {
    background: hsl(var(--muted));
  }
  .react-flow__node {
    color: hsl(var(--foreground)) !important;
  }
  .react-flow__node * {
    color: inherit !important;
  }
  .react-flow__edge-text {
    fill: hsl(var(--muted-foreground)) !important;
  }
  .react-flow__minimap {
    background: hsl(var(--card)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 8px !important;
  }
  .react-flow__minimap-mask {
    fill: hsl(var(--muted)) !important;
  }

  .table-header {
    background: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }
`;

// Define the structure of the input data
interface Column {
  name: string;
  type: string;
  udt: string;
  nullable: boolean;
  default: string | null;
  position: number;
}

interface TableNode {
  id: string;
  schema: string;
  name: string;
  type: string;
  primaryKey: string[];
  columns: Column[];
}

interface Relationship {
  id: string;
  source: string;
  sourceColumn: string;
  target: string;
  targetColumn: string;
  label: string;
}

interface DatabaseSchema {
  schemas: string[];
  nodes: TableNode[];
  edges: Relationship[];
}

interface DatabaseSchemaGraphProps {
  data: DatabaseSchema;
}

// Custom node component for database tables
const TableNodeComponent = ({ data }: { data: { table: TableNode } }) => {
  const { table } = data;

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm min-w-62.5 max-w-87.5">
      {/* Table header */}
      <div className="table-header px-4 py-2 rounded-t-lg">
        <div className="font-bold text-sm">{table.name}</div>
        <div className="text-xs opacity-90">{table.schema}</div>
      </div>

      {/* Columns */}
      <div className="max-h-100 overflow-y-auto">
        {table.columns.map((column: Column) => (
          <div
            key={column.name}
            className={`px-4 py-2 border-b border-border/50 last:border-b-0 ${
              table.primaryKey.includes(column.name)
                ? "bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-400"
                : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm text-foreground">
                  {column.name}
                </span>
                {table.primaryKey.includes(column.name) && (
                  <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-1 rounded">
                    PK
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {!column.nullable && (
                  <span className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-1 rounded mr-1">
                    NOT NULL
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {column.type}
              {column.default && (
                <span className="ml-2 text-primary">
                  default: {column.default}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Node types
const nodeTypes = {
  table: TableNodeComponent,
};

export function DatabaseSchemaGraph({ data }: DatabaseSchemaGraphProps) {
  // Convert database tables to ReactFlow nodes
  const initialNodes: Node[] = useMemo(() => {
    return data.nodes.map((table) => {
      // Calculate position based on schema and index
      const schemaIndex = data.schemas.indexOf(table.schema);
      const tablesInSchema = data.nodes.filter(
        (n) => n.schema === table.schema,
      );
      const tableIndexInSchema = tablesInSchema.findIndex(
        (t) => t.id === table.id,
      );

      return {
        id: table.id,
        type: "table",
        position: {
          x: schemaIndex * 400 + (tableIndexInSchema % 2) * 200,
          y: Math.floor(tableIndexInSchema / 2) * 300 + schemaIndex * 50,
        },
        data: {
          table,
        },
      };
    });
  }, [data.nodes, data.schemas]);

  // Convert database relationships to ReactFlow edges
  const initialEdges: Edge[] = useMemo(() => {
    return data.edges.map((relationship) => ({
      id: relationship.id,
      source: relationship.source,
      target: relationship.target,
      type: "smoothstep",
      animated: true,
      label: relationship.label,
      labelStyle: {
        fontSize: "12px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        padding: "2px 4px",
        borderRadius: "4px",
      },
      style: {
        stroke: "#3b82f6",
        strokeWidth: 2,
      },
      markerEnd: {
        type: "arrowclosed",
        color: "#3b82f6",
      },
    }));
  }, [data.edges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(() => {
    // Disable manual connections for this read-only schema view
  }, []);

  // Color scheme for minimap
  const nodeColor = (node: Node) => {
    const table = node.data.table as TableNode;
    // Color by schema
    const schemaIndex = data.schemas.indexOf(table.schema);
    const colors = [
      "hsl(221 83% 53%)", // blue-500
      "hsl(142 71% 45%)", // green-500
      "hsl(38 92% 50%)", // amber-500
      "hsl(0 84% 60%)", // red-500
      "hsl(262 83% 58%)", // violet-500
      "hsl(189 94% 43%)", // cyan-500
    ];
    return colors[schemaIndex % colors.length];
  };

  return (
    <div className="w-full h-full bg-background">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        colorMode="system"
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={nodeColor} nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>

      {/* Schema legend */}
      <div className="absolute top-4 right-4 bg-card rounded-lg shadow-md border border-border p-4 max-w-xs">
        <h3 className="font-semibold text-sm text-foreground mb-2">Schemas</h3>
        <div className="space-y-1">
          {data.schemas.map((schema, index) => {
            const colors = [
              "hsl(221 83% 53%)", // blue-500
              "hsl(142 71% 45%)", // green-500
              "hsl(38 92% 50%)", // amber-500
              "hsl(0 84% 60%)", // red-500
              "hsl(262 83% 58%)", // violet-500
              "hsl(189 94% 43%)", // cyan-500
            ];
            const color = colors[index % colors.length];
            return (
              <div key={schema} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-foreground">{schema}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
