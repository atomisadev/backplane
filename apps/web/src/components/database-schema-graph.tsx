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
  Loader2,
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
import AddTable from "./addTable";

const performAutoLayout = (nodes: Node[], edges: Edge[]) => {
  const X_SPACING = 80;
  const Y_SPACING = 120;

  const getDimensions = (node: Node) => {
    if (node.measured && node.measured.width && node.measured.height) {
      return {
        width: node.measured.width,
        height: node.measured.height,
      };
    }

    const tableData = node.data.table as any;
    const charWidth = 9;
    const basePadding = 60;

    const maxTableLen = tableData.name.length;
    const maxColLen = tableData.columns.reduce((max: number, col: any) => {
      const len = col.name.length + col.type.length + 5;
      return Math.max(max, len);
    }, 0);

    const estimatedWidth = Math.max(
      320,
      Math.max(maxTableLen, maxColLen) * charWidth + basePadding,
    );

    const estimatedHeight = 50 + tableData.columns.length * 32 + 20;

    return { width: estimatedWidth, height: estimatedHeight };
  };

  const adjacency: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const nodeDimensions: Record<string, { width: number; height: number }> = {};

  nodes.forEach((node) => {
    adjacency[node.id] = [];
    inDegree[node.id] = 0;
    nodeDimensions[node.id] = getDimensions(node);
  });

  edges.forEach((edge) => {
    if (adjacency[edge.source]) {
      adjacency[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  });

  const levels: Record<string, number> = {};
  const queue: string[] = [];

  nodes.forEach((node) => {
    if (inDegree[node.id] === 0) {
      levels[node.id] = 0;
      queue.push(node.id);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    levels[nodes[0].id] = 0;
    queue.push(nodes[0].id);
  }

  const visited = new Set<string>();
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const currentLevel = levels[nodeId];
    const neighbors = adjacency[nodeId] || [];

    neighbors.forEach((neighborId) => {
      levels[neighborId] = Math.max(levels[neighborId] || 0, currentLevel + 1);
      queue.push(neighborId);
    });
  }

  nodes.forEach((node) => {
    if (levels[node.id] === undefined) {
      levels[node.id] = 0;
    }
  });

  const levelGroups: Record<number, Node[]> = {};
  let maxLevel = 0;

  nodes.forEach((node) => {
    const lvl = levels[node.id];
    maxLevel = Math.max(maxLevel, lvl);
    if (!levelGroups[lvl]) levelGroups[lvl] = [];
    levelGroups[lvl].push(node);
  });

  const newNodes = nodes.map((node) => {
    const lvl = levels[node.id];
    const group = levelGroups[lvl];

    let rowTotalWidth = 0;
    group.forEach((n, idx) => {
      rowTotalWidth += nodeDimensions[n.id].width;
      if (idx < group.length - 1) rowTotalWidth += X_SPACING;
    });

    let currentX = -(rowTotalWidth / 2);

    const nodeIndex = group.indexOf(node);
    for (let i = 0; i < nodeIndex; i++) {
      currentX += nodeDimensions[group[i].id].width + X_SPACING;
    }

    let startY = 0;
    for (let i = 0; i < lvl; i++) {
      const prevGroup = levelGroups[i] || [];
      const maxH = Math.max(
        ...prevGroup.map((n) => nodeDimensions[n.id].height),
        100,
      );
      startY += maxH + Y_SPACING;
    }

    return {
      ...node,
      position: {
        x: currentX,
        y: startY,
      },
    };
  });

  return newNodes;
};

const customStyles = `
  .react-flow__controls {
    display: none; 
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
  schemaSnapshot,
  setSchemaData,
  showLabels,
  setShowLabels,
  interactionMode,
  setInteractionMode,
  onAutoLayout,
  isLayouting,
}: {
  schemaSnapshot: DbSchemaGraph;
  setSchemaData: React.Dispatch<React.SetStateAction<DbSchemaGraph>>;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  interactionMode: "pointer" | "hand";
  setInteractionMode: (v: "pointer" | "hand") => void;
  onAutoLayout: () => void;
  isLayouting: boolean;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-center" className="mb-6 sm:mb-8">
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-md border border-border/60 rounded-full shadow-xl supports-[backdrop-filter]:bg-background/60">
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center px-1">
            <AddTable schemaSnapshot={schemaSnapshot} setData={setSchemaData} />
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
                  onClick={onAutoLayout}
                  disabled={isLayouting}
                >
                  {isLayouting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LayoutTemplate className="size-4" />
                  )}
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

function DatabaseSchemaGraphContent({
  data: otherData,
}: DatabaseSchemaGraphProps) {
  const [showLabels, setShowLabels] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"pointer" | "hand">(
    "pointer",
  );
  const [isLayouting, setIsLayouting] = useState(false);
  const { fitView, getNodes, getEdges: getFlowEdges } = useReactFlow();
  const [data, setData] = useState(otherData);

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

  const getEdges = useCallback(
    (edgesData: Relationship[], show: boolean): Edge[] => {
      return edgesData.map((relationship) => ({
        id: relationship.id,
        source: relationship.source,
        sourceHandle: relationship.sourceColumn,
        target: relationship.target,
        targetHandle: relationship.targetColumn,
        type: "smoothstep",
        animated: true,
        label: show ? relationship.label : undefined,
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
    },
    [],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    getEdges(data.edges, showLabels),
  );

  React.useEffect(() => {
    setEdges(getEdges(data.edges, showLabels));
  }, [showLabels, data.edges, setEdges, getEdges]);

  const handleAutoLayout = useCallback(() => {
    setIsLayouting(true);

    setTimeout(() => {
      const currentNodes = getNodes();
      const currentEdges = getFlowEdges();

      const layoutedNodes = performAutoLayout(currentNodes, currentEdges);

      setNodes([...layoutedNodes]);

      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
        setIsLayouting(false);
      }, 100);
    }, 50);
  }, [getNodes, getFlowEdges, setNodes, fitView]);

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
          schemaSnapshot={data}
          setSchemaData={setData}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          interactionMode={interactionMode}
          setInteractionMode={setInteractionMode}
          onAutoLayout={handleAutoLayout}
          isLayouting={isLayouting}
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
