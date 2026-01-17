import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";

interface CreateColumnParams {
  schema: string;
  table: string;
  column: {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: string;
  };
}

export const useSchemaMutation = () => {
  const { id: projectId } = useParams() as { id: string };
  const queryClient = useQueryClient();

  const createColumn = useMutation({
    mutationFn: async (params: CreateColumnParams) => {
      const { data, error } = await api.api.schema({ projectId }).columns.post({
        schema: params.schema,
        table: params.table,
        column: params.column,
      });

      if (error) {
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to create column",
        );
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  return { createColumn };
};
