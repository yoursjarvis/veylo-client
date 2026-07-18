"use client"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import {
  Epic,
  Label,
  Milestone,
  ProjectMember,
  Sprint,
  TaskStatus,
  User,
} from "@/types/models"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useTaskDetailsManager } from "../hooks/use-task-details-manager"
import { useProjectCustomFields, useTaskDetails } from "../hooks/use-tasks"
import { TaskDetailsHeader } from "./task-details/task-details-header"
import { TaskDetailsMainContent } from "./task-details/task-details-main-content"
import { TaskDetailsSidebar } from "./task-details/task-details-sidebar"

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

  if (!taskId) return null

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex h-full w-full flex-col border-l border-border bg-card p-0 text-foreground data-[side=right]:sm:max-w-[90vw] data-[side=right]:md:max-w-[80vw] data-[side=right]:lg:max-w-[70vw] data-[side=right]:xl:max-w-[60vw]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <SheetTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Task Details
            </SheetTitle>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 flex-row overflow-hidden">
            <div className="flex-1 space-y-6 border-r border-border p-6">
              <Skeleton className="h-8 w-3/4" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
              <Skeleton className="mt-8 h-[200px] w-full" />
              <div className="mt-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="w-[320px] space-y-6 p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 flex-1" />
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 flex-1" />
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 flex-1" />
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            </div>
          </div>
        ) : !task ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-muted-foreground">Task not found.</span>
          </div>
        ) : (
          <div className="flex flex-1 flex-row overflow-hidden">
            <ScrollArea className="h-full flex-1 border-r border-border/50 p-6">
              <div className="space-y-6">
                <TaskDetailsHeader
                  task={task!}
                  isCompleted={isCompleted}
                  onTitleChange={manager.state.setLocalTitle}
                  onTitleBlur={() =>
                    manager.handlers.handleTitleBlur(task!.title || "")
                  }
                  workspaceSlug={activeWorkspace?.slug || ""}
                  onToggleCompletion={handleToggleCompletion}
                />
                <TaskDetailsMainContent
                  task={task!}
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
                    router.push(`${pathname}?taskId=${id}`)
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
                  } // Wait, need to define this in the hook
                  canDeleteAttachment={canDeleteAttachment}
                  isUploadingAttachment={
                    manager.mutations.uploadAttachmentMutation.isPending
                  }
                  descriptionValue={manager.state.localDesc}
                  setDescriptionValue={manager.state.setLocalDesc}
                  onDescriptionBlur={() =>
                    manager.handlers.handleDescBlur(task!.description || "")
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
                  toggleReactionMutation={
                    manager.mutations.toggleReactionMutation
                  }
                  deleteCommentMutation={
                    manager.mutations.deleteCommentMutation
                  }
                  onCreateDependency={
                    manager.mutations.createDependencyMutation.mutate
                  }
                  onDeleteDependency={
                    manager.mutations.deleteDependencyMutation.mutate
                  }
                />
              </div>
            </ScrollArea>

            <div className="h-full w-87.5 shrink-0 space-y-6 overflow-y-auto bg-background p-5">
              <TaskDetailsSidebar
                key={task!.id}
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
