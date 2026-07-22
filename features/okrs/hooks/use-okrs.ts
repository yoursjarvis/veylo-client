import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { toast } from "sonner"

export type KeyResult = {
  id: string
  title: string
  progress: number
  target: string
}

export type LinkedProjectItem = {
  title: string
  type: "project" | "epic"
  icon?: string | null
}

export type Objective = {
  id: string
  title: string
  description: string
  progress: number
  keyResults: KeyResult[]
  linkedProjects: LinkedProjectItem[]
  projectId: string
  epicId?: string | null
  deletedAt?: string | null
}

type DbKeyResult = {
  id: string
  title: string
  progress: number
  target: string
}

type DbObjective = {
  id: string
  title: string
  description?: string | null
  progress: number
  projectId: string
  epicId?: string | null
  deletedAt?: string | null
  keyResults?: DbKeyResult[]
  project?: {
    title: string
    icon?: string | null
  } | null
  epic?: {
    title: string
  } | null
}

export function useWorkspaceObjectives(
  workspaceId: string,
  withTrashed = false
) {
  return useQuery<Objective[]>({
    queryKey: ["objectives", workspaceId, withTrashed],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/workspaces/${workspaceId}/objectives`,
        {
          params: { withTrashed },
        }
      )
      const dbObjectives = (response.data.data || []) as DbObjective[]
      return dbObjectives.map((obj) => {
        const linked: LinkedProjectItem[] = []
        if (obj.project) {
          linked.push({
            title: obj.project.title,
            type: "project",
            icon: obj.project.icon,
          })
        }
        if (obj.epic) {
          linked.push({
            title: obj.epic.title,
            type: "epic",
          })
        }
        return {
          id: obj.id,
          title: obj.title,
          description: obj.description || "",
          progress: obj.progress || 0,
          projectId: obj.projectId,
          epicId: obj.epicId,
          deletedAt: obj.deletedAt,
          keyResults: (obj.keyResults || []).map((kr) => ({
            id: kr.id,
            title: kr.title,
            progress: kr.progress || 0,
            target: kr.target,
          })),
          linkedProjects: linked,
        }
      })
    },
    enabled: !!workspaceId,
  })
}

export function useCreateObjective(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      title: string
      description?: string
      krTitle: string
      krTarget: string
      projectId: string
      epicId?: string | null
    }) => {
      const response = await axiosInstance.post("/objectives", data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives", workspaceId] })
      toast.success("Objective created successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to create objective")
    },
  })
}

export function useUpdateObjective(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: {
        title?: string
        description?: string
        krTitle?: string
        krTarget?: string
        projectId?: string
        epicId?: string | null
      }
    }) => {
      const response = await axiosInstance.put(`/objectives/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives", workspaceId] })
      toast.success("Objective updated successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to update objective")
    },
  })
}

export function useDeleteObjective(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/objectives/${id}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives", workspaceId] })
      toast.success("Objective deleted successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete objective")
    },
  })
}

export function useRestoreObjective(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.post(`/objectives/${id}/restore`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives", workspaceId] })
      toast.success("Objective restored successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to restore objective")
    },
  })
}

export function useForceDeleteObjective(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/objectives/${id}/force`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives", workspaceId] })
      toast.success("Objective permanently deleted")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err.response?.data?.message || "Failed to permanently delete objective"
      )
    },
  })
}
