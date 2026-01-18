import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { ColumnDefinition, TableData } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  TableIcon,
  EyeOff,
  Eye,
  Key,
  Columns,
} from "lucide-react";
import { useState } from "react";

export function SchemaTreeItem({
  node,
  level = 0,
  onSelect,
  onColumnClick,
  isHidden,
  onToggleVisibility,
}: {
  node: any;
  level?: number;
  onSelect?: (nodeId: string) => void;
  onColumnClick: (table: TableData, column: ColumnDefinition) => void;
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
              onClick={() => onColumnClick(node, col)}
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
