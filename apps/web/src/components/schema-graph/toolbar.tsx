import React from "react";
import { Panel, useReactFlow } from "@xyflow/react";
import {
  Plus,
  Undo2,
  Redo2,
  MousePointer2,
  Hand,
  Type,
  LayoutTemplate,
  ZoomOut,
  Scan,
  ZoomIn,
  Loader2,
} from "lucide-react";
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
import { DbSchemaGraphData, PendingChange } from "../../lib/types";

interface GraphToolbarProps {
  onAddNode: () => void;
  currentChanges: PendingChange[];
  schemaData: DbSchemaGraphData;
  setChanges: React.Dispatch<React.SetStateAction<PendingChange[]>>;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  interactionMode: "pointer" | "hand";
  setInteractionMode: (v: "pointer" | "hand") => void;
  onAutoLayout: () => void;
  isLayouting: boolean;
}

export function GraphToolbar({
  onAddNode,
  currentChanges,
  schemaData,
  setChanges,
  showLabels,
  setShowLabels,
  interactionMode,
  setInteractionMode,
  onAutoLayout,
  isLayouting,
}: GraphToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-center" className="mb-6 sm:mb-8">
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-md border border-border/60 rounded-full shadow-xl supports-[backdrop-filter]:bg-background/60">
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center px-1">
            <AddTable
              schemaSnapshot={schemaData}
              setChanges={setChanges}
              currentChanges={currentChanges}
            />
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
                  onClick={() => fitView({ padding: 0.15, duration: 600 })}
                >
                  <Scan className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Focus</TooltipContent>
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
