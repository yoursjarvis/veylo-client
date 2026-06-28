import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rbacService } from "../services/rbac.service";

export const rbacKeys = {
  all: ["rbac"] as const,
  permissions: () => [...rbacKeys.all, "permissions"] as const,
  roles: (orgId: string) => [...rbacKeys.all, "roles", orgId] as const,
  assignments: (orgId: string) => [...rbacKeys.all, "assignments", orgId] as const,
};

export const usePermissions = () => {
  return useQuery({
    queryKey: rbacKeys.permissions(),
    queryFn: rbacService.getPermissions,
  });
};

export const useOrganizationRoles = (orgId: string) => {
  return useQuery({
    queryKey: rbacKeys.roles(orgId),
    queryFn: () => rbacService.getOrganizationRoles(orgId),
    enabled: !!orgId,
  });
};

export const useCreateRole = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rbacService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(orgId) });
    },
  });
};

export const useUpdateRolePermissions = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rbacService.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(orgId) });
    },
  });
};

export const useDeleteRole = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rbacService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(orgId) });
    },
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rbacService.assignRoleToUser,
    onSuccess: (data, variables) => {
      // We don't know the exact orgId here, but we can invalidate general rbac keys 
      // or a specific one if we pass it in. 
      queryClient.invalidateQueries({ queryKey: rbacKeys.all });
    },
  });
};
