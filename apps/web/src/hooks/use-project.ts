import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

type CreateProjectData = {
  name: string;
  db_type: "postgres" | "mysql";
  connection_uri: string;
};

export const useProjects = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await api.api.projects.get();
      if (error)
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to fetch",
        );
      return data?.data || [];
    },
  });

  const createProject = useMutation({
    mutationFn: async (newProject: CreateProjectData) => {
      const { data, error } = await api.api.projects.post(newProject);
      if (error)
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to create",
        );
      return data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (data?.id) {
        router.push(`/project/${data.id}`);
      }
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await api.api.projects({ id }).patch({ name });
      if (error)
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to update",
        );
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await api.api
        .projects({ id: projectId })
        .delete();
      if (error)
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to delete",
        );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return {
    projects,
    createProject,
    updateProject,
    deleteProject,
  };
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await api.api.projects({ id }).get();
      if (error)
        throw new Error(
          error.value ? JSON.stringify(error.value) : "Failed to fetch project",
        );
      return data?.data;
    },
    enabled: !!id,
  });
};
