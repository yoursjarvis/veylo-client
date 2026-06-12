import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

export function useWorkspaces() {
  const queryClient = useQueryClient();
  const params = useParams<{ workspaceSlug?: string }>();
  const router = useRouter();
  const pathname = usePathname();

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
      if (params?.workspaceSlug) {
        const urlWorkspace = workspaces.find((w) => w.slug === params.workspaceSlug);
        if (urlWorkspace) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          setActiveWorkspaceId(urlWorkspace.id);
          localStorage.setItem("last_used_workspace_id", urlWorkspace.id);
          return;
        }
      }

      const savedId = localStorage.getItem("last_used_workspace_id");
      const exists = workspaces.find((w) => w.id === savedId);
      if (exists) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setActiveWorkspaceId(savedId);
      } else {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setActiveWorkspaceId(workspaces[0].id);
      }
    }
  }, [workspaces, params?.workspaceSlug]);

  const setActiveWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem("last_used_workspace_id", id);
    const workspace = workspaces?.find((w) => w.id === id);
    if (workspace && params?.workspaceSlug && pathname) {
       const newPath = pathname.replace(`/${params.workspaceSlug}`, `/${workspace.slug}`);
       router.push(newPath);
    } else if (workspace) {
       router.push(`/${workspace.slug}/dashboard`);
    }
  };

  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId) || null;

  const createWorkspace = useMutation({
    mutationFn: async (data: { name: string; slug: string; icon?: string }) => {
      const response = await axiosInstance.post("/workspaces", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const updateWorkspace = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; slug?: string; icon?: string } }) => {
      const response = await axiosInstance.patch(`/workspaces/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const deleteWorkspace = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/workspaces/${id}`);
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
    updateWorkspace,
    deleteWorkspace,
  };
}
