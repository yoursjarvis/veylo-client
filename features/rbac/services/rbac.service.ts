import { axiosInstance } from "@/lib/axios";

export interface Permission {
  id: string;
  resource: string;
  action: string;
  module: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  organizationId: string | null;
  isSystemDefault: boolean;
  bypassPermissions?: boolean;
  permissions: {
    roleId: string;
    permissionId: string;
    permission: Permission;
  }[];
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  scopeType: 'ORGANIZATION' | 'PROJECT' | 'DEPARTMENT';
  scopeId: string;
  assignedAt: string;
}

export const rbacService = {
  getPermissions: async (): Promise<Permission[]> => {
    const { data } = await axiosInstance.get("/rbac/permissions");
    return data.data;
  },

  getOrganizationRoles: async (orgId: string): Promise<Role[]> => {
    const { data } = await axiosInstance.get(`/rbac/organizations/${orgId}/roles`);
    return data.data;
  },

  createRole: async (payload: { name: string; organizationId: string; permissionIds: string[]; bypassPermissions?: boolean }): Promise<Role> => {
    const { data } = await axiosInstance.post("/rbac/roles", payload);
    return data.data;
  },

  updateRolePermissions: async (roleId: string, name: string | undefined, permissionIds: string[], bypassPermissions?: boolean): Promise<Role> => {
    const { data } = await axiosInstance.put(`/rbac/roles/${roleId}`, { name, permissionIds, bypassPermissions });
    return data.data;
  },

  deleteRole: async (roleId: string): Promise<void> => {
    await axiosInstance.delete(`/rbac/roles/${roleId}`);
  },

  assignRoleToUser: async (payload: { 
    userId: string; 
    roleIds: string[]; 
    scopeType: 'ORGANIZATION' | 'PROJECT' | 'DEPARTMENT'; 
    scopeId: string; 
  }): Promise<RoleAssignment[]> => {
    const { data } = await axiosInstance.post("/rbac/assignments", payload);
    return data.data;
  },

  removeRoleAssignment: async (assignmentId: string): Promise<void> => {
    await axiosInstance.delete(`/rbac/assignments/${assignmentId}`);
  },

  getUserAssignments: async (userId: string, scopeType?: string, scopeId?: string): Promise<RoleAssignment[]> => {
    const { data } = await axiosInstance.get(`/rbac/assignments`, {
      params: { userId, scopeType, scopeId },
    });
    return data.data;
  },
};
