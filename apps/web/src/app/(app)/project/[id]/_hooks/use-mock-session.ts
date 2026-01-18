import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface MockSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  token?: string;
}

export const useMockSessions = (projectId: string) => {
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: ["mock-sessions", projectId],
    queryFn: async () => {
      const { data, error } = await api.api.mock
        .project({ projectId })
        .sessions.get();

      if (error) throw error;
      return (data?.data as unknown as MockSession[]) || [];
    },
    enabled: !!projectId,
  });

  const createSession = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.mock.session.post({
        projectId,
      });
      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mock-sessions", projectId] });
    },
  });

  const revokeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await api.api.mock.session({ sessionId }).delete();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mock-sessions", projectId] });
    },
  });

  return {
    sessions,
    createSession,
    revokeSession,
  };
};
