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

// Custom CSS for black control icons
const customStyles = `
  .react-flow__controls button svg {
    fill: #000000 !important;
  }
  .react-flow__controls button {
    background: #ffffff;
    border: 1px solid #d1d5db;
  }
  .react-flow__controls button:hover {
    background: #f3f4f6;
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
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg min-w-62.5 max-w-87.5">
      {/* Table header */}
      <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg">
        <div className="font-bold text-sm">{table.name}</div>
        <div className="text-xs opacity-90">{table.schema}</div>
      </div>

      {/* Columns */}
      <div className="max-h-100 overflow-y-auto">
        {table.columns.map((column: Column) => (
          <div
            key={column.name}
            className={`px-4 py-2 border-b border-gray-100 last:border-b-0 ${
              table.primaryKey.includes(column.name)
                ? "bg-yellow-50 border-l-4 border-l-yellow-400"
                : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{column.name}</span>
                {table.primaryKey.includes(column.name) && (
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                    PK
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {!column.nullable && (
                  <span className="bg-red-100 text-red-800 px-1 rounded mr-1">
                    NOT NULL
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {column.type}
              {column.default && (
                <span className="ml-2 text-blue-600">
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
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
    ];
    return colors[schemaIndex % colors.length];
  };

  return (
    <div className="w-full h-full bg-gray-50">
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
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold text-sm text-black mb-2">Schemas</h3>
        <div className="space-y-1">
          {data.schemas.map((schema, index) => {
            const colors = [
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#06b6d4",
            ];
            const color = colors[index % colors.length];
            return (
              <div key={schema} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-black">{schema}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
