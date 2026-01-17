import { useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Node } from "@xyflow/react";

export const useSaveLayout = (projectId: string) => {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedLayoutRef = useRef<string>("");

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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const layoutMap: Record<string, { x: number; y: number }> = {};

        nodes.forEach((node) => {
          layoutMap[node.id] = {
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
          };
        });

        const layoutString = JSON.stringify(layoutMap);
        if (layoutString === lastSavedLayoutRef.current) {
          return;
        }

        lastSavedLayoutRef.current = layoutString;
        mutation.mutate(layoutMap);
      }, 1000);
    },
    [mutation],
  );

  return { saveLayout, isSaving: mutation.isPending };
};
