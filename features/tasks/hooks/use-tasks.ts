import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

// --- TASKS ---
export function useProjectTasks(projectId: string, filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/tasks`, { params: filters });
      return response.data.data;
    },
    enabled: !!projectId,
  });
}

export function useTaskDetails(taskId: string | null) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const response = await axiosInstance.get(`/tasks/${taskId}`);
      return response.data.data;
    },
    enabled: !!taskId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post(`/projects/${projectId}/tasks`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task created successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create task");
    },
  });
}

export function useUpdateTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.patch(`/tasks/${taskId}`, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Task updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update task");
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await axiosInstance.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task deleted");
    },
  });
}

// --- SPRINTS ---
export function useProjectSprints(projectId: string) {
  return useQuery({
    queryKey: ["sprints", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/sprints`);
      return response.data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post(`/projects/${projectId}/sprints`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
      toast.success("Sprint created");
    },
  });
}

export function useUpdateSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axiosInstance.patch(`/sprints/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Sprint updated");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update sprint");
    },
  });
}

// --- STATUSES ---
export function useProjectStatuses(projectId: string) {
  return useQuery({
    queryKey: ["statuses", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/statuses`);
      return response.data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post(`/projects/${projectId}/statuses`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses", projectId] });
      toast.success("Column status created");
    },
  });
}

export function useUpdateStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await axiosInstance.patch(`/statuses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}

export function useDeleteStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (statusId: string) => {
      await axiosInstance.delete(`/statuses/${statusId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses", projectId] });
      toast.success("Status deleted");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete status");
    },
  });
}

// --- SUBTASKS ---
export function useCreateSubtask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post(`/tasks/${taskId}/subtasks`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}

export function useUpdateSubtask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axiosInstance.patch(`/subtasks/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}

export function useDeleteSubtask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subtaskId: string) => {
      await axiosInstance.delete(`/subtasks/${subtaskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}

// --- COMMENTS ---
export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post(`/tasks/${taskId}/comments`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Comment added");
    },
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await axiosInstance.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Comment deleted");
    },
  });
}

export function useUpdateComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const response = await axiosInstance.patch(`/comments/${commentId}`, { content });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Comment updated");
    },
  });
}

// --- CUSTOM FIELDS ---
export function useProjectCustomFields(projectId: string) {
  return useQuery({
    queryKey: ["custom-fields", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/custom-fields`);
      return response.data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateCustomField(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post(`/projects/${projectId}/custom-fields`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId] });
      toast.success("Custom field added");
    },
  });
}

export function useDeleteCustomField(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fieldId: string) => {
      await axiosInstance.delete(`/custom-fields/${fieldId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId] });
      toast.success("Custom field removed");
    },
  });
}

// --- NOTIFICATIONS ---
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await axiosInstance.get("/notifications");
      return response.data.data;
    },
    refetchInterval: 15000, // Poll notifications every 15 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.patch(`/notifications/${id}/read`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await axiosInstance.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });
}

// --- SLACK WEBHOOKS ---
export function useProjectSlackWebhooks(projectId: string) {
  return useQuery({
    queryKey: ["slack-webhooks", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/slack-webhooks`);
      return response.data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateSlackWebhook(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { url: string; channel?: string | null }) => {
      const response = await axiosInstance.post(`/projects/${projectId}/slack-webhooks`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-webhooks", projectId] });
      toast.success("Slack integration added successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add Slack integration");
    },
  });
}

export function useDeleteSlackWebhook(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (webhookId: string) => {
      await axiosInstance.delete(`/slack-webhooks/${webhookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-webhooks", projectId] });
      toast.success("Slack integration removed");
    },
  });
}

// --- TASK DEPENDENCIES ---
export function useTaskDependencies(taskId: string | null) {
  return useQuery({
    queryKey: ["task-dependencies", taskId],
    queryFn: async () => {
      if (!taskId) return { blockedBy: [], blocking: [] };
      const response = await axiosInstance.get(`/tasks/${taskId}/dependencies`);
      return response.data.data;
    },
    enabled: !!taskId,
  });
}

export function useCreateTaskDependency(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { dependencyTaskId: string; direction: "blocks" | "blocked_by" }) => {
      const response = await axiosInstance.post(`/tasks/${taskId}/dependencies`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Dependency linked successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to link dependency");
    },
  });
}

export function useDeleteTaskDependency(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dependencyId: string) => {
      await axiosInstance.delete(`/dependencies/${dependencyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Dependency unlinked");
    },
  });
}

