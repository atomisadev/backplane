import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PendingChange } from "@/app/(app)/project/[id]/page";
import { ColumnDefinition } from "@/app/(app)/project/[id]/_components/add-column-dialog";

export const useSchemaIndexes = (
  projectId: string,
  schema: string,
  table: string,
) =>
  useQuery({
    queryKey: ["schema-indexes", projectId, schema, table],
    queryFn: async () => {
      const { data, error } = await api.api
        .schema({ projectId })
        .indexes.get({ query: { schema, table } });

      if (error)
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to fetch indexes",
        );

      return data?.data;
    },
    enabled: !!projectId && !!schema && !!table,
  });

export const useCreateColumn = (projectId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      schema: string;
      table: string;
      column: ColumnDefinition;
    }) => {
      const { error } = await api.api.schema({ projectId }).columns.post(input);
      if (error)
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to create column",
        );
      return true;
    },
    onSuccess: () => {
      // invalidate whatever queries depend on schema/table columns
      qc.invalidateQueries({ queryKey: ["schema-snapshot", projectId] });
    },
  });
};

export const useApplySchemaChanges = (projectId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (changes: PendingChange[]) => {
      const { error } = await api.api.schema({ projectId }).post({ changes });
      if (error)
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to apply changes",
        );
      return true;
    },
    onSuccess: () => {
      // Invalidate the project query which contains the schemaSnapshot
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      // Also invalidate schema-indexes queries
      qc.invalidateQueries({ queryKey: ["schema-indexes", projectId] });
    },
  });
};
