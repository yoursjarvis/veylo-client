"use client"

import React, { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import {
  useTaskDetails,
  useProjectCustomFields,
  useProjectStatuses,
  useProjectSprints,
  useProjectEpics,
  useProjectMilestones,
  useProjectLabels,
} from "@/features/tasks/hooks/use-tasks"
import { axiosInstance } from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeftIcon,
  CircleCheckIcon,
  CopyIcon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { Project, ProjectMember, TaskStatus, User } from "@/types/models"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskDetailsHeader } from "@/features/tasks/components/task-details/task-details-header"
import { TaskDetailsMainContent } from "@/features/tasks/components/task-details/task-details-main-content"
import { TaskDetailsSidebar } from "@/features/tasks/components/task-details/task-details-sidebar"
import { useTaskDetailsManager } from "@/features/tasks/hooks/use-task-details-manager"

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceSlug = params.workspaceSlug as string
  const taskId = params.taskId as string

  const { data: currentUser } = useCurrentUser()
  const { data: task, isLoading: isTaskLoading } = useTaskDetails(taskId)
  const projectId = task?.projectId

  const { data: selectedProject } = useQuery<
    Project & { members?: ProjectMember[]; template?: string }
  >({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}`)
      return response.data.data
    },
    enabled: !!projectId,
  })

  const { data: customFieldDefinitions } = useProjectCustomFields(
    projectId || ""
  )
  const { data: projectStatuses = [] } = useProjectStatuses(projectId || "")
  const { data: projectSprints = [] } = useProjectSprints(projectId || "")
  const { data: projectEpics = [] } = useProjectEpics(projectId || "")
  const { data: projectMilestones = [] } = useProjectMilestones(projectId || "")
  const { data: projectLabels = [] } = useProjectLabels(projectId || "")

  const projectMembers = selectedProject?.members || []
  const projectTemplate = selectedProject?.template || "simple"

  const manager = useTaskDetailsManager({ taskId, projectId: projectId || "" })

  const completedStatus =
    projectStatuses.find(
      (st: TaskStatus) =>
        st.progressWeight === 100 ||
        st.name.toLowerCase() === "done" ||
        st.name.toLowerCase() === "completed" ||
        st.name.toLowerCase() === "complete"
    ) || projectStatuses[projectStatuses.length - 1]

  const isCompleted = task?.statusId === completedStatus?.id

  const { setLocalTitle, setLocalDesc } = manager.state

  useEffect(() => {
    if (task) {
      setLocalTitle(task.title || "")
      setLocalDesc(task.description || "")
    }
  }, [task, setLocalTitle, setLocalDesc])

  const handleToggleCompletion = () => {
    if (!completedStatus) return
    if (isCompleted) {
      const firstStatus = projectStatuses[0]
      if (firstStatus) {
        manager.handlers.handleFieldChange("statusId", firstStatus.id)
      }
    } else {
      manager.handlers.handleFieldChange("statusId", completedStatus.id)
    }
  }

  const canDeleteAttachment = () => {
    if (!currentUser?.user || !task) return false
    if (task.creatorId === String(currentUser.user.id)) return true
    const member = projectMembers.find(
      (m) => m.user?.id === currentUser.user?.id
    )
    const role = member?.role
    const adminRoles = [
      "org_owner",
      "org_admin",
      "workspace_admin",
      "project_admin",
    ]
    if (role && adminRoles.includes(role)) return true
    return false
  }

  const copyTaskUrl = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    toast.success("Task link copied to clipboard")
  }

  if (isTaskLoading) {
    return (
      <div className="flex min-h-[500px] flex-1 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></span>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center space-y-4 bg-background text-foreground">
        <HugeiconsIcon
          icon={MoreHorizontalIcon}
          className="h-12 w-12 text-destructive"
        />
        <h3 className="text-lg font-bold">Task not found</h3>
        <p className="text-sm text-muted-foreground">
          The task you are looking for does not exist or has been deleted.
        </p>
        <Button onClick={() => router.push(`/${workspaceSlug}/dashboard`)}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex-1 bg-background text-foreground">
      <div className="border-b border-border bg-card/40 px-6 py-3.5 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                router.push(`/${workspaceSlug}/projects/${projectId}`)
              }
              title="Back to project"
            >
              <HugeiconsIcon icon={ArrowLeftIcon} size={16} />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>Projects</span>
                <span>/</span>
                <span className="max-w-[150px] truncate">
                  {selectedProject?.title || "Project"}
                </span>
                <span>/</span>
                <span>Task Details</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isCompleted ? "secondary" : "outline"}
              size="sm"
              className="flex h-8 items-center gap-1.5 text-xs font-medium"
              onClick={handleToggleCompletion}
            >
              <HugeiconsIcon
                icon={CircleCheckIcon}
                size={13}
                className={cn(isCompleted && "fill-success/10 text-success")}
              />
              {isCompleted ? "Completed" : "Mark Complete"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                nativeButton={false}
                render={(props) => (
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={copyTaskUrl} className="text-xs">
                  <HugeiconsIcon
                    icon={CopyIcon}
                    className="mr-2 h-3.5 w-3.5 text-muted-foreground"
                  />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/${workspaceSlug}/projects/${projectId}`)
                  }
                  className="text-xs"
                >
                  <HugeiconsIcon
                    icon={ArrowLeftIcon}
                    className="mr-2 h-3.5 w-3.5 text-muted-foreground"
                  />
                  Back to Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-8">
            <TaskDetailsHeader
              task={task}
              isCompleted={isCompleted}
              onTitleChange={manager.state.setLocalTitle}
              onTitleBlur={() =>
                manager.handlers.handleTitleBlur(task.title || "")
              }
              workspaceSlug={workspaceSlug}
              onToggleCompletion={handleToggleCompletion}
            />

            <TaskDetailsMainContent
              task={task}
              projectMembers={projectMembers}
              completedStatus={completedStatus}
              projectStatuses={projectStatuses}
              onUpdateSubtask={(id, data) =>
                manager.mutations.updateSubtaskMutation.mutate({
                  id,
                  data: data as import("@/types/api-types").TaskUpdateRequest,
                })
              }
              onDeleteSubtask={(id) =>
                manager.mutations.deleteSubtaskMutation.mutate(id)
              }
              onNavigateToSubtask={(id) =>
                router.push(`/${workspaceSlug}/tasks/${id}`)
              }
              onAddSubtask={(title) =>
                manager.mutations.createSubtaskMutation.mutate({
                  title,
                  statusId: projectStatuses[0]?.id || "",
                  type: "subtask",
                  priority: "medium",
                })
              }
              onUploadAttachment={
                manager.mutations.uploadAttachmentMutation.mutateAsync
              }
              onDeleteAttachment={
                manager.mutations.deleteAttachmentMutation.mutate
              }
              canDeleteAttachment={canDeleteAttachment}
              isUploadingAttachment={
                manager.mutations.uploadAttachmentMutation.isPending
              }
              descriptionValue={manager.state.localDesc}
              setDescriptionValue={manager.state.setLocalDesc}
              onDescriptionBlur={() =>
                manager.handlers.handleDescBlur(task.description || "")
              }
              commentValue={manager.state.newComment}
              setCommentValue={manager.state.setNewComment}
              handleAddComment={manager.handlers.handleAddComment}
              currentUser={currentUser as unknown as { user?: User | null }}
              replyingToCommentId={manager.state.replyingToCommentId}
              setReplyingToCommentId={manager.state.setReplyingToCommentId}
              replyContent={manager.state.replyContent}
              setReplyContent={manager.state.setReplyContent}
              handleAddReply={manager.handlers.handleAddReply}
              editingCommentId={manager.state.editingCommentId}
              setEditingCommentId={manager.state.setEditingCommentId}
              editingContent={manager.state.editingContent}
              setEditingContent={manager.state.setEditingContent}
              handleUpdateComment={manager.handlers.handleUpdateComment}
              toggleReactionMutation={manager.mutations.toggleReactionMutation}
              deleteCommentMutation={manager.mutations.deleteCommentMutation}
              onCreateDependency={
                manager.mutations.createDependencyMutation.mutate
              }
              onDeleteDependency={
                manager.mutations.deleteDependencyMutation.mutate
              }
            />
          </div>

          <div className="space-y-6 lg:w-[280px] lg:flex-shrink-0">
            <TaskDetailsSidebar
              task={task}
              projectStatuses={projectStatuses}
              projectSprints={projectSprints}
              projectEpics={projectEpics}
              projectMilestones={projectMilestones}
              projectLabels={projectLabels}
              projectMembers={projectMembers}
              customFieldDefinitions={customFieldDefinitions}
              projectTemplate={projectTemplate}
              onFieldChange={manager.handlers.handleFieldChange}
              onCustomFieldChange={manager.handlers.handleCustomFieldChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
