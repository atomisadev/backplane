"use client";

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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { DbSchemaGraphData, Relationship, SchemaNode } from "./types";
import { TableNode } from "./table-node";
import { GraphToolbar } from "./toolbar";
import { performAutoLayout } from "./layout-engine";
import { PendingChange } from "@/app/(app)/project/[id]/page";

const customStyles = `
  .react-flow__controls { display: none; }
  .react-flow__background { background-color: var(--background); }
  .react-flow__attribution { display: none; }
`;

const nodeTypes = {
  table: TableNode,
};

interface DatabaseSchemaGraphContentProps {
  data: DbSchemaGraphData;
  onAddColumn?: (schema: string, table: string) => void;
  onViewIndexes?: (schema: string, table: string) => void;
  currentChanges: PendingChange[];
  setChanges: React.Dispatch<React.SetStateAction<PendingChange[]>>;
}

function GraphContent({
  data,
  onAddColumn,
  onViewIndexes,
  currentChanges,
  setChanges,
}: DatabaseSchemaGraphContentProps) {
  const [showLabels, setShowLabels] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"pointer" | "hand">(
    "pointer",
  );
  const [isLayouting, setIsLayouting] = useState(false);

  const { fitView, getNodes, getEdges: getFlowEdges } = useReactFlow();

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
          onAddColumn,
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    getEdges(data.edges, showLabels),
  );

  useEffect(() => {
    setEdges(getEdges(data.edges, showLabels));
  }, [showLabels, data.edges, setEdges, getEdges]);

  useEffect(() => {
    setNodes((currentNodes) => {
      const nodeMap = new Map(currentNodes.map((n) => [n.id, n]));

      return data.nodes.map((table) => {
        const existingNode = nodeMap.get(table.id);

        let position = existingNode?.position;
        if (!position) {
          const schemaIndex = data.schemas.indexOf(table.schema);
          const tablesInSchema = data.nodes.filter(
            (n) => n.schema === table.schema,
          );
          const idx = tablesInSchema.findIndex((t) => t.id === table.id);

          position = {
            x: schemaIndex * 450 + (idx % 2) * 50,
            y: Math.floor(idx / 2) * 350 + schemaIndex * 100,
          };
        }

        return {
          id: table.id,
          type: "table",
          position,
          data: {
            table,
            onAddColumn,
            onViewIndexes,
          },
          measured: existingNode?.measured,
        };
      });
    });
  }, [data.nodes, data.schemas, onAddColumn, onViewIndexes, setNodes]);

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

  const onAddNode = useCallback(() => {
    alert("Add Table feature would trigger a modal here.");
  }, []);

  return (
    <div className="w-full h-full relative">
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
        panOnDrag={interactionMode === "hand" || undefined}
        selectionOnDrag={interactionMode === "pointer"}
        nodesDraggable={interactionMode === "pointer"}
        elementsSelectable={interactionMode === "pointer"}
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
        />

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
      </ReactFlow>
    </div>
  );
}

export function DatabaseSchemaGraph({
  data,
  onAddColumn,
  onViewIndexes,
  currentChanges,
  setChanges,
}: {
  data: DbSchemaGraphData;
  currentChanges: PendingChange[];
  onAddColumn?: (schema: string, table: string) => void;
  onViewIndexes?: (schema: string, table: string) => void;
  setChanges: React.Dispatch<React.SetStateAction<PendingChange[]>>;
}) {
  return (
    <ReactFlowProvider>
      <GraphContent
        data={data}
        onAddColumn={onAddColumn}
        onViewIndexes={onViewIndexes}
        currentChanges={currentChanges}
        setChanges={setChanges}
      />
    </ReactFlowProvider>
  );
}
