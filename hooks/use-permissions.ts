import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { authClient } from "@/lib/auth-client"
import { axiosInstance } from "@/lib/axios"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useEffect } from "react"

interface PermissionContext {
  organizationId?: string
  workspaceId?: string
  projectId?: string
  taskId?: string
}

export function usePermissions(context?: PermissionContext) {
  const { data: session } = authClient.useSession()
  const { activeWorkspace } = useWorkspaceContext()
  const params = useParams()
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleVersionChange = () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] })
    }
    window.addEventListener("permissions-version-changed", handleVersionChange)
    return () => window.removeEventListener("permissions-version-changed", handleVersionChange)
  }, [queryClient])

  // Auto-resolve context if not provided
  const resolvedContext = context || {
    organizationId: session?.session?.activeOrganizationId || undefined,
    workspaceId: activeWorkspace?.id || undefined,
    projectId: (params?.projectId as string) || undefined,
    taskId: (params?.taskId as string) || undefined,
  }

  const queryKey = ["permissions", resolvedContext]

  const getStorageKey = () => {
    let version = "0"
    if (typeof window !== "undefined") {
      version = localStorage.getItem("permissions_version") || "0"
    }
    return `permissions_v${version}_${resolvedContext.organizationId || "none"}_${
      resolvedContext.workspaceId || "none"
    }_${resolvedContext.projectId || "none"}_${resolvedContext.taskId || "none"}`
  }

  const { data: permissions, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (resolvedContext.organizationId)
        searchParams.append("organizationId", resolvedContext.organizationId)
      if (resolvedContext.workspaceId)
        searchParams.append("workspaceId", resolvedContext.workspaceId)
      if (resolvedContext.projectId)
        searchParams.append("projectId", resolvedContext.projectId)
      if (resolvedContext.taskId)
        searchParams.append("taskId", resolvedContext.taskId)

      const res = await axiosInstance.get(
        `/rbac/permissions/me?${searchParams.toString()}`
      )
      const data = res.data.data as string[]
      
      if (typeof window !== "undefined") {
        localStorage.setItem(getStorageKey(), JSON.stringify(data))
      }
      
      return data
    },
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: () => {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(getStorageKey())
        if (cached) {
          try {
            return JSON.parse(cached)
          } catch (e) {
            // ignore parse error
          }
        }
      }
      return undefined
    }
  })

  const hasPermission = (permission: string) => {
    if (!permissions) return false
    if (permissions.includes("*")) return true
    return permissions.includes(permission)
  }

  return {
    permissions: permissions || [],
    hasPermission,
    isLoading,
  }
}
