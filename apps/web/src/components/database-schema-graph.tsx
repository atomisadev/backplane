// apps/web/src/components/database-schema-graph.tsx

// MODIFIED START: Added Toolbar, ReactFlowProvider, and advanced state management
"use client";

import React, { useCallback, useMemo, useState } from "react";
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
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Key,
  GripHorizontal,
  Database,
  Plus,
  Undo2,
  Redo2,
  Hand,
  MousePointer2,
  Type,
  LayoutTemplate,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";
import { DbSchemaGraph } from "../lib/schemas/dbGraph";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const customStyles = `
  .react-flow__controls {
    display: none; /* Hiding default controls to use our custom toolbar */
  }
  .react-flow__background {
    background-color: var(--background);
  }
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

interface DatabaseSchemaGraphProps {
  data: DbSchemaGraph;
}

const TableNodeComponent = ({ data }: { data: { table: TableNode } }) => {
  const { table } = data;

  return (
    <div className="relative min-w-[280px] rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg hover:ring-1 hover:ring-primary/20">
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

function GraphToolbar({
  onAddNode,
  showLabels,
  setShowLabels,
  interactionMode,
  setInteractionMode,
}: {
  onAddNode: () => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  interactionMode: "pointer" | "hand";
  setInteractionMode: (v: "pointer" | "hand") => void;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-center" className="mb-6 sm:mb-8">
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-md border border-border/60 rounded-full shadow-xl supports-[backdrop-filter]:bg-background/60">
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={onAddNode}
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">New Table</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 bg-border/60" />

          <div className="flex items-center px-1 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground"
                  onClick={() => {}}
                >
                  <Undo2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground"
                  onClick={() => {}}
                >
                  <Redo2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Redo</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 bg-border/60" />

          <div className="flex items-center px-1 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    interactionMode === "pointer" ? "secondary" : "ghost"
                  }
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    interactionMode === "pointer" &&
                      "bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                  onClick={() => setInteractionMode("pointer")}
                >
                  <MousePointer2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Select Tool</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={interactionMode === "hand" ? "secondary" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    interactionMode === "hand" &&
                      "bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                  onClick={() => setInteractionMode("hand")}
                >
                  <Hand className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Hand Tool</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 bg-border/60" />

          <div className="flex items-center px-1 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showLabels ? "secondary" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    showLabels &&
                      "bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                  onClick={() => setShowLabels(!showLabels)}
                >
                  <Type className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {showLabels ? "Hide Labels" : "Show Labels"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => {}}
                >
                  <LayoutTemplate className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Auto Layout</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 bg-border/60" />

          <div className="flex items-center px-1 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => zoomOut()}
                >
                  <ZoomOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Zoom Out</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => fitView({ duration: 500 })}
                >
                  <Maximize className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Fit View</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => zoomIn()}
                >
                  <ZoomIn className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Zoom In</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </Panel>
  );
}

function DatabaseSchemaGraphContent({ data }: DatabaseSchemaGraphProps) {
  const [showLabels, setShowLabels] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"pointer" | "hand">(
    "pointer",
  );

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
      label: showLabels ? relationship.label : undefined,
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
  }, [data.edges, showLabels]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(() => {}, []);
  const onAddNode = useCallback(() => {
    alert("Add Table feature would trigger a modal here.");
  }, []);

  const gridColor = "var(--border)";

  return (
    <div className="w-full h-full relative">
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
        panOnDrag={interactionMode === "hand" || undefined}
        selectionOnDrag={interactionMode === "pointer"}
        nodesDraggable={interactionMode === "pointer"}
        elementsSelectable={interactionMode === "pointer"}
        fitViewOptions={{
          padding: 0.2,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color={gridColor}
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
        />

        <GraphToolbar
          onAddNode={onAddNode}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          interactionMode={interactionMode}
          setInteractionMode={setInteractionMode}
        />
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

export function DatabaseSchemaGraph({ data }: DatabaseSchemaGraphProps) {
  return (
    <ReactFlowProvider>
      <DatabaseSchemaGraphContent data={data} />
    </ReactFlowProvider>
  );
}
