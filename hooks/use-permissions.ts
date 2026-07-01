import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { authClient } from "@/lib/auth-client";
import { useWorkspaceContext } from "@/components/providers/workspace-provider";
import { useParams } from "next/navigation";

interface PermissionContext {
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
}

export function usePermissions(context?: PermissionContext) {
  const { data: session } = authClient.useSession();
  const { activeWorkspace } = useWorkspaceContext();
  const params = useParams();

  // Auto-resolve context if not provided
  const resolvedContext = context || {
    organizationId: session?.session?.activeOrganizationId || undefined,
    workspaceId: activeWorkspace?.id || undefined,
    projectId: (params?.projectId as string) || undefined,
    taskId: (params?.taskId as string) || undefined,
  };

  const queryKey = ["permissions", resolvedContext];

  const { data: permissions, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (resolvedContext.organizationId) searchParams.append("organizationId", resolvedContext.organizationId);
      if (resolvedContext.workspaceId) searchParams.append("workspaceId", resolvedContext.workspaceId);
      if (resolvedContext.projectId) searchParams.append("projectId", resolvedContext.projectId);
      if (resolvedContext.taskId) searchParams.append("taskId", resolvedContext.taskId);

      const res = await axiosInstance.get(`/rbac/permissions/me?${searchParams.toString()}`);
      return res.data.data as string[];
    },
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasPermission = (permission: string) => {
    if (!permissions) return false;
    if (permissions.includes("*")) return true;
    return permissions.includes(permission);
  };

  return {
    permissions: permissions || [],
    hasPermission,
    isLoading,
  };
}
