// MODIFIED START: Fixed Top Bar styling and SidebarInset background
// File: apps/web/src/app/(app)/project/[id]/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useProject } from "@/hooks/use-project";
import { useParams, useRouter } from "next/navigation";
import { DatabaseSchemaGraph } from "@/components/database-schema-graph";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Database,
  Table as TableIcon,
  Columns,
  Key,
  LayoutGrid,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DbSchemaGraph, DbSchemaGraphSchema } from "@/lib/schemas/dbGraph";

// --- Mock Data (Enriched for visual demo) ---
const MOCK_SCHEMA_DATA = {
  schemas: ["public", "auth"],
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
          type: "text",
          udt: "text",
          nullable: false,
          default: null,
          position: 2,
        },
        {
          name: "name",
          type: "text",
          udt: "text",
          nullable: true,
          default: null,
          position: 3,
        },
        {
          name: "created_at",
          type: "timestamp",
          udt: "timestamp",
          nullable: false,
          default: "now()",
          position: 4,
        },
        {
          name: "role",
          type: "varchar",
          udt: "varchar",
          nullable: false,
          default: "'user'",
          position: 5,
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
          type: "text",
          udt: "text",
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
          name: "published",
          type: "boolean",
          udt: "bool",
          nullable: false,
          default: "false",
          position: 4,
        },
        {
          name: "author_id",
          type: "uuid",
          udt: "uuid",
          nullable: false,
          default: null,
          position: 5,
        },
      ],
    },
    {
      id: "auth.sessions",
      schema: "auth",
      name: "sessions",
      type: "BASE TABLE",
      primaryKey: ["token"],
      columns: [
        {
          name: "token",
          type: "text",
          udt: "text",
          nullable: false,
          default: null,
          position: 1,
        },
        {
          name: "user_id",
          type: "uuid",
          udt: "uuid",
          nullable: false,
          default: null,
          position: 2,
        },
        {
          name: "expires_at",
          type: "timestamp",
          udt: "timestamp",
          nullable: false,
          default: null,
          position: 3,
        },
        {
          name: "ip_address",
          type: "inet",
          udt: "inet",
          nullable: true,
          default: null,
          position: 4,
        },
      ],
    },
  ],
  edges: [
    {
      id: "posts_author_id_fkey",
      source: "public.posts",
      sourceColumn: "author_id",
      target: "public.users",
      targetColumn: "id",
      label: "author_id → id",
    },
    {
      id: "sessions_user_id_fkey",
      source: "auth.sessions",
      sourceColumn: "user_id",
      target: "public.users",
      targetColumn: "id",
      label: "user_id → id",
    },
  ],
};

function SchemaTreeItem({
  node,
  level = 0,
  onSelect,
}: {
  node: any;
  level?: number;
  onSelect?: (nodeId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasColumns = node.columns && node.columns.length > 0;

  return (
    <div className="select-none">
      <SidebarMenuButton
        onClick={() => {
          if (hasColumns) setIsOpen(!isOpen);
          onSelect?.(node.id);
        }}
        className={cn("h-7 text-sm group", level > 0 && "pl-8")}
      >
        {hasColumns ? (
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform text-muted-foreground/50 group-hover:text-foreground",
              isOpen && "rotate-90",
            )}
          />
        ) : (
          <div className="size-3.5" />
        )}
        <TableIcon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="truncate">{node.name}</span>
        {node.schema && (
          <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono">
            {node.schema}
          </span>
        )}
      </SidebarMenuButton>

      {isOpen && hasColumns && (
        <div className="border-l border-border/40 ml-[1.15rem] pl-1 my-0.5 space-y-[1px]">
          {node.columns.map((col: any) => (
            <SidebarMenuButton
              key={col.name}
              className="h-6 text-xs pl-6 font-mono text-muted-foreground hover:text-foreground"
            >
              {node.primaryKey.includes(col.name) ? (
                <Key className="size-3 text-amber-500 mr-2 shrink-0" />
              ) : (
                <Columns className="size-3 mr-2 opacity-30 shrink-0" />
              )}
              <span className="truncate opacity-80">{col.name}</span>
              <span className="ml-auto text-[9px] opacity-40">{col.type}</span>
            </SidebarMenuButton>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectView() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: project, isLoading, error } = useProject(id);
  const [searchTerm, setSearchTerm] = useState("");

  let schema_data: DbSchemaGraph | null = null;
  if (project?.schemaSnapshot) {
    schema_data = DbSchemaGraphSchema.parse(project.schemaSnapshot);
  }

  const filteredNodes = useMemo(() => {
    if (!schema_data) return [];
    if (!searchTerm) return schema_data.nodes;
    return schema_data.nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.schema.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, schema_data]);

  const nodesBySchema = useMemo(() => {
    const groups: Record<string, typeof filteredNodes> = {};
    if (!filteredNodes.length) return [];

    console.log("filteredNodes: ", filteredNodes);

    filteredNodes.forEach((node) => {
      if (!groups[node.schema]) groups[node.schema] = [];
      groups[node.schema].push(node);
    });

    return groups;
  }, [filteredNodes, schema_data]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "260px" } as React.CSSProperties}
    >
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* LEFT SIDEBAR: EXPLORER */}
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarHeader className="border-b border-border/40 p-4">
            <div className="flex items-center gap-3 px-1 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                <Database className="size-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-semibold text-sm leading-none">
                  {project.name}
                </span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="size-1.5 rounded-full bg-green-500" />
                  <span className="truncate text-xs text-muted-foreground font-mono">
                    {project.dbType}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 size-3.5 text-muted-foreground/70" />
              <SidebarInput
                placeholder="Search tables..."
                className="pl-8 h-8 text-xs bg-sidebar-accent/50 border-sidebar-border focus:bg-background transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-muted-foreground/50 mb-1">
                EXPLORER
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {Object.entries(nodesBySchema).length === 0 ? (
                    <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                      No matching tables.
                    </div>
                  ) : (
                    Object.entries(nodesBySchema).map(([schema, nodes]) => (
                      <div key={schema} className="mb-4">
                        <div className="flex items-center px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                          <LayoutGrid className="size-3 mr-2 opacity-60" />
                          {schema}
                        </div>
                        {nodes.map((node) => (
                          <SidebarMenuItem key={node.id}>
                            <SchemaTreeItem node={node} />
                          </SidebarMenuItem>
                        ))}
                      </div>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto p-4 border-t border-border/40">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground px-2"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="size-4" />
              Back to Projects
            </Button>
          </div>
          <SidebarRail />
        </Sidebar>

        {/* RIGHT SIDE: CANVAS */}
        <SidebarInset className="flex flex-col h-full w-full overflow-hidden bg-muted/5">
          {/* Header Area - FIX: Explicit background colors to avoid black bar */}
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4 z-10 shadow-sm">
            <SidebarTrigger className="-ml-1 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" />
            <SidebarSeparator orientation="vertical" className="mr-2 h-4" />

            {/* Breadcrumbs simulation */}
            <div className="flex items-center gap-1.5 text-sm">
              <span
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => router.push("/dashboard")}
              >
                Projects
              </span>
              <ChevronRight className="size-4 text-muted-foreground/30" />
              <span className="font-medium text-foreground flex items-center gap-2">
                {project.name}
                <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
                  {project.dbType}
                </span>
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1 bg-background rounded-lg p-0.5 border border-border/60 shadow-xs">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 rounded-md hover:bg-muted"
                >
                  <Search className="size-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 rounded-md hover:bg-muted"
                >
                  <Settings className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
              <SidebarSeparator orientation="vertical" className="mx-1 h-4" />
              <Button
                size="sm"
                className="h-8 text-xs gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Database className="size-3.5" />
                Introspect
              </Button>
            </div>
          </header>

          {/* Graph Area */}
          <div className="flex-1 overflow-hidden relative bg-muted/5">
            <div className="absolute inset-0">
              {schema_data && <DatabaseSchemaGraph data={schema_data} />}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
// MODIFIED END
