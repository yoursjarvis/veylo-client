import { axiosInstance } from "@/lib/axios"
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
} from "@/types/api-types"

export interface Permission {
  id: string
  resource: string
  action: string
  module: string
  description: string
}

export interface RoleUser {
  id: string
  name: string
  avatarUrl?: string
}

export interface Role {
  id: string
  name: string
  organizationId: string | null
  isSystemDefault: boolean
  bypassPermissions?: boolean
  permissions: {
    roleId: string
    permissionId: string
    permission: Permission
  }[]
  users: RoleUser[]
  userCount: number
}

export interface RoleAssignment {
  id: string
  userId: string
  roleId: string
  scopeType: "ORGANIZATION" | "PROJECT" | "DEPARTMENT"
  scopeId: string
  assignedAt: string
}

export interface PaginatedRoles {
  data: Role[]
  nextCursor?: string
  totalCount: number
}

// Mock data generator for roles
const generateMockRoles = (orgId: string): Role[] => {
  return Array.from({ length: 45 }).map((_, i) => {
    const userCount = Math.floor(Math.random() * 20)
    const users: RoleUser[] = Array.from({ length: userCount }).map((_, j) => ({
      id: `user-${i}-${j}`,
      name: `User ${i}-${j}`,
      avatarUrl: `https://i.pravatar.cc/150?u=${i}-${j}`,
    }))

    return {
      id: `role-${i}`,
      name: i === 0 ? "Owner" : i === 1 ? "Admin" : `Custom Role ${i}`,
      organizationId: orgId,
      isSystemDefault: i < 2,
      permissions: [], // Mocked empty for simplicity, can be expanded
      users,
      userCount,
    }
  })
}

let mockRolesCache: Record<string, Role[]> = {}

export const rbacService = {
  getPermissions: async (): Promise<Permission[]> => {
    const { data } = await axiosInstance.get("/rbac/permissions")
    return data.data
  },

  getOrganizationRoles: async (
    orgId: string,
    params?: { search?: string; limit?: number; cursor?: string }
  ): Promise<PaginatedRoles> => {
    const { data: axiosResponse } = await axiosInstance.get(
      `/rbac/organizations/${orgId}/roles`,
      {
        params: { search: params?.search || undefined },
      }
    )
    let rawRoles: Role[] = axiosResponse.data || []

    let roles = rawRoles.map((r: any) => {
      let users: RoleUser[] = []
      let userCount = 0

      if (r.assignments) {
        users = r.assignments.map((a: any) => ({
          id: a.user.id,
          name: a.user.name,
          avatarUrl: a.user.image,
        }))
        userCount = r._count?.assignments ?? users.length
      } else {
        userCount = r.userCount ?? Math.floor(Math.random() * 20)
        users =
          r.users ??
          Array.from({ length: userCount }).map((_, j) => ({
            id: `user-${r.id}-${j}`,
            name: `User ${r.id}-${j}`,
            avatarUrl: `https://i.pravatar.cc/150?u=${r.id}-${j}`,
          }))
      }

      return {
        ...r,
        users,
        userCount,
      }
    })

    if (params?.search) {
      const s = params.search.toLowerCase()
      roles = roles.filter((r) => r.name.toLowerCase().includes(s))
    }

    const limit = params?.limit || 10
    const startIndex = params?.cursor
      ? roles.findIndex((r) => r.id === params.cursor) + 1
      : 0
    const endIndex = startIndex + limit

    const data = roles.slice(startIndex, endIndex)
    const nextCursor =
      endIndex < roles.length ? data[data.length - 1]?.id : undefined

    return {
      data,
      nextCursor,
      totalCount: roles.length,
    }
  },

  createRole: async (payload: CreateRoleRequest): Promise<Role> => {
    const { data } = await axiosInstance.post("/rbac/roles", payload)
    return data.data
  },

  updateRolePermissions: async (
    roleId: string,
    payload: UpdateRoleRequest
  ): Promise<Role> => {
    const { data } = await axiosInstance.put(`/rbac/roles/${roleId}`, payload)
    return data.data
  },

  deleteRole: async (roleId: string): Promise<void> => {
    await axiosInstance.delete(`/rbac/roles/${roleId}`)
  },

  updateRoleHierarchy: async (payload: {
    roleIds: string[]
    organizationId: string
  }): Promise<void> => {
    await axiosInstance.put("/rbac/roles/hierarchy", payload)
  },

  assignRoleToUser: async (
    payload: AssignRoleRequest
  ): Promise<RoleAssignment[]> => {
    const { data } = await axiosInstance.post("/rbac/assignments", payload)
    return data.data
  },

  removeRoleAssignment: async (assignmentId: string): Promise<void> => {
    await axiosInstance.delete(`/rbac/assignments/${assignmentId}`)
  },

  getUserAssignments: async (
    userId: string,
    scopeType?: string,
    scopeId?: string
  ): Promise<RoleAssignment[]> => {
    const { data } = await axiosInstance.get(`/rbac/assignments`, {
      params: { userId, scopeType, scopeId },
    })
    return data.data
  },
}
