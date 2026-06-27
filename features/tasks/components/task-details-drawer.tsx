"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { useTaskDetails, useProjectCustomFields } from "../hooks/use-tasks"
import { TaskDetailsHeader } from "./task-details/task-details-header"
import { TaskDetailsMainContent } from "./task-details/task-details-main-content"
import { TaskDetailsSidebar } from "./task-details/task-details-sidebar"
import { useTaskDetailsManager } from "../hooks/use-task-details-manager"
import { ProjectMember, TaskStatus, Sprint, Epic, Milestone, Label, User } from "@/types/models"

interface TaskDetailsDrawerProps {
  taskId: string | null
  projectId: string
  projectMembers: ProjectMember[]
  projectStatuses: TaskStatus[]
  projectSprints: Sprint[]
  projectTemplate: string
  projectEpics?: Epic[]
  projectMilestones?: Milestone[]
  projectLabels?: Label[]
  onClose: () => void
}

export function TaskDetailsDrawer({
  taskId,
  projectId,
  projectMembers,
  projectStatuses,
  projectSprints,
  projectTemplate,
  projectEpics = [],
  projectMilestones = [],
  projectLabels = [],
  onClose,
}: TaskDetailsDrawerProps) {
  const { data: task, isLoading } = useTaskDetails(taskId)
  const { data: customFieldDefinitions } = useProjectCustomFields(projectId)
  const { activeWorkspace } = useWorkspaceContext()
  const { data: currentUser } = useCurrentUser()
  const router = useRouter()
  const pathname = usePathname()

  const manager = useTaskDetailsManager({ taskId: taskId || "", projectId })

  const completedStatus =
    projectStatuses.find(
      (st) =>
        st.name.toLowerCase() === "done" ||
        st.name.toLowerCase() === "completed" ||
        st.name.toLowerCase() === "complete"
    ) || projectStatuses[projectStatuses.length - 1]

  const isCompleted = task?.statusId === completedStatus?.id

  useEffect(() => {
    if (task) {
      manager.state.setLocalTitle(task.title || "")
      manager.state.setLocalDesc(task.description || "")
    }
  }, [task, manager.state])

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
    const member = projectMembers.find(m => m.user?.id === currentUser.user?.id)
    const role = member?.role
    const adminRoles = ["org_owner", "org_admin", "workspace_admin", "project_admin"]
    if (role && adminRoles.includes(role)) return true
    return false
  }

  if (!taskId) return null

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex h-full w-full flex-col border-l border-border bg-card p-0 text-foreground data-[side=right]:sm:max-w-[90vw] data-[side=right]:md:max-w-[80vw] data-[side=right]:lg:max-w-[70vw] data-[side=right]:xl:max-w-[60vw]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
          <div>
            <SheetTitle className="text-sm font-semibold text-muted-foreground">
              Task Details
            </SheetTitle>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></span>
          </div>
        ) : (
          <div className="flex flex-1 flex-row overflow-hidden">
            <ScrollArea className="h-full flex-1 border-r border-border p-6">
              <div className="space-y-8">
                <TaskDetailsHeader
                  task={task!}
                  isCompleted={isCompleted}
                  onTitleChange={manager.state.setLocalTitle}
                  onTitleBlur={() => manager.handlers.handleTitleBlur(task!.title || "")}
                  workspaceSlug={activeWorkspace?.slug || ""}
                  onToggleCompletion={handleToggleCompletion}
                />
                <TaskDetailsMainContent
                  task={task!}
                  projectMembers={projectMembers}
                  completedStatus={completedStatus}
                  projectStatuses={projectStatuses}
                  onUpdateSubtask={(id, data) => manager.mutations.updateSubtaskMutation.mutate({ id, data })}
                  onDeleteSubtask={(id) => manager.mutations.deleteSubtaskMutation.mutate(id)}
                  onNavigateToSubtask={(id) => router.push(`${pathname}?taskId=${id}`)}
                  onAddSubtask={(title) => manager.mutations.createSubtaskMutation.mutate({
                    title,
                    statusId: projectStatuses[0]?.id || "",
                    type: "subtask",
                    priority: "medium",
                  })}
                  onUploadAttachment={manager.mutations.uploadAttachmentMutation.mutate}
                  onDeleteAttachment={manager.mutations.deleteAttachmentMutation.mutate} // Wait, need to define this in the hook
                  canDeleteAttachment={canDeleteAttachment}
                  isUploadingAttachment={manager.mutations.uploadAttachmentMutation.isPending}
                  descriptionValue={manager.state.localDesc}
                  setDescriptionValue={manager.state.setLocalDesc}
                  onDescriptionBlur={() => manager.handlers.handleDescBlur(task!.description || "")}
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
                />
              </div>
            </ScrollArea>

            <div className="h-full w-87.5 shrink-0 space-y-6 overflow-y-auto bg-background p-5">
              <TaskDetailsSidebar
                task={task!}
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
        )}
      </SheetContent>
    </Sheet>
  )
}
