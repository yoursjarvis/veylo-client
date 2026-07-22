import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { rbacService } from "../services/rbac.service";

export const rbacKeys = {
  all: ["rbac"] as const,
  permissions: () => [...rbacKeys.all, "permissions"] as const,
  roles: (orgId: string, search?: string) => [...rbacKeys.all, "roles", orgId, { search }] as const,
  assignments: (orgId: string) => [...rbacKeys.all, "assignments", orgId] as const,
};

export const usePermissions = () => {
  return useQuery({
    queryKey: rbacKeys.permissions(),
    queryFn: rbacService.getPermissions,
  });
};

export const useOrganizationRoles = (orgId: string, search?: string) => {
  return useInfiniteQuery({
    queryKey: rbacKeys.roles(orgId, search),
    queryFn: ({ pageParam }) => rbacService.getOrganizationRoles(orgId, { search, limit: 10, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!orgId,
  });
};

export const useUserAssignments = (userId: string, scopeType?: string, scopeId?: string) => {
  return useQuery({
    queryKey: [...rbacKeys.all, "userAssignments", userId, scopeType, scopeId],
    queryFn: () => rbacService.getUserAssignments(userId, scopeType, scopeId),
    enabled: !!userId,
  });
};

export const useCreateRole = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rbacService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles", orgId] });
    },
  });
};

export const useUpdateRolePermissions = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, name, permissionIds, bypassPermissions }: { roleId: string; name?: string; permissionIds?: string[]; bypassPermissions?: boolean }) =>
      rbacService.updateRolePermissions(roleId, { name, permissionIds, bypassPermissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles", orgId] });
    },
  });
};

export const useDeleteRole = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rbacService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles", orgId] });
    },
  });
};

export const useUpdateRoleHierarchy = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleIds: string[]) => rbacService.updateRoleHierarchy({ roleIds, organizationId: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles", orgId] });
    },
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rbacService.assignRoleToUser,
    onSuccess: () => {
      // We don't know the exact orgId here, but we can invalidate general rbac keys 
      // or a specific one if we pass it in. 
      queryClient.invalidateQueries({ queryKey: rbacKeys.all });
    },
  });
};
