"use client";

import React, { useState } from "react";
import { DatabaseSchemaGraph } from "./database-schema-graph";

interface DatabaseSchema {
  schemas: string[];
  nodes: Array<{
    id: string;
    schema: string;
    name: string;
    type: string;
    primaryKey: string[];
    columns: Array<{
      name: string;
      type: string;
      udt: string;
      nullable: boolean;
      default: string | null;
      position: number;
    }>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    sourceColumn: string;
    target: string;
    targetColumn: string;
    label: string;
  }>;
}

// Example usage component that demonstrates how to use the DatabaseSchemaGraph
export function SchemaGraphExample() {
  // State to hold the schema data
  const [schemaData, setSchemaData] = useState<DatabaseSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to simulate fetching schema data from an API
  const fetchSchemaData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real application, you would fetch this from your API
      // For demo purposes, we'll simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockData = {
        schemas: ["public", "auth", "analytics"],
        nodes: [
          {
            id: "public.users",
            schema: "public",
            name: "users",
            type: "BASE TABLE",
            primaryKey: ["id"],
            columns: [
              {
                name: "id",
                type: "uuid",
                udt: "uuid",
                nullable: false,
                default: "gen_random_uuid()",
                position: 1,
              },
              {
                name: "email",
                type: "varchar",
                udt: "varchar",
                nullable: false,
                default: null,
                position: 2,
              },
              {
                name: "created_at",
                type: "timestamp",
                udt: "timestamp",
                nullable: false,
                default: "now()",
                position: 3,
              },
            ],
          },
          {
            id: "public.posts",
            schema: "public",
            name: "posts",
            type: "BASE TABLE",
            primaryKey: ["id"],
            columns: [
              {
                name: "id",
                type: "uuid",
                udt: "uuid",
                nullable: false,
                default: "gen_random_uuid()",
                position: 1,
              },
              {
                name: "title",
                type: "varchar",
                udt: "varchar",
                nullable: false,
                default: null,
                position: 2,
              },
              {
                name: "content",
                type: "text",
                udt: "text",
                nullable: true,
                default: null,
                position: 3,
              },
              {
                name: "user_id",
                type: "uuid",
                udt: "uuid",
                nullable: false,
                default: null,
                position: 4,
              },
              {
                name: "created_at",
                type: "timestamp",
                udt: "timestamp",
                nullable: false,
                default: "now()",
                position: 5,
              },
            ],
          },
        ],
        edges: [
          {
            id: "posts_user_id_fkey",
            source: "public.posts",
            sourceColumn: "user_id",
            target: "public.users",
            targetColumn: "id",
            label: "user_id → id",
          },
        ],
      };

      setSchemaData(mockData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle file upload (JSON format)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === "string") {
          const data = JSON.parse(result) as DatabaseSchema;
          setSchemaData(data);
          setError(null);
        }
      } catch {
        setError("Invalid JSON file format");
      }
    };
    reader.readAsText(file);
  };

  // Function to clear the current schema
  const clearSchema = () => {
    setSchemaData(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col p-6 md:p-10 bg-background">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header with controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              Database Schema Visualizer
            </h1>
            <p className="text-muted-foreground">
              Load a demo schema or upload your own JSON file to get started.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={fetchSchemaData}
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Loading..." : "Load Demo Schema"}
            </button>

            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
              Upload JSON Schema
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {schemaData && (
              <button
                onClick={clearSchema}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Clear Schema
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              Error: {error}
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 relative">
          {!schemaData ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/10 p-8 text-center animate-in fade-in-50">
              <div className="text-muted-foreground mb-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <svg
                    className="size-6 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m9 12 2 2 4-4"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 mt-4">
                No Schema Loaded
              </h3>
              <p className="text-muted-foreground mb-6">
                Load a demo schema or upload your own JSON file to get started.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Expected JSON format:</p>
                <pre className="text-left bg-muted p-2 rounded text-xs max-w-md overflow-auto">
                  {`{
  "schemas": ["schema1", "schema2"],
  "nodes": [{
    "id": "schema.table",
    "schema": "schema",
    "name": "table",
    "type": "BASE TABLE",
    "primaryKey": ["id"],
    "columns": [...]
  }],
  "edges": [{
    "id": "fkey_name",
    "source": "table1",
    "target": "table2",
    "sourceColumn": "col1",
    "targetColumn": "col2",
    "label": "relationship"
  }]
}`}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-[600px] w-full rounded-xl border bg-card shadow-sm">
              <DatabaseSchemaGraph data={schemaData} />
            </div>
          )}
        </div>

        {/* Info panel */}
        {schemaData && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-foreground text-2xl">
                  {schemaData.schemas?.length || 0}
                </div>
                <div className="text-muted-foreground">Schemas</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground text-2xl">
                  {schemaData.nodes?.length || 0}
                </div>
                <div className="text-muted-foreground">Tables</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground text-2xl">
                  {schemaData.edges?.length || 0}
                </div>
                <div className="text-muted-foreground">Relations</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export the component as default as well for convenience
export default SchemaGraphExample;
