"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  useTaskDetails,
  useUpdateTask,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
  useToggleCommentReaction,
  useProjectCustomFields,
  useTaskDependencies,
  useCreateTaskDependency,
  useDeleteTaskDependency,
} from "../hooks/use-tasks"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { useQuery } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { InputGroupAddon } from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Trash,
  Plus,
  Clock,
  FileText,
  Activity,
  MessageSquare,
  CheckCircle2,
  Calendar as CalendarIcon,
  AlertTriangle,
  Copy,
  ExternalLink,
  SmilePlus,
} from "lucide-react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"

interface TaskDetailsDrawerProps {
  taskId: string | null
  projectId: string
  projectMembers: LooseRecord[]
  projectStatuses: LooseRecord[]
  projectSprints: LooseRecord[]
  projectTemplate: string
  projectEpics?: LooseRecord[]
  projectMilestones?: LooseRecord[]
  projectLabels?: LooseRecord[]
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
  const completedStatus =
    projectStatuses.find(
      (st) =>
        st.name.toLowerCase() === "done" ||
        st.name.toLowerCase() === "completed" ||
        st.name.toLowerCase() === "complete"
    ) || projectStatuses[projectStatuses.length - 1]
  const isCompleted = task?.statusId === completedStatus?.id

  const { data: customFieldDefinitions } = useProjectCustomFields(projectId)

  const updateTaskMutation = useUpdateTask(projectId, taskId || "")
  const createSubtaskMutation = useCreateSubtask(taskId || "")
  const updateSubtaskMutation = useUpdateSubtask(taskId || "")
  const deleteSubtaskMutation = useDeleteSubtask(taskId || "")
  const createCommentMutation = useCreateComment(taskId || "")
  const deleteCommentMutation = useDeleteComment(taskId || "")
  const updateCommentMutation = useUpdateComment(taskId || "")
  const toggleReactionMutation = useToggleCommentReaction(taskId || "")

  const { activeWorkspace } = useWorkspaceContext()
  const workspaceId = activeWorkspace?.id
  const router = useRouter()
  const { data: currentUser } = useCurrentUser()

  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null
  )
  const [replyContent, setReplyContent] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  const [assigneeInputValue, setAssigneeInputValue] = useState("")

  useEffect(() => {
    if (task?.assigneeId) {
      const member = projectMembers.find((m) => m.user.id === task.assigneeId)
      if (member) {
        setAssigneeInputValue(member.user.name)
      } else {
        setAssigneeInputValue("")
      }
    } else {
      setAssigneeInputValue("")
    }
  }, [task?.assigneeId, projectMembers])

  const filteredMembers = projectMembers.filter((m) => {
    const selectedMember = projectMembers.find(
      (pm) => pm.user.id === task?.assigneeId
    )
    if (selectedMember && selectedMember.user.name === assigneeInputValue) {
      return true
    }
    return m.user.name?.toLowerCase().includes(assigneeInputValue.toLowerCase())
  })

  const showUnassigned =
    !assigneeInputValue ||
    "unassigned".includes(assigneeInputValue.toLowerCase()) ||
    (() => {
      const selectedMember = projectMembers.find(
        (pm) => pm.user.id === task?.assigneeId
      )
      return selectedMember && selectedMember.user.name === assigneeInputValue
    })()

  const {
    data: dependencies = { blockedBy: [], blocking: [] },
    isLoading: isDepsLoading,
  } = useTaskDependencies(taskId)
  const createDepMutation = useCreateTaskDependency(taskId || "")
  const deleteDepMutation = useDeleteTaskDependency(taskId || "")

  const [isLinking, setIsLinking] = useState(false)
  const [targetProjectId, setTargetProjectId] = useState(projectId)
  const [targetTaskId, setTargetTaskId] = useState("")
  const [depDirection, setDepDirection] = useState<"blocks" | "blocked_by">(
    "blocked_by"
  )

  // Fetch workspace projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/workspaces/${workspaceId}/projects`
      )
      return response.data.data
    },
    enabled: !!workspaceId && isLinking,
  })

  // Fetch tasks of selected target project
  const { data: projectTasks = [] } = useQuery({
    queryKey: ["project-tasks", targetProjectId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/projects/${targetProjectId}/tasks`
      )
      return response.data.data
    },
    enabled: !!targetProjectId && isLinking,
  })

  // Filter tasks: exclude current task and already linked tasks
  const linkedTaskIds = new Set([
    ...(dependencies.blockedBy || []).map((d: LooseRecord) => d.task.id),
    ...(dependencies.blocking || []).map((d: LooseRecord) => d.task.id),
    taskId,
  ])
  const availableTasks = projectTasks.filter(
    (t: LooseRecord) => !linkedTaskIds.has(t.id) && !t.deletedAt
  )

  const handleLinkDependency = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetTaskId) return

    createDepMutation.mutate(
      { dependencyTaskId: targetTaskId, direction: depDirection },
      {
        onSuccess: () => {
          setTargetTaskId("")
          setIsLinking(false)
        },
      }
    )
  }

  // Local state for descriptions/titles to avoid lagging DB calls
  const [localTitle, setLocalTitle] = useState("")
  const [localDesc, setLocalDesc] = useState("")
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [newComment, setNewComment] = useState("")

  useEffect(() => {
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- required to sync local state
      setLocalTitle(task.title || "")
      setLocalDesc(task.description || "")
    }
  }, [task])

  if (!taskId) return null

  const handleFieldChange = (field: string, value: LooseAny) => {
    updateTaskMutation.mutate({ [field]: value })
  }

  const handleCustomFieldChange = (fieldKey: string, value: LooseAny) => {
    const existingCustomFields = task?.customFields || {}
    const updated = { ...existingCustomFields, [fieldKey]: value }
    handleFieldChange("customFields", updated)
  }

  const handleTitleBlur = () => {
    if (localTitle.trim() && localTitle !== task?.title) {
      handleFieldChange("title", localTitle.trim())
    }
  }

  const handleDescBlur = () => {
    if (localDesc !== task?.description) {
      handleFieldChange("description", localDesc)
    }
  }

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    createSubtaskMutation.mutate({ title: newSubtaskTitle.trim() })
    setNewSubtaskTitle("")
  }

  const handleAddComment = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    const cleanContent = newComment.replace(/<[^>]*>/g, "").trim()
    if (!cleanContent && !newComment.includes("<img")) return
    createCommentMutation.mutate({ content: newComment.trim() })
    setNewComment("")
  }

  const handleAddReply = (parentId: string) => {
    const cleanContent = replyContent.replace(/<[^>]*>/g, "").trim()
    if (!cleanContent && !replyContent.includes("<img")) return
    createCommentMutation.mutate(
      { content: replyContent.trim(), parentId },
      {
        onSuccess: () => {
          setReplyContent("")
          setReplyingToCommentId(null)
        },
      }
    )
  }

  const handleUpdateComment = (commentId: string) => {
    const cleanContent = editingContent.replace(/<[^>]*>/g, "").trim()
    if (!cleanContent && !editingContent.includes("<img")) return
    updateCommentMutation.mutate(
      { commentId, content: editingContent.trim() },
      {
        onSuccess: () => {
          setEditingContent("")
          setEditingCommentId(null)
        },
      }
    )
  }

  const selectedMember = projectMembers.find(
    (m) => m.user.id === task?.assigneeId
  )
  const comboboxValue = selectedMember
    ? { value: selectedMember.user.id, label: selectedMember.user.name }
    : { value: "unassigned", label: "Unassigned" }

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex h-full w-full flex-col border-l border-border bg-card p-0 text-foreground data-[side=right]:sm:max-w-[85vw] data-[side=right]:md:max-w-[75vw] data-[side=right]:lg:max-w-[65vw] data-[side=right]:xl:max-w-[55vw]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border p-6">
          <div>
            <SheetTitle className="text-lg font-bold text-foreground">
              Task Details
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              ID: {task?.id || "Loading..."}
            </SheetDescription>
          </div>
          {task && (
            <div className="flex items-center gap-2 pr-6">
              <Button
                variant={isCompleted ? "secondary" : "default"}
                size="sm"
                className="flex h-8 items-center gap-1.5 text-xs"
                onClick={() => {
                  if (!completedStatus) return
                  if (isCompleted) {
                    const firstStatus = projectStatuses[0]
                    if (firstStatus) {
                      handleFieldChange("statusId", firstStatus.id)
                    }
                  } else {
                    handleFieldChange("statusId", completedStatus.id)
                  }
                }}
              >
                <CheckCircle2
                  size={13}
                  className={
                    isCompleted ? "fill-green-500/10 text-green-500" : ""
                  }
                />
                {isCompleted ? "Completed" : "Mark Complete"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex h-8 items-center gap-1.5 text-xs"
                onClick={async () => {
                  const url = `${window.location.origin}/${activeWorkspace?.slug}/tasks/${task.id}`
                  await navigator.clipboard.writeText(url)
                  toast.success("Task link copied to clipboard")
                }}
              >
                <Copy size={13} /> Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex h-8 items-center gap-1.5 text-xs"
                onClick={() => {
                  router.push(`/${activeWorkspace?.slug}/tasks/${task.id}`)
                  onClose()
                }}
              >
                <ExternalLink size={13} /> Open Page
              </Button>
            </div>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></span>
          </div>
        ) : (
          <div className="flex flex-1 flex-row overflow-hidden">
            {/* Left Main Scrollable Content */}
            <ScrollArea className="h-full flex-1 border-r border-border p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <Input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="h-auto border-transparent bg-transparent px-2 py-1 text-xl font-bold text-foreground hover:border-border focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <FileText size={14} /> Description
                  </label>
                  <RichTextEditor
                    placeholder="Describe this task... (Use @ to mention, / for blocks, paste images)"
                    value={localDesc}
                    onChange={setLocalDesc}
                    onBlur={handleDescBlur}
                    projectMembers={projectMembers}
                    minHeight="150px"
                  />
                </div>

                {/* Checklist / Subtasks */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <CheckCircle2 size={14} /> Subtask Checklist
                  </label>
                  <div className="mb-3 space-y-2">
                    {task?.subtasks?.map((subtask: LooseRecord) => (
                      <div
                        key={subtask.id}
                        className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            checked={subtask.isCompleted}
                            onCheckedChange={(checked) =>
                              updateSubtaskMutation.mutate({
                                id: subtask.id,
                                data: { isCompleted: !!checked },
                              })
                            }
                            className="border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                          />
                          <span
                            className={`text-sm ${subtask.isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}
                          >
                            {subtask.title}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            deleteSubtaskMutation.mutate(subtask.id)
                          }
                          className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <Input
                      placeholder="Add subtask checklist item..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="h-8 border-border bg-background text-sm text-foreground"
                    />
                    <Button type="submit" size="sm" className="h-8">
                      <Plus size={14} />
                    </Button>
                  </form>
                </div>

                {/* Task Dependencies Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <AlertTriangle size={14} className="text-amber-500" />{" "}
                      Linked Issues (Dependencies)
                    </label>
                    {!isLinking && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="h-7 text-xs text-primary hover:bg-primary/10"
                        onClick={() => {
                          setTargetProjectId(projectId)
                          setIsLinking(true)
                        }}
                      >
                        <Plus size={14} className="mr-1" /> Link Issue
                      </Button>
                    )}
                  </div>

                  {/* Linking Form */}
                  {isLinking && (
                    <form
                      onSubmit={handleLinkDependency}
                      className="space-y-3 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">
                            Relationship
                          </label>
                          <select
                            value={depDirection}
                            onChange={(e) =>
                              setDepDirection(
                                e.target.value as "blocks" | "blocked_by"
                              )
                            }
                            className="h-8 w-full rounded border border-border bg-background p-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          >
                            <option value="blocked_by">is blocked by</option>
                            <option value="blocks">blocks</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">
                            Project
                          </label>
                          <select
                            value={targetProjectId}
                            onChange={(e) => {
                              setTargetProjectId(e.target.value)
                              setTargetTaskId("")
                            }}
                            className="h-8 w-full rounded border border-border bg-background p-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          >
                            {projects.map((p: LooseRecord) => (
                              <option key={p.id} value={p.id}>
                                {p.title}{" "}
                                {p.id === projectId ? "(Current)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">
                          Target Task
                        </label>
                        <select
                          value={targetTaskId}
                          onChange={(e) => setTargetTaskId(e.target.value)}
                          className="h-8 w-full rounded border border-border bg-background p-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          required
                        >
                          <option value="">Select task...</option>
                          {availableTasks.map((t: LooseRecord) => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.priority})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 text-xs">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="text-muted-foreground"
                          onClick={() => {
                            setIsLinking(false)
                            setTargetTaskId("")
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="xs"
                          disabled={
                            !targetTaskId || createDepMutation.isPending
                          }
                        >
                          Link
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Dependencies List */}
                  <div className="space-y-2">
                    {/* Blocked By */}
                    {dependencies.blockedBy?.map((d: LooseRecord) => (
                      <div
                        key={d.dependencyId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-2.5 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex-shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive uppercase">
                            Blocked By
                          </span>
                          <div className="min-w-0">
                            <span className="block truncate font-semibold text-foreground">
                              {d.task.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {d.task.project.title} • {d.task.status?.name}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            deleteDepMutation.mutate(d.dependencyId)
                          }
                        >
                          <Trash size={12} />
                        </Button>
                      </div>
                    ))}

                    {/* Blocking */}
                    {dependencies.blocking?.map((d: LooseRecord) => (
                      <div
                        key={d.dependencyId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-2.5 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex-shrink-0 rounded bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-bold text-teal-500 uppercase">
                            Blocks
                          </span>
                          <div className="min-w-0">
                            <span className="block truncate font-semibold text-foreground">
                              {d.task.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {d.task.project.title} • {d.task.status?.name}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            deleteDepMutation.mutate(d.dependencyId)
                          }
                        >
                          <Trash size={12} />
                        </Button>
                      </div>
                    ))}

                    {!isDepsLoading &&
                      dependencies.blockedBy?.length === 0 &&
                      dependencies.blocking?.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          No linked issues.
                        </p>
                      )}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                  <label className="flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold text-muted-foreground">
                    <MessageSquare size={14} /> Discussion / Comments
                  </label>
                  <div className="flex flex-col gap-2">
                    <RichTextEditor
                      placeholder="Write a comment... (Supports rich text, @mentions, /commands, paste images)"
                      value={newComment}
                      onChange={setNewComment}
                      projectMembers={projectMembers}
                      minHeight="80px"
                      onSubmit={handleAddComment}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => handleAddComment()}
                        size="sm"
                        className="text-xs"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-6">
                    {buildCommentThreads(task?.comments || []).map(
                      (comment: LooseRecord) => (
                        <CommentNode
                          key={comment.id}
                          comment={comment}
                          currentUser={currentUser}
                          projectMembers={projectMembers}
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
                      )
                    )}
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-4">
                  <label className="flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold text-muted-foreground">
                    <Activity size={14} /> Activity Feed
                  </label>
                  <div className="space-y-3">
                    {task?.activityLogs?.map((activity: LooseRecord) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <Clock
                          size={12}
                          className="mt-0.5 flex-shrink-0 text-muted-foreground/60"
                        />
                        <div>
                          <span className="font-semibold text-foreground">
                            {activity.user.name}{" "}
                          </span>
                          <span>{formatActivityText(activity)}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">
                            {format(
                              new Date(activity.createdAt),
                              "MMM d, yyyy h:mm a"
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Right Side Settings Panel */}
            <div className="h-full w-[220px] space-y-5 overflow-y-auto bg-background p-4">
              {/* Status */}
              <div className="space-y-1">
                <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                  Status
                </span>
                <select
                  value={task?.statusId}
                  onChange={(e) =>
                    handleFieldChange("statusId", e.target.value)
                  }
                  className="w-full rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {projectStatuses.map((st: LooseRecord) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                  Assignee
                </span>
                <Combobox
                  value={comboboxValue}
                  onValueChange={(val: any) =>
                    handleFieldChange(
                      "assigneeId",
                      val?.value === "unassigned" ? null : val?.value || null
                    )
                  }
                  inputValue={assigneeInputValue}
                  onInputValueChange={setAssigneeInputValue}
                  isItemEqualToValue={(a: any, b: any) => a?.value === b?.value}
                >
                  <ComboboxInput
                    className="flex h-8 w-full items-center rounded border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="Search assignee..."
                  >
                    <InputGroupAddon align="inline-start">
                      {task?.assigneeId ? (
                        (() => {
                          const member = projectMembers.find(
                            (m) => m.user.id === task.assigneeId
                          )
                          return member ? (
                            <Avatar className="ml-1 h-5 w-5">
                              <AvatarImage src={member.user.image || ""} />
                              <AvatarFallback className="text-[9px]">
                                {member.user.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="ml-1 h-5 w-5">
                              <AvatarFallback className="text-[9px]">
                                ?
                              </AvatarFallback>
                            </Avatar>
                          )
                        })()
                      ) : (
                        <Avatar className="ml-1 h-5 w-5">
                          <AvatarFallback className="text-[9px]">
                            ?
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </InputGroupAddon>
                  </ComboboxInput>
                  <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                    <ComboboxList className="max-h-56 overflow-y-auto">
                      {showUnassigned && (
                        <ComboboxItem
                          value={{ value: "unassigned", label: "Unassigned" }}
                        >
                          <span className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[9px]">
                                ?
                              </AvatarFallback>
                            </Avatar>
                            <span>Unassigned</span>
                          </span>
                        </ComboboxItem>
                      )}
                      {filteredMembers.map((m: LooseRecord) => (
                        <ComboboxItem
                          key={m.user.id}
                          value={{ value: m.user.id, label: m.user.name }}
                        >
                          <span className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={m.user.image || ""} />
                              <AvatarFallback className="text-[9px]">
                                {m.user.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{m.user.name}</span>
                          </span>
                        </ComboboxItem>
                      ))}
                      {filteredMembers.length === 0 && !showUnassigned && (
                        <ComboboxEmpty>No members found</ComboboxEmpty>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Sprint (Scrum Only) */}
              {projectTemplate === "scrum" && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                    Work Cycle / Sprint
                  </span>
                  <select
                    value={task?.sprintId || ""}
                    onChange={(e) =>
                      handleFieldChange("sprintId", e.target.value || null)
                    }
                    className="w-full rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">Backlog</option>
                    {projectSprints.map((sp: LooseRecord) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name} ({sp.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Task Type */}
              <div className="space-y-1">
                <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                  Type
                </span>
                <select
                  value={task?.type}
                  onChange={(e) => handleFieldChange("type", e.target.value)}
                  className="w-full rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug (Defect)</option>
                  <option value="feature">Feature</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                  Priority
                </span>
                <select
                  value={task?.priority}
                  onChange={(e) =>
                    handleFieldChange("priority", e.target.value)
                  }
                  className="w-full rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Estimate (Hours / Points) */}
              {projectTemplate !== "simple" && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                    Estimate (Points/Hours)
                  </span>
                  <Input
                    type="number"
                    value={task?.estimate ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "estimate",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="h-7 border-border bg-card text-xs text-foreground"
                    placeholder="Estimate value..."
                  />
                </div>
              )}

              {/* Due Date */}
              <div className="space-y-1">
                <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                  Due Date
                </span>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-7 w-full justify-start border-border bg-background px-2.5 text-left text-xs font-normal text-foreground",
                          !task?.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        {task?.dueDate ? (
                          format(new Date(task.dueDate), "MMM d, yyyy")
                        ) : (
                          <span>No due date</span>
                        )}
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        task?.dueDate ? new Date(task.dueDate) : undefined
                      }
                      onSelect={(date) =>
                        handleFieldChange(
                          "dueDate",
                          date ? date.toISOString() : null
                        )
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Epic */}
              <div className="space-y-1">
                <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                  Epic / Goal
                </span>
                <select
                  value={task?.epicId || ""}
                  onChange={(e) =>
                    handleFieldChange("epicId", e.target.value || null)
                  }
                  className="w-full rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">No Epic</option>
                  {projectEpics.map((ep: LooseRecord) => (
                    <option key={ep.id} value={ep.id}>
                      {ep.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Milestone */}
              <div className="space-y-1">
                <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                  Milestone
                </span>
                <select
                  value={task?.milestoneId || ""}
                  onChange={(e) =>
                    handleFieldChange("milestoneId", e.target.value || null)
                  }
                  className="w-full rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">No Milestone</option>
                  {projectMilestones.map((ms: LooseRecord) => (
                    <option key={ms.id} value={ms.id}>
                      {ms.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Labels */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                  Labels
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {projectLabels.map((lbl: LooseRecord) => {
                    const taskLabels = task?.labels || []
                    const isSelected = taskLabels.some(
                      (tl: LooseRecord) => tl.labelId === lbl.id
                    )
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => {
                          const currentIds = taskLabels.map(
                            (tl: LooseRecord) => tl.labelId
                          )
                          const nextIds = isSelected
                            ? currentIds.filter((id: string) => id !== lbl.id)
                            : [...currentIds, lbl.id]
                          handleFieldChange("labelIds", nextIds)
                        }}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[9px] font-bold transition-all",
                          isSelected
                            ? "border-transparent shadow-sm"
                            : "border-border bg-transparent text-muted-foreground hover:bg-muted"
                        )}
                        style={isSelected ? { backgroundColor: lbl.color } : {}}
                      >
                        {lbl.name}
                      </button>
                    )
                  })}
                  {projectLabels.length === 0 && (
                    <span className="text-[10px] text-muted-foreground italic">
                      No labels created.{" "}
                      <Link
                        href={`/${activeWorkspace?.slug}/projects/${projectId}/settings/labels`}
                        className="text-primary hover:underline"
                        onClick={onClose}
                      >
                        Create labels in Settings
                      </Link>
                    </span>
                  )}
                </div>
              </div>

              {/* Custom Fields Editor */}
              {customFieldDefinitions && customFieldDefinitions.length > 0 && (
                <div className="space-y-4 border-t border-border pt-4">
                  <span className="block text-[10px] font-bold text-primary uppercase">
                    Custom Properties
                  </span>
                  {customFieldDefinitions.map((fieldDef: LooseRecord) => {
                    const fieldValue = task?.customFields?.[fieldDef.id] ?? ""
                    return (
                      <div key={fieldDef.id} className="space-y-1">
                        <span className="block text-[10px] font-semibold text-muted-foreground">
                          {fieldDef.name}
                        </span>
                        {fieldDef.type === "checkbox" ? (
                          <div className="mt-1 flex items-center gap-2">
                            <Checkbox
                              checked={!!fieldValue}
                              onCheckedChange={(checked) =>
                                handleCustomFieldChange(fieldDef.id, !!checked)
                              }
                              className="border-border"
                            />
                            <span className="text-xs text-muted-foreground">
                              Yes / Active
                            </span>
                          </div>
                        ) : fieldDef.type === "select" ? (
                          <select
                            value={fieldValue}
                            onChange={(e) =>
                              handleCustomFieldChange(
                                fieldDef.id,
                                e.target.value
                              )
                            }
                            className="w-full rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          >
                            <option value="">Choose Option</option>
                            {fieldDef.options?.map((opt: string) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            type={
                              fieldDef.type === "number"
                                ? "number"
                                : fieldDef.type === "date"
                                  ? "date"
                                  : "text"
                            }
                            value={
                              fieldDef.type === "date" && fieldValue
                                ? format(new Date(fieldValue), "yyyy-MM-dd")
                                : fieldValue
                            }
                            onChange={(e) =>
                              handleCustomFieldChange(
                                fieldDef.id,
                                fieldDef.type === "number"
                                  ? parseFloat(e.target.value) || 0
                                  : fieldDef.type === "date"
                                    ? e.target.value
                                      ? new Date(e.target.value).toISOString()
                                      : ""
                                    : e.target.value
                              )
                            }
                            className="h-7 border-border bg-card text-xs text-foreground"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export const formatActivityText = (activity: LooseRecord) => {
  const action = activity.action
  const oldValue = activity.oldValue
  const newValue = activity.newValue

  if (action === "comment_added") {
    return "added a comment"
  }
  if (action === "description_changed") {
    return "updated the description"
  }
  if (action === "title_changed") {
    return `renamed this task to "${newValue}"`
  }
  if (action === "status_changed") {
    return `changed status from "${oldValue}" to "${newValue}"`
  }
  if (action === "priority_changed") {
    return `changed priority from "${oldValue}" to "${newValue}"`
  }
  if (action === "assignee_changed") {
    return newValue ? `assigned to ${newValue}` : "unassigned this task"
  }
  if (action === "created") {
    return "created this task"
  }
  if (action === "deleted") {
    return "deleted this task"
  }

  // Fallback
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
}

const CommentNode = ({
  comment,
  currentUser,
  projectMembers,
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
  deleteCommentMutation,
  toggleReactionMutation,
}: {
  comment: LooseRecord
  currentUser: LooseRecord
  projectMembers: LooseRecord[]
  replyingToCommentId: string | null
  setReplyingToCommentId: (id: string | null) => void
  replyContent: string
  setReplyContent: (content: string) => void
  handleAddReply: (parentId: string) => void
  editingCommentId: string | null
  setEditingCommentId: (id: string | null) => void
  editingContent: string
  setEditingContent: (content: string) => void
  handleUpdateComment: (commentId: string) => void
  deleteCommentMutation: LooseAny
  toggleReactionMutation: LooseAny
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const { resolvedTheme } = useTheme()

  // Group reactions by emoji
  const reactionsMap = new Map<
    string,
    { count: number; userHasReacted: boolean }
  >()
  if (comment.reactions) {
    comment.reactions.forEach((reaction: LooseRecord) => {
      const existing = reactionsMap.get(reaction.emoji) || {
        count: 0,
        userHasReacted: false,
      }
      reactionsMap.set(reaction.emoji, {
        count: existing.count + 1,
        userHasReacted:
          existing.userHasReacted || reaction.userId === currentUser?.user?.id,
      })
    })
  }

  const handleToggleReaction = (emoji: string) => {
    toggleReactionMutation.mutate({ commentId: comment.id, emoji })
    setShowEmojiPicker(false)
  }

  return (
    <div className="space-y-3">
      {/* Comment Card */}
      <div className="flex gap-3">
        <Avatar className="h-7 w-7 flex-shrink-0 border border-border">
          <AvatarImage src={comment.user?.image || ""} />
          <AvatarFallback className="bg-muted text-xs text-foreground">
            {comment.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 rounded-lg border border-border bg-muted/60 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              {comment.user?.name}
              {comment.isEdited && (
                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground italic">
                  (edited)
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(comment.createdAt), "MMM d, h:mm a")}
              </span>
            </div>
          </div>

          {editingCommentId === comment.id ? (
            <div className="mt-2 space-y-2">
              <RichTextEditor
                placeholder="Edit comment..."
                value={editingContent}
                onChange={setEditingContent}
                projectMembers={projectMembers}
                minHeight="80px"
                onSubmit={() => handleUpdateComment(comment.id)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-[10px]"
                  onClick={() => {
                    setEditingCommentId(null)
                    setEditingContent("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2.5 text-[10px]"
                  onClick={() => handleUpdateComment(comment.id)}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              {/* Floating Reaction Bar (visible on hover) */}
              <div
                className={cn(
                  "absolute -top-7 right-0 z-10 flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 shadow-sm transition-opacity",
                  showEmojiPicker
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                {["❤️", "👍", "🙏", "👎"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleToggleReaction(emoji)}
                    className="rounded-full p-1.5 text-sm leading-none transition-colors hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
                <div className="mx-1 h-4 w-px bg-border" />
                <Popover
                  open={showEmojiPicker}
                  onOpenChange={setShowEmojiPicker}
                >
                  <PopoverTrigger className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <SmilePlus size={14} />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto border-none bg-transparent p-0 shadow-none"
                    side="top"
                    align="end"
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) =>
                        handleToggleReaction(emojiData.emoji)
                      }
                      theme={
                        resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT
                      }
                      skinTonesDisabled
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div
                className="ProseMirror mb-2 max-w-full overflow-hidden text-xs text-foreground"
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />

              {/* Reactions display */}
              {Array.from(reactionsMap.entries()).length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {Array.from(reactionsMap.entries()).map(([emoji, data]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleToggleReaction(emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs transition-colors",
                        data.userHasReacted
                          ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                          : "border-border bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <span>{emoji}</span>
                      <span className="text-[10px]">{data.count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Actions bar inside comment card */}
              <div className="mt-1 flex items-center gap-3 border-t border-border/40 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToCommentId(comment.id)
                    setReplyContent("")
                  }}
                  className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:text-primary"
                >
                  Reply
                </button>

                {comment.user?.id === currentUser?.user?.id && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(comment.id)
                        setEditingContent(comment.content)
                      }}
                      className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:text-destructive"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline Reply Editor specifically for this comment */}
      {replyingToCommentId === comment.id && (
        <div className="ml-6 space-y-2 border-l-2 border-border/60 pl-3">
          <RichTextEditor
            placeholder={`Reply to ${comment.user?.name}...`}
            value={replyContent}
            onChange={setReplyContent}
            projectMembers={projectMembers}
            minHeight="60px"
            onSubmit={() => handleAddReply(comment.id)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-[10px]"
              onClick={() => setReplyingToCommentId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-2.5 text-[10px]"
              onClick={() => handleAddReply(comment.id)}
            >
              Reply
            </Button>
          </div>
        </div>
      )}

      {/* View replies button */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1 ml-10">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-[10px] font-bold text-primary transition-all hover:text-primary/80"
          >
            <MessageSquare
              size={10}
              className={isCollapsed ? "" : "opacity-60"}
            />
            {isCollapsed
              ? `Show ${comment.replies.length} replies`
              : "Hide replies"}
          </button>
        </div>
      )}

      {/* Nested Replies - Recursive Rendering */}
      {!isCollapsed && comment.replies && comment.replies.length > 0 && (
        <div className="relative mt-2 ml-6 space-y-4 before:absolute before:top-0 before:bottom-[24px] before:left-0 before:w-[2px] before:bg-border/40">
          {comment.replies.map((reply: LooseRecord) => (
            <div key={reply.id} className="relative pl-6">
              {/* Elbow connector */}
              <div className="absolute top-0 left-0 h-[14px] w-[14px] rounded-bl-md border-b-[2px] border-l-[2px] border-border/40" />
              <CommentNode
                comment={reply}
                currentUser={currentUser}
                projectMembers={projectMembers}
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const buildCommentThreads = (comments: LooseRecord[]) => {
  if (!comments) return []
  const commentMap = new Map()
  const roots: LooseRecord[] = []

  comments.forEach((c) => {
    commentMap.set(c.id, { ...c, replies: [] })
  })

  comments.forEach((c) => {
    const mapped = commentMap.get(c.id)
    if (c.parentId && commentMap.has(c.parentId)) {
      commentMap.get(c.parentId).replies.push(mapped)
    } else {
      roots.push(mapped)
    }
  })

  roots.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  roots.forEach((root) => {
    root.replies.sort(
      (a: LooseRecord, b: LooseRecord) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  })

  return roots
}
