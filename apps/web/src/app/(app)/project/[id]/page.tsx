"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  ListRestart,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DbSchemaGraph, DbSchemaGraphSchema } from "@/lib/schemas/dbGraph";
import { AddColumnDialog } from "./_components/add-column-dialog";
import { ViewIndexesDialog } from "./_components/view-indexes-dialog";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useApplySchemaChanges } from "@/hooks/use-schema";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReviewChangesDialog } from "./_components/review-changes-dialog";
import RemoveTableDialog from "./_components/remove-table-dialog";
import { ColumnDefinition, PendingChange } from "@/lib/types";

function SchemaTreeItem({
  node,
  level = 0,
  onSelect,
  isHidden,
  onToggleVisibility,
}: {
  node: any;
  level?: number;
  onSelect?: (nodeId: string) => void;
  isHidden: boolean;
  onToggleVisibility: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasColumns = node.columns && node.columns.length > 0;

  return (
    <div className="select-none group/item relative">
      <SidebarMenuButton
        onClick={() => {
          if (hasColumns) setIsOpen(!isOpen);
          onSelect?.(node.id);
        }}
        className={cn(
          "h-7 text-sm group pr-8",
          level > 0 && "pl-8",
          isHidden && "opacity-50 grayscale",
        )}
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

      <div
        className={cn(
          "absolute right-1 top-1",
          isHidden ? "flex" : "hidden group-hover/item:flex",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 rounded-sm hover:bg-background hover:text-foreground text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(node.id);
          }}
        >
          {isHidden ? (
            <EyeOff className="size-3" />
          ) : (
            <Eye className="size-3" />
          )}
        </Button>
      </div>

      {isOpen && hasColumns && !isHidden && (
        <div className="border-l border-border/40 ml-[1.15rem] pl-1 my-0.5 space-y-[1px]">
          {node.columns.map((col: any) => (
            <SidebarMenuButton
              key={col.name}
              className="h-6 text-xs pl-6 font-mono text-muted-foreground hover:text-foreground"
            >
              {node.primaryKey.includes(col.name) ? (
                <Key className="size-3 text-amber-500 mr-2 shrink-0" />
              ) : col.isPending ? (
                <div className="size-1.5 rounded-full bg-green-500 mr-2 shrink-0 animate-pulse" />
              ) : (
                <Columns className="size-3 mr-2 opacity-30 shrink-0" />
              )}
              <span
                className={cn(
                  "truncate opacity-80",
                  col.isPending &&
                    "text-green-600 dark:text-green-400 font-medium",
                )}
              >
                {col.name}
              </span>
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

  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{
    schema: string;
    name: string;
    columns: ColumnDefinition[];
  } | null>(null);

  const [isViewIndexesOpen, setIsViewIndexesOpen] = useState(false);
  const [indexesTable, setIndexesTable] = useState<{
    schema: string;
    name: string;
  } | null>(null);

  console.log("ProjectID: ", id);
  console.log(project);

  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const [pendingChanges, setPendingChanges] = useLocalStorage<PendingChange[]>(
    `${id}.changes`,
    [],
  );

  const [hiddenTableIds, setHiddenTableIds] = useState<Set<string>>(new Set());

  const toggleTableVisibility = useCallback((nodeId: string) => {
    setHiddenTableIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [removeID, setRemoveID] = useState("");

  const mutateSchema = useApplySchemaChanges(id);
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);

  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  const mergedSchema = useMemo(() => {
    if (!project?.schemaSnapshot) return null;

    let baseData: DbSchemaGraph;
    try {
      baseData = DbSchemaGraphSchema.parse(project.schemaSnapshot);
      if (project.graphLayout) {
        // @ts-ignore
        baseData.layout = project.graphLayout as Record<
          string,
          { x: number; y: number }
        >;
      }
    } catch (e) {
      console.error("Schema parse error", e);
      return null;
    }

    const clonedData = JSON.parse(JSON.stringify(baseData)) as DbSchemaGraph;

    const droppedTableIds = new Set<string>();
    pendingChanges.forEach((change) => {
      if (change.type === "DROP_TABLE") {
        droppedTableIds.add(`${change.schema}.${change.table}`);
      }
    });

    clonedData.nodes = clonedData.nodes.filter(
      (node) => !droppedTableIds.has(node.id),
    );
    clonedData.edges = clonedData.edges.filter(
      (edge) =>
        !droppedTableIds.has(edge.source) && !droppedTableIds.has(edge.target),
    );

    pendingChanges.forEach((change) => {
      if (change.type === "CREATE_COLUMN" && change.column) {
        const node = clonedData.nodes.find(
          (n) => n.schema === change.schema && n.name === change.table,
        );
        if (node) {
          node.columns.push({
            name: change.column.name,
            type: change.column.type,
            udt: change.column.type,
            nullable: change.column.nullable,
            default: change.column.defaultValue || null,
            position: node.columns.length + 1,
            // @ts-ignore
            isPending: true,
          });
        }
      } else if (change.type === "CREATE_TABLE" && change.column) {
        clonedData.nodes.push({
          id: `${change.schema}.${change.table}`,
          name: change.table,
          schema: change.schema,
          type: "BASE TABLE",
          primaryKey: [change.column.name],
          columns: [
            {
              name: change.column.name,
              type: change.column.type,
              udt: change.column.type,
              nullable: change.column.nullable,
              default: change.column.defaultValue || null,
              position: 1,
              // @ts-ignore
              isPending: true,
            },
          ],
        });
      }
    });

    const freqSchema = new Set();
    clonedData.nodes.forEach((node) => {
      freqSchema.add(node.schema);
    });

    clonedData.schemas = clonedData.schemas.filter((schema) =>
      freqSchema.has(schema),
    );

    return clonedData;
  }, [project, pendingChanges]);

  const graphSchema = useMemo(() => {
    if (!mergedSchema) return null;

    if (hiddenTableIds.size === 0) return mergedSchema;

    const filtered = { ...mergedSchema };

    // Filter nodes
    filtered.nodes = mergedSchema.nodes.filter(
      (node) => !hiddenTableIds.has(node.id),
    );

    filtered.edges = mergedSchema.edges.filter(
      (edge) =>
        !hiddenTableIds.has(edge.source) && !hiddenTableIds.has(edge.target),
    );

    return filtered;
  }, [mergedSchema, hiddenTableIds]);
  // MODIFIED END

  const handleQueueColumnAdd = useCallback(
    (colDef: ColumnDefinition) => {
      if (!selectedTable) return;

      setPendingChanges((prev) => [
        ...prev,
        {
          type: "CREATE_COLUMN",
          schema: selectedTable.schema,
          table: selectedTable.name,
          column: colDef,
        },
      ]);
    },
    [selectedTable, setPendingChanges],
  );

  const handleAddColumnClick = useCallback(
    (schema: string, table: string, columns: ColumnDefinition[]) => {
      setSelectedTable({ schema, name: table, columns });
      setIsAddColumnOpen(true);
    },
    [],
  );

  const handlePublish = async () => {
    setIsPublishing(true);

    const toastId = toast.loading("Applying schema changes...");

    try {
      await mutateSchema.mutateAsync(pendingChanges);
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
      await queryClient.invalidateQueries({ queryKey: ["schema-indexes", id] });
      setPendingChanges([]);
      toast.dismiss(toastId);
      toast.success("Schema updated successfully");
      setIsReviewOpen(false);
    } catch (e) {
      console.error(e);
      toast.dismiss(toastId);
      toast.error("Failed to publish changes");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRemoveChange = (index: number) => {
    setPendingChanges((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDiscardAll = () => {
    if (confirm("Are you sure you want to discard all pending changes?")) {
      setPendingChanges([]);
      setIsReviewOpen(false);
      toast.info("All changes discarded");
    }
  };

  const handleViewIndexesClick = useCallback(
    (schema: string, table: string) => {
      setIndexesTable({ schema, name: table });
      setIsViewIndexesOpen(true);
    },
    [],
  );

  const handleRemoveTable = (id: string) => {
    setRemoveID(id);
    setIsRemoveOpen(true);
  };

  const handleDeleteTable = () => {
    const parts = removeID.split(".");
    if (parts.length < 2) return;

    const schema = parts[0];
    const table = parts.slice(1).join(".");

    const isLocalCreation = pendingChanges.some(
      (c) =>
        c.type === "CREATE_TABLE" && c.schema === schema && c.table === table,
    );

    if (isLocalCreation) {
      setPendingChanges((prev) =>
        prev.filter((c) => !(c.schema === schema && c.table === table)),
      );
      toast.info(`Table "${table}" creation cancelled`);
    } else {
      setPendingChanges((prev) => [
        ...prev,
        {
          type: "DROP_TABLE",
          schema,
          table,
        },
      ]);
      toast.warning(`Table "${table}" marked for deletion`);
    }
    setIsRemoveOpen(false);
  };

  const filteredNodes = useMemo(() => {
    if (!mergedSchema) return [];
    if (!searchTerm) return mergedSchema.nodes;
    return mergedSchema.nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.schema.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, mergedSchema]);

  const nodesBySchema = useMemo(() => {
    const groups: Record<string, typeof filteredNodes> = {};
    if (!filteredNodes.length) return [];
    filteredNodes.forEach((node) => {
      if (!groups[node.schema]) groups[node.schema] = [];
      groups[node.schema].push(node);
    });
    return groups;
  }, [filteredNodes]);

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
                            <SchemaTreeItem
                              node={node}
                              isHidden={hiddenTableIds.has(node.id)}
                              onToggleVisibility={toggleTableVisibility}
                            />
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

        <SidebarInset className="flex flex-col h-full w-full overflow-hidden bg-muted/5">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4 z-10 shadow-sm">
            <SidebarTrigger className="-ml-1 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" />
            <SidebarSeparator orientation="vertical" className="mr-2 h-4" />

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
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {pendingChanges.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 mr-2">
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] h-6 px-2 text-muted-foreground bg-muted border-border/60"
                  >
                    {pendingChanges.length} unsaved change
                    {pendingChanges.length !== 1 ? "s" : ""}
                  </Badge>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-2 bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                    onClick={() => setIsReviewOpen(true)}
                  >
                    <ListRestart className="size-3.5" />
                    Review
                  </Button>
                  <SidebarSeparator
                    orientation="vertical"
                    className="mx-1 h-4"
                  />
                </div>
              )}

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
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative bg-muted/5">
            <div className="absolute inset-0">
              {graphSchema && (
                <DatabaseSchemaGraph
                  currentChanges={pendingChanges}
                  data={graphSchema}
                  setChanges={setPendingChanges}
                  onAddColumn={handleAddColumnClick}
                  onViewIndexes={handleViewIndexesClick}
                  onDeleteTable={handleRemoveTable}
                />
              )}
            </div>
          </div>
        </SidebarInset>

        <AddColumnDialog
          open={isAddColumnOpen}
          onOpenChange={setIsAddColumnOpen}
          targetTable={selectedTable}
          onAdd={handleQueueColumnAdd}
        />

        <ViewIndexesDialog
          open={isViewIndexesOpen}
          onOpenChange={setIsViewIndexesOpen}
          targetTable={indexesTable}
        />

        <ReviewChangesDialog
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          changes={pendingChanges}
          onRemoveChange={handleRemoveChange}
          onDiscardAll={handleDiscardAll}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
        <RemoveTableDialog
          open={isRemoveOpen}
          setOpen={setIsRemoveOpen}
          handleDeleteTable={handleDeleteTable}
        />
      </div>
    </SidebarProvider>
  );
}
