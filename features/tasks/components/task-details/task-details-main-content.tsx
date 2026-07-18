"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ProjectMember,
  Task,
  TaskActivity,
  TaskStatus,
  User,
} from "@/types/models"
import { UseMutationResult } from "@tanstack/react-query"
import React from "react"
import { TaskDetailsActivity } from "./task-details-activity"
import { TaskDetailsAttachments } from "./task-details-attachments"
import { TaskDetailsComments } from "./task-details-comments"
import { TaskDetailsDependencies } from "./task-details-dependencies"
import { TaskDetailsDescription } from "./task-details-description"
import { TaskDetailsSubtasks } from "./task-details-subtasks"

interface TaskDetailsMainContentProps {
  task: Task
  projectMembers: ProjectMember[]
  completedStatus: TaskStatus | undefined
  projectStatuses: TaskStatus[]
  onUpdateSubtask: (id: string, data: Partial<Task>) => void
  onDeleteSubtask: (id: string) => void
  onNavigateToSubtask: (id: string) => void
  onAddSubtask: (title: string) => void
  onUploadAttachment: (variables: {
    file: File
    onProgress?: (percent: number) => void
  }) => Promise<unknown>
  onDeleteAttachment: (id: string) => void
  canDeleteAttachment: (id: string) => boolean
  isUploadingAttachment: boolean
  descriptionValue: string
  setDescriptionValue: (val: string) => void
  onDescriptionBlur: () => void
  commentValue: string
  setCommentValue: (val: string) => void
  handleAddComment: (e?: React.FormEvent | React.MouseEvent) => void
  currentUser: { user?: User | null } | null | undefined
  replyingToCommentId: string | null
  setReplyingToCommentId: (id: string | null) => void
  replyContent: string
  setReplyContent: (val: string) => void
  handleAddReply: (parentId: string) => void
  editingCommentId: string | null
  setEditingCommentId: (id: string | null) => void
  editingContent: string
  setEditingContent: (val: string) => void
  handleUpdateComment: (commentId: string) => void
  toggleReactionMutation: UseMutationResult<
    unknown,
    Error,
    { commentId: string; emoji: string },
    unknown
  >
  deleteCommentMutation: UseMutationResult<unknown, Error, string, unknown>
  onCreateDependency: (data: {
    dependencyTaskId: string
    direction: "blocks" | "blocked_by"
  }) => void
  onDeleteDependency: (id: string) => void
}

export function TaskDetailsMainContent({
  task,
  projectMembers,
  completedStatus,
  projectStatuses,
  onUpdateSubtask,
  onDeleteSubtask,
  onNavigateToSubtask,
  onAddSubtask,
  onUploadAttachment,
  onDeleteAttachment,
  canDeleteAttachment,
  isUploadingAttachment,
  descriptionValue,
  setDescriptionValue,
  onDescriptionBlur,
  commentValue,
  setCommentValue,
  handleAddComment,
  currentUser,
  replyingToCommentId,
  setReplyingToCommentId,
  replyContent,
  setReplyContent,
  handleAddReply,
  editingCommentId,
  setEditingCommentId,
  editingContent,
  setEditingContent,
  handleUpdateComment,
  toggleReactionMutation,
  deleteCommentMutation,
  onCreateDependency,
  onDeleteDependency,
}: TaskDetailsMainContentProps) {
  return (
    <div className="space-y-6">
      <TaskDetailsDescription
        value={descriptionValue}
        onChange={setDescriptionValue}
        onBlur={onDescriptionBlur}
        projectMembers={projectMembers}
      />

      <TaskDetailsSubtasks
        taskId={task.id}
        subtasks={task.subtasks || []}
        completedStatus={completedStatus}
        projectStatuses={projectStatuses}
        projectMembers={projectMembers}
        onUpdateSubtask={onUpdateSubtask}
        onDeleteSubtask={onDeleteSubtask}
        onNavigateToSubtask={onNavigateToSubtask}
        onAddSubtask={onAddSubtask}
      />

      <TaskDetailsAttachments
        taskId={task.id}
        attachments={task.attachments || []}
        onUpload={onUploadAttachment}
        onDelete={onDeleteAttachment}
        canDelete={canDeleteAttachment}
        isUploading={isUploadingAttachment}
      />

      <TaskDetailsDependencies
        task={task}
        projectStatuses={projectStatuses}
        onNavigateToTask={onNavigateToSubtask}
        onAddDependency={onCreateDependency}
        onRemoveDependency={onDeleteDependency}
      />

      <Tabs defaultValue="comments" className="w-full">
        <TabsList
          className="mb-6 h-auto w-full justify-start gap-4 rounded-none border-b p-0"
          variant="line"
        >
          <TabsTrigger value="comments" className="pt-1 pb-2 text-sm">
            Comments
          </TabsTrigger>
          <TabsTrigger value="activity" className="pt-1 pb-2 text-sm">
            Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="comments" className="mt-0">
          <TaskDetailsComments
            comments={task.comments || []}
            currentUser={currentUser}
            projectMembers={projectMembers}
            newComment={commentValue}
            setNewComment={setCommentValue}
            handleAddComment={handleAddComment}
            replyingToCommentId={replyingToCommentId}
            setReplyingToCommentId={setReplyingToCommentId}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            handleAddReply={handleAddReply}
            editingCommentId={editingCommentId}
            setEditingCommentId={setEditingCommentId}
            editingContent={editingContent}
            setEditingContent={setEditingContent}
            handleUpdateComment={handleUpdateComment}
            deleteCommentMutation={deleteCommentMutation}
            toggleReactionMutation={toggleReactionMutation}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-0">
          <TaskDetailsActivity
            activityLogs={task.activityLogs || []}
            formatActivityText={(activity: TaskActivity) => {
              // Re-implementing the logic for the shared component or pass it as prop
              const action = activity.action
              const oldValue = activity.oldValue
              const newValue = activity.newValue

              if (action === "comment_added") return "added a comment"
              if (action === "description_changed")
                return "updated the description"
              if (action === "title_changed")
                return `renamed this task to "${newValue}"`
              if (action === "status_changed")
                return `changed status from "${oldValue}" to "${newValue}"`
              if (action === "priority_changed")
                return `changed priority from "${oldValue}" to "${newValue}"`
              if (action === "assignee_changed")
                return newValue
                  ? `assigned to ${newValue}`
                  : "unassigned this task"
              if (action === "created") return "created this task"
              if (action === "deleted") return "deleted this task"

              const actionText = action.replace("_", " ")
              let valueText = ""
              if (oldValue && newValue) {
                valueText = ` from "${oldValue}" to "${newValue}"`
              } else if (newValue) {
                valueText = ` to "${newValue}"`
              } else if (oldValue) {
                valueText = ` (previously "${oldValue}")`
              }
              return `${actionText}${valueText}`
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
