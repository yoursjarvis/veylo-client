import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

export type KeyResult = {
  id: string;
  title: string;
  progress: number;
  target: string;
};

export type Objective = {
  id: string;
  title: string;
  description: string;
  progress: number;
  keyResults: KeyResult[];
  linkedProjects: string[];
};

type DbKeyResult = {
  id: string;
  title: string;
  progress: number;
  target: string;
};

type DbObjective = {
  id: string;
  title: string;
  description?: string | null;
  progress: number;
  keyResults?: DbKeyResult[];
  project?: {
    title: string;
  } | null;
};

export function useWorkspaceObjectives(workspaceId: string) {
  return useQuery<Objective[]>({
    queryKey: ["objectives", workspaceId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/objectives`);
      const dbObjectives = (response.data.data || []) as DbObjective[];
      return dbObjectives.map((obj) => ({
        id: obj.id,
        title: obj.title,
        description: obj.description || "",
        progress: obj.progress || 0,
        keyResults: (obj.keyResults || []).map((kr) => ({
          id: kr.id,
          title: kr.title,
          progress: kr.progress || 0,
          target: kr.target,
        })),
        linkedProjects: obj.project ? [obj.project.title] : [],
      }));
    },
    enabled: !!workspaceId,
  });
}

export function useCreateObjective(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      krTitle: string;
      krTarget: string;
      projectId: string;
      epicId?: string | null;
    }) => {
      const response = await axiosInstance.post("/objectives", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives", workspaceId] });
      toast.success("Objective created successfully");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to create objective");
    },
  });
}
