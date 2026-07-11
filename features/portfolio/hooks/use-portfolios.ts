import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

export type PortfolioProject = {
  id: string;
  projectKey: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  status: string; // on_track, at_risk, off_track, on_hold
  priority: string; // low, medium, high
  startDate?: string | null;
  endDate?: string | null;
  owner?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  delayedTasks: number;
};

export type Portfolio = {
  id: string;
  name: string;
  description?: string | null;
  workspaceId: string;
  organizationId: string;
  ownerId: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  projects: PortfolioProject[];
};

export function useWorkspacePortfolios(
  workspaceId: string,
  options: { withTrashed?: boolean; onlyTrashed?: boolean } = {}
) {
  return useQuery<Portfolio[]>({
    queryKey: ["portfolios", workspaceId, options.withTrashed, options.onlyTrashed],
    queryFn: async () => {
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/portfolios`, {
        params: {
          withTrashed: options.withTrashed,
          onlyTrashed: options.onlyTrashed,
        },
      });
      return response.data.data as Portfolio[];
    },
    enabled: !!workspaceId,
  });
}

export function usePortfolioDetails(portfolioId: string) {
  return useQuery<Portfolio>({
    queryKey: ["portfolio", portfolioId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/portfolios/${portfolioId}`);
      return response.data.data as Portfolio;
    },
    enabled: !!portfolioId,
  });
}

export function useCreatePortfolio(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string | null;
      projectIds: string[];
    }) => {
      const response = await axiosInstance.post(`/workspaces/${workspaceId}/portfolios`, data);
      return response.data.data as Portfolio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios", workspaceId] });
      toast.success("Portfolio created successfully");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to create portfolio");
    },
  });
}

export function useUpdatePortfolio(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string | null;
        projectIds?: string[];
      };
    }) => {
      const response = await axiosInstance.patch(`/portfolios/${id}`, data);
      return response.data.data as Portfolio;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portfolios", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", variables.id] });
      toast.success("Portfolio updated successfully");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to update portfolio");
    },
  });
}

export function useDeletePortfolio(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/portfolios/${id}`);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["portfolios", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", id] });
      toast.success("Portfolio soft-deleted successfully");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete portfolio");
    },
  });
}

export function useRestorePortfolio(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.post(`/portfolios/${id}/restore`);
      return response.data.data as Portfolio;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["portfolios", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", id] });
      toast.success("Portfolio restored successfully");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to restore portfolio");
    },
  });
}

export function useForceDeletePortfolio(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/portfolios/${id}/force`);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["portfolios", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", id] });
      toast.success("Portfolio permanently deleted");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to permanently delete portfolio");
    },
  });
}
