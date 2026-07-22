"use client"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
// Status, StatusIndicator, StatusLabel are removed
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { axiosInstance } from "@/lib/axios"
import { cn, getThumbUrl } from "@/lib/utils"
import { Project, Task, TaskStatus } from "@/types/models"
import {
  CheckmarkSquare02Icon,
  Tick01Icon,
  WorkAlertIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
// format removed
import { AuthResponse } from "@/features/auth/types"
import { useMemo, useState } from "react"
// imports removed
import { TaskDetailsDrawer } from "@/features/tasks/components/task-details-drawer"
import {
  DatePicker,
  PrioritySelect,
  StatusSelect,
} from "@/features/tasks/components/task-list"

import { IconStack } from "@/components/reui/icon-stack"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { UseMutationResult } from "@tanstack/react-query"

// Reusable Task Row with inline edits
function MyTaskRow({
  task,
  projectStatuses,
  updateTaskMutation,
  onRowClick,
  auth,
}: {
  task: Task & { projectName: string }
  projectStatuses: TaskStatus[]
  updateTaskMutation: UseMutationResult<
    unknown,
    Error,
    { taskId: string; data: Partial<Task> },
    unknown
  >
  onRowClick: (taskId: string, projectId: string) => void
  auth: AuthResponse | undefined
}) {
  const completedStatus =
    projectStatuses.find(
      (st) =>
        st.progressWeight === 100 ||
        st.name.toLowerCase() === "done" ||
        st.name.toLowerCase() === "completed" ||
        st.name.toLowerCase() === "complete"
    ) || projectStatuses[projectStatuses.length - 1]

  const isCompleted = task.statusId === completedStatus?.id

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!completedStatus) return
    if (isCompleted) {
      const first = projectStatuses[0]
      if (first)
        updateTaskMutation.mutate({
          taskId: task.id,
          data: { statusId: first.id },
        })
    } else {
      updateTaskMutation.mutate({
        taskId: task.id,
        data: { statusId: completedStatus.id },
      })
    }
  }

  return (
    <Card
      onClick={() => onRowClick(task.id, task.projectId)}
      className="group flex cursor-pointer flex-col items-start justify-between gap-4 border-border/50 p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={handleToggle}
          className={cn(
            "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors hover:border-success hover:bg-success/10",
            isCompleted
              ? "border-success bg-success text-success-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <HugeiconsIcon
            icon={Tick01Icon}
            className="h-4 w-4"
            strokeWidth={2}
          />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h4
            className={cn(
              "truncate font-medium text-foreground",
              isCompleted && "line-through opacity-70"
            )}
          >
            {task.title}
          </h4>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="max-w-[120px] truncate font-medium text-primary/80">
              {task.projectName}
            </span>
            <span>•</span>
            <div className="w-[140px]" onClick={(e) => e.stopPropagation()}>
              <StatusSelect
                value={task.statusId}
                onChange={(val) =>
                  updateTaskMutation.mutate({
                    taskId: task.id,
                    data: { statusId: val },
                  })
                }
                statuses={projectStatuses}
              />
            </div>
            <span>•</span>
            <div className="w-[120px]" onClick={(e) => e.stopPropagation()}>
              <PrioritySelect
                value={task.priority}
                onChange={(val) =>
                  updateTaskMutation.mutate({
                    taskId: task.id,
                    data: {
                      priority: val as
                        | "lowest"
                        | "low"
                        | "medium"
                        | "high"
                        | "highest"
                        | "urgent",
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center gap-6 pl-10 sm:w-auto sm:pl-0">
        <div
          className="flex w-[140px] flex-col text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <DatePicker
            value={task.dueDate || null}
            onChange={(val) =>
              updateTaskMutation.mutate({
                taskId: task.id,
                data: { dueDate: val ? new Date(val).toISOString() : null },
              })
            }
          />
        </div>

        <Avatar className="h-8 w-8 border">
          {auth?.user?.image ? (
            <AvatarImage
              src={getThumbUrl(auth.user.image) || undefined}
              alt={auth.user.name || "User"}
            />
          ) : null}
          <AvatarFallback className="text-xs">
            {(auth?.user?.name || "U").substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </Card>
  )
}

// Global Wrapper for the Drawer to fetch necessary props
function MyTasksTaskDrawer({
  taskId,
  projectId,
  onClose,
}: {
  taskId: string
  projectId: string
  onClose: () => void
}) {
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () =>
      (await axiosInstance.get(`/projects/${projectId}`)).data.data,
  })
  const { data: projectStatuses } = useQuery({
    queryKey: ["project-statuses", projectId],
    queryFn: async () =>
      (await axiosInstance.get(`/projects/${projectId}/statuses`)).data.data,
  })
  const { data: projectSprints } = useQuery({
    queryKey: ["project-sprints", projectId],
    queryFn: async () =>
      (await axiosInstance.get(`/projects/${projectId}/sprints`)).data.data,
  })
  const { data: projectEpics } = useQuery({
    queryKey: ["project-epics", projectId],
    queryFn: async () =>
      (await axiosInstance.get(`/projects/${projectId}/epics`)).data.data,
  })
  const { data: projectMilestones } = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: async () =>
      (await axiosInstance.get(`/projects/${projectId}/milestones`)).data.data,
  })
  const { data: projectLabels } = useQuery({
    queryKey: ["project-labels", projectId],
    queryFn: async () =>
      (await axiosInstance.get(`/projects/${projectId}/labels`)).data.data,
  })

  if (!project || !projectStatuses) return null
  const safeProjectStatuses = Array.isArray(projectStatuses)
    ? projectStatuses
    : (projectStatuses as { statuses?: TaskStatus[] }).statuses || []

  return (
    <TaskDetailsDrawer
      taskId={taskId}
      projectId={projectId}
      projectMembers={project.members || []}
      projectStatuses={safeProjectStatuses}
      projectSprints={projectSprints || []}
      projectEpics={projectEpics || []}
      projectMilestones={projectMilestones || []}
      projectLabels={projectLabels || []}
      projectTemplate={project.template || "simple"}
      onClose={onClose}
    />
  )
}

export default function MyTasksPage() {
  const { activeWorkspace } = useWorkspaceContext()
  const { data: auth } = useCurrentUser()
  const userId = auth?.user?.id
  const queryClient = useQueryClient()

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  // 1. Fetch projects
  const workspaceId = activeWorkspace?.id
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const response = await axiosInstance.get(
        `/workspaces/${workspaceId}/projects`
      )
      return response.data.data as Project[]
    },
    enabled: !!workspaceId,
  })

  // 2. Fetch tasks for all projects in parallel
  const taskQueries = useQueries({
    queries: (projects || []).map((p: Project) => ({
      queryKey: ["tasks", p.id],
      queryFn: async () => {
        const response = await axiosInstance.get(`/projects/${p.id}/tasks`)
        return {
          projectId: p.id,
          projectName: p.title,
          tasks: response.data.data as Task[],
        }
      },
    })),
  })

  // 3. Fetch statuses for all projects in parallel
  const statusQueries = useQueries({
    queries: (projects || []).map((p: Project) => ({
      queryKey: ["project-statuses-list", p.id],
      queryFn: async () => {
        const response = await axiosInstance.get(`/projects/${p.id}/statuses`)
        return {
          projectId: p.id,
          statuses: response.data.data as TaskStatus[],
        }
      },
    })),
  })

  const isTasksLoading =
    taskQueries.some((q) => q.isLoading) ||
    statusQueries.some((q) => q.isLoading)

  // Global update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string
      data: Partial<Task>
    }) => {
      return axiosInstance.patch(`/tasks/${taskId}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  // 4. Filter to only tasks assigned to the current user
  const myTasks = useMemo(() => {
    if (!userId) return []
    const allAssignedTasks: (Task & { projectName: string })[] = []

    taskQueries.forEach((query) => {
      if (query.data?.tasks) {
        const assigned = query.data.tasks.filter(
          (t: Task) => t.assigneeId === userId
        )
        assigned.forEach((t: Task) => {
          allAssignedTasks.push({ ...t, projectName: query.data.projectName })
        })
      }
    })

    // Sort by due date (closest first), then by creation date
    return allAssignedTasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [taskQueries, userId])

  const handleRowClick = (taskId: string, projectId: string) => {
    setActiveTaskId(taskId)
    setActiveProjectId(projectId)
  }

  if (isProjectsLoading || isTasksLoading) {
    return (
      <div className="flex w-full flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="rounded-md border border-border">
          <div className="flex gap-4 border-b border-border p-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 border-b border-border p-4 last:border-0"
            >
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col space-y-6 overflow-y-auto p-6 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <HugeiconsIcon
            icon={CheckmarkSquare02Icon}
            className="text-primary"
            strokeWidth={2}
          />
          My Tasks
        </h1>
        <p className="mt-1 text-muted-foreground">
          Showing all tasks assigned to you across {activeWorkspace?.name}.
        </p>
      </div>

      {myTasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center shadow-none">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <IconStack
                  aria-hidden="true"
                  className="h-24 w-22 text-primary"
                >
                  <HugeiconsIcon
                    icon={WorkAlertIcon}
                    className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                  />
                </IconStack>
              </EmptyMedia>
              <EmptyTitle>You&apos;re all caught up!</EmptyTitle>
              <EmptyDescription>
                You don&apos;t have any tasks assigned to you right now. Enjoy
                your free time or check out the project boards to pick up new
                work.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2"></EmptyContent>
          </Empty>
        </Card>
      ) : (
        <div className="grid gap-4">
          {myTasks.map((task) => {
            const projectStatuses =
              statusQueries.find((q) => q.data?.projectId === task.projectId)
                ?.data?.statuses || []

            return (
              <MyTaskRow
                key={task.id}
                task={task}
                projectStatuses={projectStatuses}
                updateTaskMutation={updateTaskMutation}
                onRowClick={handleRowClick}
                auth={auth}
              />
            )
          })}
        </div>
      )}

      {activeTaskId && activeProjectId && (
        <MyTasksTaskDrawer
          taskId={activeTaskId}
          projectId={activeProjectId}
          onClose={() => {
            setActiveTaskId(null)
            setActiveProjectId(null)
          }}
        />
      )}
    </div>
  )
}
