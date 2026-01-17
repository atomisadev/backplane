import { useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Node } from "@xyflow/react";

export const useSaveLayout = (projectId: string) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mutation = useMutation({
    mutationFn: async (layout: Record<string, { x: number; y: number }>) => {
      const { error } = await api.api
        .projects({ id: projectId })
        .patch({ graphLayout: layout });

      if (error) {
        throw new Error("Failed to save layout");
      }
    },
  });

  const saveLayout = useCallback(
    (nodes: Node[]) => {
      const layoutMap: Record<string, { x: number; y: number }> = {};

      nodes.forEach((node) => {
        layoutMap[node.id] = {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        };
      });

      mutation.mutate(layoutMap);
    },
    [mutation],
  );

  return { saveLayout, isSaving: mutation.isPending };
};
