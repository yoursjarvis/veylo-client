import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { toast } from "sonner"
import type {
  TaskCreateRequest,
  TaskUpdateRequest,
  SprintCreateRequest,
  SprintUpdateRequest,
  StatusRequest,
  StatusUpdateRequest,
  CommentRequest,
  CustomFieldRequest,
  EpicCreateRequest,
  EpicUpdateRequest,
  LabelCreateRequest,
  MilestoneCreateRequest,
  MilestoneUpdateRequest,
} from "@/types/api-types"

// --- TASKS ---
export function useProjectTasks(
  projectId: string,
  filters: Record<string, unknown> = {}
) {
  return useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/tasks`, {
        params: filters,
      })
      return response.data.data
    },
    enabled: !!projectId,
  })
}

export function useProjectTasksInfinite(
  projectId: string,
  filters: Record<string, unknown> = {},
  limit: number = 50
) {
  return useInfiniteQuery({
    queryKey: ["tasks", "infinite", projectId, filters, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosInstance.get(`/projects/${projectId}/tasks`, {
        params: {
          ...filters,
          page: pageParam,
          limit,
        },
      })
      const responseData = response.data
      if (responseData && responseData.data && responseData.meta) {
        return {
          data: responseData.data,
          meta: responseData.meta,
        }
      }
      const data = responseData.data || responseData
      return {
        data: Array.isArray(data) ? data : [],
        meta: {
          page: pageParam as number,
          totalPages:
            Array.isArray(data) && data.length < limit
              ? (pageParam as number)
              : (pageParam as number) + 1,
        },
      }
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.meta.page + 1
      return nextPage <= lastPage.meta.totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    enabled: !!projectId,
  })
}

export function useWorkspaceTasksInfinite(
  workspaceId: string,
  filters: Record<string, unknown> = {},
  limit: number = 50
) {
  return useInfiniteQuery({
    queryKey: ["tasks", "infinite", "workspace", workspaceId, filters, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosInstance.get(
        `/workspaces/${workspaceId}/tasks`,
        {
          params: {
            ...filters,
            page: pageParam,
            limit,
          },
        }
      )
      const responseData = response.data
      if (responseData && responseData.data && responseData.meta) {
        return {
          data: responseData.data,
          meta: responseData.meta,
        }
      }
      const data = responseData.data || responseData
      return {
        data: Array.isArray(data) ? data : [],
        meta: {
          page: pageParam as number,
          totalPages:
            Array.isArray(data) && data.length < limit
              ? (pageParam as number)
              : (pageParam as number) + 1,
        },
      }
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.meta.page + 1
      return nextPage <= lastPage.meta.totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    enabled: !!workspaceId,
  })
}

export async function prefetchNextProjectTasksPage(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  filters: Record<string, unknown> = {},
  nextPage: number,
  limit: number = 50
) {
  await queryClient.prefetchQuery({
    queryKey: ["tasks", "infinite", projectId, filters, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/tasks`, {
        params: {
          ...filters,
          page: nextPage,
          limit,
        },
      })
      const responseData = response.data
      if (responseData && responseData.data && responseData.meta) {
        return {
          data: responseData.data,
          meta: responseData.meta,
        }
      }
      const data = responseData.data || responseData
      return {
        data: Array.isArray(data) ? data : [],
        meta: {
          page: nextPage,
          totalPages:
            Array.isArray(data) && data.length < limit
              ? nextPage
              : nextPage + 1,
        },
      }
    },
  })
}

export function useTaskDetails(taskId: string | null) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null
      const response = await axiosInstance.get(`/tasks/${taskId}`)
      return response.data.data
    },
    enabled: !!taskId,
  })
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: TaskCreateRequest) => {
      const response = await axiosInstance.post(
        `/projects/${projectId}/tasks`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      toast.success("Task created successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to create task")
    },
  })
}

export function useUpdateTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: TaskUpdateRequest) => {
      const response = await axiosInstance.patch(`/tasks/${taskId}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Task updated")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to update task")
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}

export function useUpdateTaskOrder(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string
      data: { statusId?: string; position?: number }
    }) => {
      const response = await axiosInstance.patch(`/tasks/${taskId}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err.response?.data?.message || "Failed to update task position"
      )
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      await axiosInstance.delete(`/tasks/${taskId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      toast.success("Task deleted")
    },
  })
}

export function useUploadTaskAttachment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (percent: number) => void
    }) => {
      const formData = new FormData()
      formData.append("file", file)
      const response = await axiosInstance.post(
        `/tasks/${taskId}/attachments`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              onProgress(percent)
            }
          },
        }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Attachment uploaded successfully")
    },
    onError: () => {
      toast.error("Failed to upload attachment")
    },
  })
}

export function useDeleteTaskAttachment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await axiosInstance.delete(`/tasks/${taskId}/attachments/${attachmentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Attachment deleted")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete attachment")
    },
  })
}

// --- SPRINTS ---
export function useProjectSprints(projectId: string) {
  return useQuery({
    queryKey: ["sprints", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/sprints`)
      return response.data.data
    },
    enabled: !!projectId,
  })
}

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SprintCreateRequest) => {
      const response = await axiosInstance.post(
        `/projects/${projectId}/sprints`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] })
      toast.success("Sprint created")
    },
  })
}

export function useUpdateSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: SprintUpdateRequest
    }) => {
      const response = await axiosInstance.patch(`/sprints/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      toast.success("Sprint updated")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to update sprint")
    },
  })
}

// --- STATUSES ---
export function useProjectStatuses(projectId: string) {
  return useQuery({
    queryKey: ["statuses", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/projects/${projectId}/statuses`
      )
      return response.data.data
    },
    enabled: !!projectId,
  })
}

export function useCreateStatus(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: StatusRequest) => {
      const response = await axiosInstance.post(
        `/projects/${projectId}/statuses`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses", projectId] })
      toast.success("Column status created")
    },
  })
}

export function useUpdateStatus(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: StatusUpdateRequest
    }) => {
      await axiosInstance.patch(`/statuses/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}

export function useDeleteStatus(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (statusId: string) => {
      await axiosInstance.delete(`/statuses/${statusId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses", projectId] })
      toast.success("Status deleted")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete status")
    },
  })
}

// --- SUBTASKS ---
export function useCreateSubtask(projectId: string, taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<TaskCreateRequest>) => {
      const payload = { ...data, parentTaskId: taskId }
      const response = await axiosInstance.post(
        `/projects/${projectId}/tasks`,
        payload
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Subtask added")
    },
  })
}

export function useUpdateSubtask(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: TaskUpdateRequest
    }) => {
      const response = await axiosInstance.patch(`/tasks/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
    },
  })
}

export function useDeleteSubtask(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (subtaskId: string) => {
      await axiosInstance.delete(`/tasks/${subtaskId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Subtask deleted")
    },
  })
}

// --- COMMENTS ---
export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CommentRequest) => {
      const response = await axiosInstance.post(
        `/tasks/${taskId}/comments`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Comment added")
    },
  })
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: string) => {
      await axiosInstance.delete(`/comments/${commentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Comment deleted")
    },
  })
}

export function useUpdateComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: {
      commentId: string
      content: string
    }) => {
      const response = await axiosInstance.patch(`/comments/${commentId}`, {
        content,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Comment updated")
    },
  })
}

export function useToggleCommentReaction(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      commentId,
      emoji,
    }: {
      commentId: string
      emoji: string
    }) => {
      const response = await axiosInstance.post(
        `/comments/${commentId}/reactions`,
        { emoji }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      queryClient.invalidateQueries({ queryKey: ["reaction-users"] })
    },
  })
}

export function useReactionUsers(
  commentId: string,
  emoji: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["reaction-users", commentId, emoji],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/comments/${commentId}/reactions/${encodeURIComponent(emoji)}/users`
      )
      return response.data.data
    },
    enabled: enabled && !!commentId && !!emoji,
  })
}

// --- CUSTOM FIELDS ---
export function useProjectCustomFields(projectId: string) {
  return useQuery({
    queryKey: ["custom-fields", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/projects/${projectId}/custom-fields`
      )
      return response.data.data
    },
    enabled: !!projectId,
  })
}

export function useCreateCustomField(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CustomFieldRequest) => {
      const response = await axiosInstance.post(
        `/projects/${projectId}/custom-fields`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId] })
      toast.success("Custom field added")
    },
  })
}

export function useDeleteCustomField(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (fieldId: string) => {
      await axiosInstance.delete(`/custom-fields/${fieldId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId] })
      toast.success("Custom field removed")
    },
  })
}

// --- NOTIFICATIONS ---
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await axiosInstance.get("/notifications")
      return response.data.data
    },
    refetchInterval: 15000, // Poll notifications every 15 seconds
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/notifications/${id}/read`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await axiosInstance.patch("/notifications/read-all")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("All notifications marked as read")
    },
  })
}

// --- SLACK WEBHOOKS ---
export function useProjectSlackWebhooks(projectId: string) {
  return useQuery({
    queryKey: ["slack-webhooks", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/projects/${projectId}/slack-webhooks`
      )
      return response.data.data
    },
    enabled: !!projectId,
  })
}

export function useCreateSlackWebhook(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { url: string; channel?: string | null }) => {
      const response = await axiosInstance.post(
        `/projects/${projectId}/slack-webhooks`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-webhooks", projectId] })
      toast.success("Slack integration added successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err.response?.data?.message || "Failed to add Slack integration"
      )
    },
  })
}

export function useDeleteSlackWebhook(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (webhookId: string) => {
      await axiosInstance.delete(`/slack-webhooks/${webhookId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-webhooks", projectId] })
      toast.success("Slack integration removed")
    },
  })
}

// --- TASK DEPENDENCIES ---
export function useTaskDependencies(taskId: string | null) {
  return useQuery({
    queryKey: ["task-dependencies", taskId],
    queryFn: async () => {
      if (!taskId) return { blockedBy: [], blocking: [] }
      const response = await axiosInstance.get(`/tasks/${taskId}/dependencies`)
      return response.data.data
    },
    enabled: !!taskId,
  })
}

export function useCreateTaskDependency(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      dependencyTaskId: string
      direction: "blocks" | "blocked_by"
    }) => {
      const response = await axiosInstance.post(
        `/tasks/${taskId}/dependencies`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] })
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Dependency linked successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to link dependency")
    },
  })
}

export function useDeleteTaskDependency(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dependencyId: string) => {
      await axiosInstance.delete(`/dependencies/${dependencyId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] })
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Dependency unlinked")
    },
  })
}

// --- EPICS ---
export function useProjectEpics(projectId: string) {
  return useQuery({
    queryKey: ["epics", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/epics`)
      return response.data.data
    },
    enabled: !!projectId,
  })
}

export function useEpicDetails(epicId: string | null) {
  return useQuery({
    queryKey: ["epic", epicId],
    queryFn: async () => {
      if (!epicId) return null
      const response = await axiosInstance.get(`/epics/${epicId}`)
      return response.data.data
    },
    enabled: !!epicId,
  })
}

export function useCreateEpic(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: EpicCreateRequest) => {
      const response = await axiosInstance.post(
        `/projects/${projectId}/epics`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId] })
      toast.success("Epic created successfully")
    },
  })
}

export function useUpdateEpic(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: EpicUpdateRequest
    }) => {
      const response = await axiosInstance.patch(`/epics/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId] })
      queryClient.invalidateQueries({ queryKey: ["epic", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      toast.success("Epic updated")
    },
  })
}

export function useDeleteEpic(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (epicId: string) => {
      await axiosInstance.delete(`/epics/${epicId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      toast.success("Epic deleted")
    },
  })
}

// --- LABELS ---
export function useProjectLabels(projectId: string) {
  return useQuery({
    queryKey: ["labels", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/labels`)
      return response.data.data
    },
    enabled: !!projectId,
  })
}

export function useCreateLabel(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: LabelCreateRequest) => {
      const response = await axiosInstance.post(
        `/projects/${projectId}/labels`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels", projectId] })
      toast.success("Label created")
    },
  })
}

export function useUpdateLabel(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<LabelCreateRequest>
    }) => {
      const response = await axiosInstance.patch(`/labels/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      toast.success("Label updated")
    },
  })
}

export function useDeleteLabel(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (labelId: string) => {
      await axiosInstance.delete(`/labels/${labelId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      toast.success("Label deleted")
    },
  })
}

// --- MILESTONES ---
export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: ["milestones", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/projects/${projectId}/milestones`
      )
      return response.data.data
    },
    enabled: !!projectId,
  })
}

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: MilestoneCreateRequest) => {
      const response = await axiosInstance.post(
        `/projects/${projectId}/milestones`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", projectId] })
      toast.success("Milestone created")
    },
  })
}

export function useUpdateMilestone(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: MilestoneUpdateRequest
    }) => {
      const response = await axiosInstance.patch(`/milestones/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      toast.success("Milestone updated")
    },
  })
}

export function useDeleteMilestone(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (milestoneId: string) => {
      await axiosInstance.delete(`/milestones/${milestoneId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      toast.success("Milestone deleted")
    },
  })
}

// --- WORK LOGS ---
export function useTaskWorkLogs(taskId: string | null) {
  return useQuery({
    queryKey: ["work-logs", taskId],
    queryFn: async () => {
      if (!taskId) return []
      const response = await axiosInstance.get(`/tasks/${taskId}/work-logs`)
      return response.data.data
    },
    enabled: !!taskId,
  })
}

export function useCreateWorkLog(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      hoursLogged: number
      loggedAt?: string
      description?: string | null
    }) => {
      const response = await axiosInstance.post(
        `/tasks/${taskId}/work-logs`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-logs", taskId] })
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Work log saved successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to log work")
    },
  })
}

export function useDeleteWorkLog(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (workLogId: string) => {
      await axiosInstance.delete(`/work-logs/${workLogId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-logs", taskId] })
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Work log entry deleted")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete work log")
    },
  })
}

// --- CHECKLIST TEMPLATES ---
export function useProjectChecklistTemplates(workspaceId: string | null) {
  return useQuery({
    queryKey: ["checklist-templates", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const response = await axiosInstance.get(
        `/checklist-templates?workspaceId=${workspaceId}`
      )
      return response.data.data
    },
    enabled: !!workspaceId,
  })
}

export function useApplyChecklistTemplate(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await axiosInstance.post(
        `/tasks/${taskId}/apply-checklist`,
        { templateId }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("Checklist template applied successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err.response?.data?.message || "Failed to apply checklist template"
      )
    },
  })
}

// --- MEDIA ANNOTATIONS & VERSIONING ---
export function useMediaAnnotations(mediaId: string | null) {
  return useQuery({
    queryKey: ["annotations", mediaId],
    queryFn: async () => {
      if (!mediaId) return []
      const response = await axiosInstance.get(`/media/${mediaId}/annotations`)
      return response.data.data
    },
    enabled: !!mediaId,
  })
}

export function useCreateAnnotation(mediaId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { x: number; y: number; content: string }) => {
      const response = await axiosInstance.post(
        `/media/${mediaId}/annotations`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations", mediaId] })
      toast.success("Annotation added successfully")
    },
  })
}

export function useDeleteAnnotation(mediaId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/annotations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations", mediaId] })
      toast.success("Annotation removed")
    },
  })
}

export function useUploadNewVersion(parentMediaId: string, taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const response = await axiosInstance.post(
        `/media/${parentMediaId}/version`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      toast.success("New file version uploaded successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to upload new version")
    },
  })
}
