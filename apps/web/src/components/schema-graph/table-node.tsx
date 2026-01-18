import React, { memo, useMemo } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import {
  Key,
  Database,
  GripHorizontal,
  Plus,
  List,
  Grip,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchemaNode } from "./types";
import { cn } from "@/lib/utils";

const TableNodeComponent = ({ data }: NodeProps<SchemaNode>) => {
  const { table, onAddColumn, onViewIndexes, onDeleteTable } = data;
  const { fitView } = useReactFlow();

  const sortedColumns = useMemo(() => {
    const pkCols = [];
    const otherCols = [];

    for (const col of table.columns) {
      if (table.primaryKey.includes(col.name)) {
        pkCols.push(col);
      } else {
        otherCols.push(col);
      }
    }

    return [...pkCols, ...otherCols];
  }, [table.columns, table.primaryKey]);

  return (
    <div className="group/node relative min-w-[280px] rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg hover:ring-1 hover:ring-primary/20">
      <div className="flex flex-col border-b border-border bg-muted/30 px-4 py-3 first:rounded-t-xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="rounded-[4px] border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {table.schema}
            </span>
          </div>
          <div className="flex items-center -mr-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm opacity-0 group-hover/node:opacity-100 transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation();
                fitView({
                  nodes: [{ id: table.id }],
                  padding: 0.5,
                  duration: 1000,
                  maxZoom: 1,
                });
              }}
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteTable) onDeleteTable(table.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between w-full">
          <div className="font-semibold text-sm tracking-tight flex items-center gap-2">
            <Database className="size-3.5 text-primary/70" />
            {table.name}
          </div>
        </div>
      </div>

      <div className="flex flex-col py-1">
        {sortedColumns.map((column) => {
          const isPk = table.primaryKey.includes(column.name);
          const isPending = column.isPending;
          return (
            <div
              key={column.name}
              className={cn(
                "relative group flex items-center justify-between px-4 py-1.5 text-xs transition-colors",
                isPending
                  ? "bg-green-500/10 hover:bg-green-500/15 border-l-2 border-green-500"
                  : "hover:bg-muted/50",
                isPk && !isPending && "bg-primary/5",
              )}
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
                  ) : isPending ? (
                    <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                  ) : (
                    <div className="size-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-muted-foreground/60" />
                  )}
                </div>
                <span
                  className={cn(
                    "truncate font-medium font-mono",
                    isPk
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
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

      <div className="flex items-center border-t border-border/50 bg-muted/10 p-1.5 gap-1.5 rounded-b-xl">
        <Button
          variant="ghost"
          size="sm"
          className="nodrag h-7 flex-1 text-[10px] font-medium text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm border border-transparent hover:border-border/50 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddColumn) {
              onAddColumn(table.schema, table.name, table.columns);
            } else {
              alert(`Add column to ${table.name}`);
            }
          }}
        >
          <Plus className="mr-1.5 size-3" />
          Add Column
        </Button>
        <div className="h-4 w-[1px] bg-border/40" />
        <Button
          variant="ghost"
          size="sm"
          className="nodrag h-7 flex-1 text-[10px] font-medium text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm border border-transparent hover:border-border/50 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            if (onViewIndexes) {
              onViewIndexes(table.schema, table.name);
            }
          }}
        >
          <List className="mr-1.5 size-3" />
          Indexes
        </Button>
      </div>
    </div>
  );
};

export const TableNode = memo(TableNodeComponent);
