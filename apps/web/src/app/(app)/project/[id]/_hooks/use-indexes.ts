import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface IndexData {
  name: string;
  columns: string[];
  unique: boolean;
  primary: boolean;
  method: string;
}

export const useIndexes = (
  projectId: string,
  schema?: string,
  table?: string,
  enabled: boolean = false,
) => {
  return useQuery({
    queryKey: ["indexes", projectId, schema, table],
    queryFn: async () => {
      if (!schema || !table) return [];

      const { data, error } = await api.api.schema({ projectId }).indexes.get({
        query: {
          schema,
          table,
        },
      });

      if (error) {
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to fetch indexes",
        );
      }

      return (data?.data as unknown as IndexData[]) || [];
    },
    enabled: enabled && !!schema && !!table,
  });
};
