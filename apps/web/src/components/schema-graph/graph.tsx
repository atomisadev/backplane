// MODIFIED START: Fix selection box CSS to be visible and use proper color mixing
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  Edge,
  Node,
  OnNodesChange,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  PendingChange,
  ColumnDefinition,
  DbSchemaGraphData,
  Relationship,
  TableData,
} from "../../lib/types";
import { TableNode } from "./table-node";
import { GraphToolbar } from "./toolbar";
import { performAutoLayout } from "./layout-engine";
import { useSaveLayout } from "@/app/(app)/project/[id]/_hooks/use-save-layout";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUpdateMyPresence, useStorage, useMutation } from "@/lib/liveblocks";
import { CollaborativeCursors } from "@/app/(app)/project/[id]/_components/collaborative-cursors";
import { authClient } from "@/lib/auth-client";

const customStyles = `
  .react-flow__controls { display: none; }
  .react-flow__background { background-color: var(--background); }
  .react-flow__attribution { display: none; }
  
  /* Custom Selection Box - Fixed visibility */
  .react-flow__selection {
    background-color: color-mix(in srgb, var(--primary), transparent 85%);
    border: 1px solid color-mix(in srgb, var(--primary), transparent 20%);
    border-radius: 4px;
    z-index: 1001; /* Ensure it's above other elements */
  }

  /* Nodes when selected */
  .react-flow__node.selected .group\\/node {
    box-shadow: 0 0 0 1px oklch(var(--primary) / 0.5), 0 4px 20px -2px oklch(var(--primary) / 0.2);
    border-color: oklch(var(--primary) / 0.5);
  }
`;

const nodeTypes = {
  table: TableNode,
};

interface DatabaseSchemaGraphContentProps {
  data: DbSchemaGraphData;
  onViewIndexes?: (schema: string, table: string) => void;
  onAddColumn?: (
    schema: string,
    table: string,
    columns: ColumnDefinition[],
  ) => void;
  onColumnClick: (table: TableData, column: ColumnDefinition) => void;
  onDeleteTable: (id: string) => void;
  currentChanges: PendingChange[];
  setChanges: React.Dispatch<React.SetStateAction<PendingChange[]>>;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

function GraphContent({
  data,
  onAddColumn,
  onViewIndexes,
  onDeleteTable,
  onColumnClick,
  currentChanges,
  setChanges,
  undo,
  redo,
  canUndo,
  canRedo,
}: DatabaseSchemaGraphContentProps) {
  const [showLabels, setShowLabels] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"pointer" | "hand">(
    "hand",
  );
  const [isLayouting, setIsLayouting] = useState(false);
  const { id: projectId } = useParams() as { id: string };

  const {
    fitView,
    getNodes,
    getEdges: getFlowEdges,
    getViewport,
    screenToFlowPosition,
  } = useReactFlow();
  const { saveLayout, isSaving } = useSaveLayout(projectId);
  const updateMyPresence = useUpdateMyPresence();
  const { data: session } = authClient.useSession();

  const liveNodePositions = useStorage((root) => root.nodePositions);

  const updateNodePosition = useMutation(
    ({ storage }, nodeId: string, x: number, y: number) => {
      const positions = storage.get("nodePositions") as any;
      if (!positions) return;
      storage.set("nodePositions", { ...positions, [nodeId]: { x, y } });
    },
    [],
  );

  const updateMultipleNodePositions = useMutation(
    ({ storage }, newPositions: Record<string, { x: number; y: number }>) => {
      const positions = storage.get("nodePositions") as any;
      if (!positions) return;
      storage.set("nodePositions", { ...positions, ...newPositions });
    },
    [],
  );

  const initialNodes: Node[] = useMemo(() => {
    return data.nodes.map((table) => {
      if (data.layout && data.layout[table.id]) {
        return {
          id: table.id,
          type: "table",
          position: data.layout[table.id],
          data: {
            table,
            onDeleteTable,
            onViewIndexes,
            onAddColumn,
            onColumnClick,
          },
        };
      }

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
          onAddColumn,
          onViewIndexes,
          onDeleteTable,
          onColumnClick,
        },
      };
    });
  }, []);

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

  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    getEdges(data.edges, showLabels),
  );

  useEffect(() => {
    if (!liveNodePositions) return;

    setNodes((nds) =>
      nds.map((node) => {
        const livePos = (liveNodePositions as any)[node.id];
        if (
          livePos &&
          (livePos.x !== node.position.x || livePos.y !== node.position.y)
        ) {
          return { ...node, position: livePos };
        }
        return node;
      }),
    );
  }, [liveNodePositions, setNodes]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChangeOriginal(changes);

      if (!liveNodePositions) return;

      for (const change of changes) {
        if (change.type === "position" && change.position) {
          updateNodePosition(change.id, change.position.x, change.position.y);
        }
      }
    },
    [onNodesChangeOriginal, updateNodePosition, liveNodePositions],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      updateMyPresence({
        cursor: position,
        user: {
          name: session?.user?.name || "Anonymous",
          email: session?.user?.email || "",
          avatar: session?.user?.image || "",
        },
      });
    },
    [screenToFlowPosition, updateMyPresence, session],
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  useEffect(() => {
    if (nodes.length > 0 && !isLayouting) {
      saveLayout(nodes);
    }
  }, [nodes, saveLayout, isLayouting]);

  useEffect(() => {
    setEdges(getEdges(data.edges, showLabels));
  }, [showLabels, data.edges, setEdges, getEdges]);

  useEffect(() => {
    let insertPos = null;
    if (typeof window !== "undefined") {
      const { x, y, zoom } = getViewport();
      const width = window.innerWidth - 260;
      const height = window.innerHeight - 48;

      insertPos = {
        x: (-x + width / 2) / zoom,
        y: (-y + height / 2) / zoom,
      };
    }

    setNodes((currentNodes) => {
      const nodeMap = new Map(currentNodes.map((n) => [n.id, n]));

      return data.nodes.map((table) => {
        const existingNode = nodeMap.get(table.id);

        let position = existingNode?.position;
        if (!position) {
          if (data.layout && data.layout[table.id]) {
            position = data.layout[table.id];
          } else {
            if (currentNodes.length > 0 && insertPos) {
              position = {
                x: insertPos.x - 140,
                y: insertPos.y - 100,
              };
            } else {
              const schemaIndex = data.schemas.indexOf(table.schema);
              const sIdx = schemaIndex === -1 ? 0 : schemaIndex;

              const tablesInSchema = data.nodes.filter(
                (n) => n.schema === table.schema,
              );
              const idx = tablesInSchema.findIndex((t) => t.id === table.id);

              position = {
                x: sIdx * 450 + (idx % 2) * 50,
                y: Math.floor(idx / 2) * 350 + sIdx * 100,
              };
            }
          }
        }

        return {
          id: table.id,
          type: "table",
          position,
          data: {
            table,
            onViewIndexes,
            onAddColumn,
            onDeleteTable,
            onColumnClick,
          },
          measured: existingNode?.measured,
        };
      });
    });
  }, [
    data.nodes,
    data.schemas,
    data.layout,
    onAddColumn,
    onDeleteTable,
    onViewIndexes,
    setNodes,
    getViewport,
  ]);

  const handleAutoLayout = useCallback(() => {
    setIsLayouting(true);

    setTimeout(() => {
      const currentNodes = getNodes();
      const currentEdges = getFlowEdges();

      const layoutedNodes = performAutoLayout(currentNodes, currentEdges);

      setNodes([...layoutedNodes]);
      saveLayout(layoutedNodes);

      // Sync positions to Liveblocks
      const newPositions: Record<string, { x: number; y: number }> = {};
      layoutedNodes.forEach((n) => {
        newPositions[n.id] = n.position;
      });
      updateMultipleNodePositions(newPositions);

      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
        setIsLayouting(false);
      }, 100);
    }, 50);
  }, [
    getNodes,
    getFlowEdges,
    setNodes,
    fitView,
    saveLayout,
    updateMultipleNodePositions,
  ]);

  const onAddNode = useCallback(() => {
    // alert("Add Table feature would trigger a modal here.");
  }, []);

  return (
    <div
      className="w-full h-full relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        colorMode="system"
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        nodesDraggable={true}
        panOnDrag={interactionMode === "hand" ? true : [1, 2]}
        selectionOnDrag={true}
        selectionKeyCode={["Control", "Meta", "Shift"]}
        multiSelectionKeyCode={["Control", "Meta", "Shift"]}
        selectionMode={SelectionMode.Partial}
        elementsSelectable={true}
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="var(--border)"
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
        />

        <GraphToolbar
          onAddNode={onAddNode}
          schemaData={data}
          currentChanges={currentChanges}
          setChanges={setChanges}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          interactionMode={interactionMode}
          setInteractionMode={setInteractionMode}
          onAutoLayout={handleAutoLayout}
          isLayouting={isLayouting}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
          {isSaving && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur border border-border rounded-full shadow-sm text-xs text-muted-foreground animate-in fade-in zoom-in slide-in-from-bottom-2">
              <Loader2 className="size-3 animate-spin" />
              Saving layout...
            </div>
          )}
        </div>
      </ReactFlow>
      <CollaborativeCursors />
    </div>
  );
}

export function DatabaseSchemaGraph({
  data,
  onAddColumn,
  onViewIndexes,
  onDeleteTable,
  currentChanges,
  onColumnClick,
  setChanges,
  undo,
  redo,
  canUndo,
  canRedo,
}: {
  data: DbSchemaGraphData;
  currentChanges: PendingChange[];
  onViewIndexes?: (schema: string, table: string) => void;
  onAddColumn?: (
    schema: string,
    table: string,
    columns: ColumnDefinition[],
  ) => void;
  onDeleteTable: (id: string) => void;
  onColumnClick: (table: TableData, column: ColumnDefinition) => void;
  setChanges: React.Dispatch<React.SetStateAction<PendingChange[]>>;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <GraphContent
        data={data}
        onColumnClick={onColumnClick}
        onDeleteTable={onDeleteTable}
        onAddColumn={onAddColumn}
        onViewIndexes={onViewIndexes}
        currentChanges={currentChanges}
        setChanges={setChanges}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </ReactFlowProvider>
  );
}
