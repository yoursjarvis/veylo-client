import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useEffect, useState } from "react";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

export function useWorkspaces() {
  const queryClient = useQueryClient();

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const response = await axiosInstance.get("/workspaces");
      return response.data.data;
    },
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      const savedId = localStorage.getItem("last_used_workspace_id");
      const exists = workspaces.find((w) => w.id === savedId);
      if (exists) {
        setActiveWorkspaceId(savedId);
      } else {
        setActiveWorkspaceId(workspaces[0].id);
      }
    }
  }, [workspaces]);

  const setActiveWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem("last_used_workspace_id", id);
  };

  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId) || null;

  const createWorkspace = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const response = await axiosInstance.post("/workspaces", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  return {
    workspaces,
    isLoading,
    activeWorkspace,
    setActiveWorkspace,
    createWorkspace,
  };
}
