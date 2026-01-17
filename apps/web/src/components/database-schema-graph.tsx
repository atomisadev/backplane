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
  Handle,
  Position,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Key, GripHorizontal, Database } from "lucide-react";
import { DbSchemaGraph } from "../lib/schemas/dbGraph";

const customStyles = `
  .react-flow__controls {
    box-shadow: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--card);
    padding: 2px;
  }
  .react-flow__controls button {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border);
    width: 28px;
    height: 28px;
    color: var(--foreground);
  }
  .react-flow__controls button:last-child {
    border-bottom: none;
  }
  .react-flow__controls button:hover {
    background-color: var(--accent);
    color: var(--accent-foreground);
  }
  .react-flow__controls button svg {
    fill: currentColor !important;
  }
  .react-flow__background {
    background-color: var(--background);
  }
  /* MiniMap styles removed */
  .react-flow__attribution {
    display: none;
  }
`;

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
  data: DbSchemaGraph;
}

const TableNodeComponent = ({ data }: { data: { table: TableNode } }) => {
  const { table } = data;

  return (
    <div className="relative min-w-[280px] rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md hover:ring-1 hover:ring-ring/20">
      <div className="flex flex-col border-b border-border bg-muted/30 px-4 py-3 first:rounded-t-xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="rounded-[4px] border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {table.schema}
            </span>
          </div>
          <GripHorizontal className="size-4 text-muted-foreground/20" />
        </div>
        <div className="font-semibold text-sm tracking-tight flex items-center gap-2">
          <Database className="size-3.5 text-primary/70" />
          {table.name}
        </div>
      </div>

      <div className="flex flex-col py-1">
        {table.columns.map((column: Column) => {
          const isPk = table.primaryKey.includes(column.name);
          return (
            <div
              key={column.name}
              className={`relative group flex items-center justify-between px-4 py-1.5 text-xs transition-colors hover:bg-muted/50 ${
                isPk ? "bg-primary/5" : ""
              }`}
            >
              <Handle
                id={column.name}
                type="target"
                position={Position.Left}
                className="!bg-primary !border-background !w-1.5 !h-1.5 !-left-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
              />

              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex w-3 shrink-0 items-center justify-center">
                  {isPk ? (
                    <Key className="size-3 text-amber-500" />
                  ) : (
                    <div className="size-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-muted-foreground/60" />
                  )}
                </div>
                <span
                  className={`truncate font-medium font-mono ${isPk ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  {column.name}
                </span>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {column.type}
                </span>
                {!column.nullable && !isPk && (
                  <span className="text-[9px] text-destructive/80 font-medium px-1">
                    *
                  </span>
                )}
              </div>

              <Handle
                id={column.name}
                type="source"
                position={Position.Right}
                className="!bg-primary !border-background !w-1.5 !h-1.5 !-right-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const nodeTypes = {
  table: TableNodeComponent,
};

export function DatabaseSchemaGraph({ data }: DatabaseSchemaGraphProps) {
  const initialNodes: Node[] = useMemo(() => {
    return data.nodes.map((table) => {
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
          x: schemaIndex * 450 + (tableIndexInSchema % 2) * 50,
          y: Math.floor(tableIndexInSchema / 2) * 350 + schemaIndex * 100,
        },
        data: {
          table,
        },
      };
    });
  }, [data.nodes, data.schemas]);

  const initialEdges: Edge[] = useMemo(() => {
    return data.edges.map((relationship) => ({
      id: relationship.id,
      source: relationship.source,
      sourceHandle: relationship.sourceColumn,
      target: relationship.target,
      targetHandle: relationship.targetColumn,
      type: "smoothstep",
      animated: true,
      label: relationship.label,
      labelStyle: {
        fill: "var(--muted-foreground)",
        fontSize: 10,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: "var(--background)",
        fillOpacity: 0.8,
        stroke: "var(--border)",
        strokeWidth: 1,
      },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      style: {
        stroke: "var(--muted-foreground)",
        strokeWidth: 1.5,
        opacity: 0.6,
        fill: "none",
      },
      markerEnd: {
        type: "arrowclosed",
        color: "var(--muted-foreground)",
        width: 15,
        height: 15,
      },
    }));
  }, [data.edges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(() => {}, []);

  const gridColor = "var(--border)";

  return (
    <div className="w-full h-full">
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
        minZoom={0.1}
        maxZoom={1.5}
        fitViewOptions={{
          padding: 0.2,
        }}
      >
        <Background
          color={gridColor}
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
          className=""
        />
        <Controls showInteractive={false} />
      </ReactFlow>

      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-sm p-3 max-w-[200px] z-10">
        <h3 className="font-semibold text-xs text-foreground mb-2 px-1">
          Schemas
        </h3>
        <div className="space-y-1.5">
          {data.schemas.map((schema) => (
            <div key={schema} className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                {schema}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
