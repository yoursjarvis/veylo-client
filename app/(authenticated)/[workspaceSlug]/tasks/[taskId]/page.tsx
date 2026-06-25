"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { axiosInstance } from "@/lib/axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import {
  ArrowLeft,
  Trash,
  Plus,
  Clock,
  FileText,
  Activity,
  MessageSquare,
  CheckCircle2,
  Calendar as CalendarIcon,
  Copy,
  AlertTriangle,
  SmilePlus,
} from "lucide-react"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import {
  useTaskDetails,
  useUpdateTask,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
  useProjectCustomFields,
  useProjectStatuses,
  useProjectSprints,
  useToggleCommentReaction,
  useReactionUsers,
} from "@/features/tasks/hooks/use-tasks"

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceSlug = params.workspaceSlug as string
  const taskId = params.taskId as string

  const { data: currentUser } = useCurrentUser()
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null
  )
  const [replyContent, setReplyContent] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  const { data: task, isLoading: isTaskLoading } = useTaskDetails(taskId)
  const projectId = task?.projectId

  // Project details for members and template
  const { data: selectedProject } = useQuery<LooseRecord>({
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
  const completedStatus =
    projectStatuses.find(
      (st: any) =>
        st.name.toLowerCase() === "done" ||
        st.name.toLowerCase() === "completed" ||
        st.name.toLowerCase() === "complete"
    ) || projectStatuses[projectStatuses.length - 1]
  const isCompleted = task?.statusId === completedStatus?.id

  const { data: projectSprints = [] } = useProjectSprints(projectId || "")
  const projectMembers = selectedProject?.members || []
  const projectTemplate = selectedProject?.template || "simple"

  const updateTaskMutation = useUpdateTask(projectId || "", taskId)
  const createSubtaskMutation = useCreateSubtask(taskId)
  const updateSubtaskMutation = useUpdateSubtask(taskId)
  const deleteSubtaskMutation = useDeleteSubtask(taskId)
  const createCommentMutation = useCreateComment(taskId)
  const deleteCommentMutation = useDeleteComment(taskId)
  const updateCommentMutation = useUpdateComment(taskId)
  const toggleReactionMutation = useToggleCommentReaction(taskId)

  // Local state
  const [localTitle, setLocalTitle] = useState("")
  const [localDesc, setLocalDesc] = useState("")
  const [newComment, setNewComment] = useState("")
  const [subtaskValidationErrors, setSubtaskValidationErrors] = useState<
    Record<string, string>
  >({})
  const [statusInputValue, setStatusInputValue] = useState("")
  const [assigneeInputValue, setAssigneeInputValue] = useState("")
  const [sprintInputValue, setSprintInputValue] = useState("")
  const [typeInputValue, setTypeInputValue] = useState("")
  const [priorityInputValue, setPriorityInputValue] = useState("")

  const subtaskForm = useForm({
    defaultValues: {
      title: "",
    },
    onSubmit: async ({ value }) => {
      setSubtaskValidationErrors({})
      if (!value.title.trim()) return
      createSubtaskMutation.mutate(
        { title: value.title.trim() },
        {
          onSuccess: () => {
            subtaskForm.reset()
          },
          onError: (error: unknown) => {
            const err = error as {
              response?: {
                data?: {
                  details?: Array<{ field: string; message: string }>
                  message?: string
                }
              }
            }
            const errorDetails = err.response?.data?.details
            if (Array.isArray(errorDetails)) {
              const errors: Record<string, string> = {}
              errorDetails.forEach((d) => {
                errors[d.field] = d.message
              })
              setSubtaskValidationErrors(errors)
            } else {
              toast.error(
                err.response?.data?.message || "Failed to add subtask"
              )
            }
          },
        }
      )
    },
  })

  useEffect(() => {
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Needed to sync local state with fetched task data
      setLocalTitle(task.title || "")
      setLocalDesc(task.description || "")
    }
  }, [task])

  useEffect(() => {
    if (task?.assigneeId) {
      const member = projectMembers.find((m: LooseRecord) => m.user.id === task.assigneeId)
      if (member) setAssigneeInputValue(member.user.name)
      else setAssigneeInputValue("")
    } else {
      setAssigneeInputValue("")
    }
  }, [task?.assigneeId, projectMembers])

  const filteredMembers = projectMembers.filter((m: LooseRecord) => {
    const selectedMember = projectMembers.find((pm: LooseRecord) => pm.user.id === task?.assigneeId)
    if (selectedMember && selectedMember.user.name === assigneeInputValue) return true
    return m.user.name?.toLowerCase().includes(assigneeInputValue.toLowerCase())
  })
  const showUnassigned = !assigneeInputValue || "unassigned".includes(assigneeInputValue.toLowerCase()) || (() => {
    const selectedMember = projectMembers.find((pm: LooseRecord) => pm.user.id === task?.assigneeId)
    return selectedMember && selectedMember.user.name === assigneeInputValue
  })()

  const handleFieldChange = (field: string, value: LooseRecord) => {
    updateTaskMutation.mutate({ [field]: value })
  }

  const handleCustomFieldChange = (fieldKey: string, value: LooseRecord) => {
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
        <AlertTriangle className="h-12 w-12 text-destructive" />
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
      {/* Top Breadcrumbs & Action Bar */}
      <div className="border-b border-border bg-card/40 px-6 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <ArrowLeft className="h-4 w-4" />
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
              <h2 className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
                ID: {task.id}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                  isCompleted ? "fill-success/10 text-success" : ""
                }
              />
              {isCompleted ? "Completed" : "Mark Complete"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex h-8 items-center gap-1.5 text-xs"
              onClick={copyTaskUrl}
            >
              <Copy size={13} /> Copy Link
            </Button>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Left Columns (Main content) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Title */}
            <div>
              <Input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="h-auto w-full border-transparent bg-transparent px-2 py-1 text-2xl font-bold text-foreground hover:border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card/30 p-5">
              <label className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <FileText size={14} /> Description
              </label>
              <RichTextEditor
                placeholder="Describe this task... (Use @ to mention, / for blocks, paste images)"
                value={localDesc}
                onChange={setLocalDesc}
                onBlur={handleDescBlur}
                projectMembers={projectMembers}
                minHeight="200px"
              />
            </div>

            {/* Subtasks checklist */}
            <div className="rounded-xl border border-border bg-card/30 p-5">
              <label className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <CheckCircle2 size={14} /> Subtask Checklist
              </label>
              <div className="mb-3 space-y-2">
                {task.subtasks?.map((subtask: LooseRecord) => (
                  <div
                    key={subtask.id}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/20 p-2.5"
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
                      onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  subtaskForm.handleSubmit()
                }}
                className="flex flex-col gap-1.5"
              >
                <subtaskForm.Field
                  name="title"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "Subtask title is required"
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = []
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err))
                    })
                    if (subtaskValidationErrors.title)
                      fieldErrors.push(subtaskValidationErrors.title)
                    const hasError =
                      field.state.meta.isTouched && !!fieldErrors.length
                    return (
                      <div className="w-full space-y-1">
                        <div className="flex w-full gap-2">
                          <Input
                            value={field.state.value}
                            onChange={(e) => {
                              field.handleChange(e.target.value)
                              setSubtaskValidationErrors((prev) => ({
                                ...prev,
                                title: "",
                              }))
                            }}
                            placeholder="Add a subtask..."
                            className="h-8 flex-1 border-border bg-background text-xs focus:outline-none"
                            aria-invalid={hasError}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                            className="h-8 shrink-0 text-xs"
                          >
                            <Plus size={14} className="mr-1" /> Add
                          </Button>
                        </div>
                        {hasError && (
                          <p className="mt-0.5 text-[11px] font-medium text-destructive">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  }}
                </subtaskForm.Field>
              </form>
            </div>

            {/* Comments & Discussion */}
            <div className="space-y-4 rounded-xl border border-border bg-card/30 p-5">
              <label className="flex items-center gap-1.5 border-b border-border pb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
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
                {buildCommentThreads(task.comments || []).map(
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
            <div className="space-y-4 rounded-xl border border-border bg-card/30 p-5">
              <label className="flex items-center gap-1.5 border-b border-border pb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <Activity size={14} /> Activity Feed
              </label>
              <div className="space-y-3 pl-2">
                {task.activityLogs?.map((activity: LooseRecord) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2.5 text-xs text-muted-foreground"
                  >
                    <Clock
                      size={13}
                      className="mt-0.5 flex-shrink-0 text-muted-foreground/60"
                    />
                    <div>
                      <span className="font-semibold text-foreground">
                        {activity.user.name}{" "}
                      </span>
                      <span>{formatActivityText(activity)}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground/80">
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

          {/* Right Sidebar Columns (Metadata Parameters) */}
          <div className="space-y-6 rounded-xl border border-border bg-card/30 p-5 lg:col-span-1">
            <h3 className="border-b border-border pb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Metadata Settings
            </h3>

            {/* Status */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                Status
              </span>
              <Combobox
                value={task.statusId ? { value: task.statusId, label: projectStatuses.find((s: LooseRecord) => s.id === task.statusId)?.name || "" } : null}
                onValueChange={(val: any) => handleFieldChange("statusId", val?.value)}
                inputValue={statusInputValue}
                onInputValueChange={setStatusInputValue}
              >
                <ComboboxInput
                  className="flex h-9 w-full items-center rounded-lg border border-border bg-background text-xs text-foreground"
                  placeholder="Select status..."
                />
                <ComboboxContent>
                  <ComboboxList>
                    {projectStatuses.map((st: LooseRecord) => (
                      <ComboboxItem key={st.id} value={{ value: st.id, label: st.name }}>
                        {st.name}
                      </ComboboxItem>
                    ))}
                    <ComboboxEmpty>No statuses found</ComboboxEmpty>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                Assignee
              </span>
              <Combobox
                value={task.assigneeId ? { value: task.assigneeId, label: projectMembers.find((m: LooseRecord) => m.user.id === task.assigneeId)?.user?.name || "" } : null}
                onValueChange={(val: any) => handleFieldChange("assigneeId", val?.value || null)}
                inputValue={assigneeInputValue}
                onInputValueChange={setAssigneeInputValue}
              >
                <ComboboxInput
                  className="flex h-9 w-full items-center rounded-lg border border-border bg-background text-xs text-foreground"
                  placeholder="Select assignee..."
                >
                  {task.assigneeId && (() => {
                    const member = projectMembers.find((m: LooseRecord) => m.user.id === task.assigneeId)
                    return member ? (
                      <InputGroupAddon align="inline-start">
                        <Avatar className="h-5 w-5 border border-border">
                          <AvatarImage src={member.user.image || ""} />
                          <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                            {member.user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </InputGroupAddon>
                    ) : null
                  })()}
                </ComboboxInput>
                <ComboboxContent>
                  <ComboboxList>
                    {showUnassigned && (
                      <ComboboxItem value={{ value: "", label: "Unassigned" }}>
                        Unassigned
                      </ComboboxItem>
                    )}
                    {filteredMembers.map((m: LooseRecord) => (
                      <ComboboxItem key={m.user.id} value={{ value: m.user.id, label: m.user.name }}>
                        <Avatar className="h-5 w-5 border border-border">
                          <AvatarImage src={m.user.image || ""} />
                          <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                            {m.user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {m.user.name}
                      </ComboboxItem>
                    ))}
                    <ComboboxEmpty>No members found</ComboboxEmpty>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            {/* Sprint (Scrum Only) */}
            {projectTemplate === "scrum" && (
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                  Work Cycle / Sprint
                </span>
                <Combobox
                  value={task.sprintId ? { value: task.sprintId, label: projectSprints.find((s: LooseRecord) => s.id === task.sprintId)?.name || "" } : null}
                  onValueChange={(val: any) => handleFieldChange("sprintId", val?.value || null)}
                  inputValue={sprintInputValue}
                  onInputValueChange={setSprintInputValue}
                >
                  <ComboboxInput
                    className="flex h-9 w-full items-center rounded-lg border border-border bg-background text-xs text-foreground"
                    placeholder="Select sprint..."
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      <ComboboxItem value={{ value: "", label: "Backlog" }}>
                        Backlog
                      </ComboboxItem>
                      {projectSprints.map((sp: LooseRecord) => (
                        <ComboboxItem key={sp.id} value={{ value: sp.id, label: `${sp.name} (${sp.status})` }}>
                          {sp.name} ({sp.status})
                        </ComboboxItem>
                      ))}
                      <ComboboxEmpty>No sprints found</ComboboxEmpty>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            )}

            {/* Task Type */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                Type
              </span>
              <Combobox
                value={task.type ? { value: task.type, label: task.type === "bug" ? "Bug (Defect)" : task.type === "feature" ? "Feature" : "Task" } : null}
                onValueChange={(val: any) => handleFieldChange("type", val?.value)}
                inputValue={typeInputValue}
                onInputValueChange={setTypeInputValue}
              >
                <ComboboxInput
                  className="flex h-9 w-full items-center rounded-lg border border-border bg-background text-xs text-foreground"
                  placeholder="Select type..."
                />
                <ComboboxContent>
                  <ComboboxList>
                    <ComboboxItem value={{ value: "task", label: "Task" }}>Task</ComboboxItem>
                    <ComboboxItem value={{ value: "bug", label: "Bug (Defect)" }}>Bug (Defect)</ComboboxItem>
                    <ComboboxItem value={{ value: "feature", label: "Feature" }}>Feature</ComboboxItem>
                    <ComboboxEmpty>No types found</ComboboxEmpty>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                Priority
              </span>
              <Combobox
                value={task.priority ? { value: task.priority, label: task.priority.charAt(0).toUpperCase() + task.priority.slice(1) } : null}
                onValueChange={(val: any) => handleFieldChange("priority", val?.value)}
                inputValue={priorityInputValue}
                onInputValueChange={setPriorityInputValue}
              >
                <ComboboxInput
                  className="flex h-9 w-full items-center rounded-lg border border-border bg-background text-xs text-foreground"
                  placeholder="Select priority..."
                />
                <ComboboxContent>
                  <ComboboxList>
                    <ComboboxItem value={{ value: "low", label: "Low" }}>Low</ComboboxItem>
                    <ComboboxItem value={{ value: "medium", label: "Medium" }}>Medium</ComboboxItem>
                    <ComboboxItem value={{ value: "high", label: "High" }}>High</ComboboxItem>
                    <ComboboxItem value={{ value: "urgent", label: "Urgent" }}>Urgent</ComboboxItem>
                    <ComboboxEmpty>No priorities found</ComboboxEmpty>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            {/* Estimate (Hours / Points) */}
            {projectTemplate !== "simple" && (
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                  Estimate (Points/Hours)
                </span>
                <Input
                  type="number"
                  value={task.estimate ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "estimate",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  className="h-9 border-border bg-background text-xs text-foreground focus:outline-none"
                  placeholder="Estimate value..."
                />
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                Due Date
              </span>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start border-border bg-background px-3 text-left text-xs font-normal text-foreground",
                        !task.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {task.dueDate ? (
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
                    selected={task.dueDate ? new Date(task.dueDate) : undefined}
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

            {/* Custom Fields Editor */}
            {customFieldDefinitions && customFieldDefinitions.length > 0 && (
              <div className="space-y-4 border-t border-border pt-4">
                <span className="block text-[10px] font-bold text-primary uppercase">
                  Custom Properties
                </span>
                {customFieldDefinitions.map((fieldDef: LooseRecord) => {
                  const fieldValue = task.customFields?.[fieldDef.id] ?? ""
                  return (
                    <div key={fieldDef.id} className="space-y-1.5">
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
                        <Combobox
                          value={fieldValue ? { value: fieldValue, label: fieldValue } : null}
                          onValueChange={(val: any) =>
                            handleCustomFieldChange(fieldDef.id, val?.value || "")
                          }
                        >
                          <ComboboxInput
                            className="flex h-9 w-full items-center rounded-lg border border-border bg-background text-xs text-foreground"
                            placeholder="Choose option..."
                          />
                          <ComboboxContent>
                            <ComboboxList>
                              {fieldDef.options?.map((opt: string) => (
                                <ComboboxItem key={opt} value={{ value: opt, label: opt }}>
                                  {opt}
                                </ComboboxItem>
                              ))}
                              <ComboboxEmpty>No options found</ComboboxEmpty>
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
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
                          className="h-9 border-border bg-background text-xs text-foreground focus:outline-none"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const formatActivityText = (activity: LooseRecord) => {
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

const ReactionChip = ({
  commentId,
  emoji,
  count,
  hasReacted,
  onToggle,
  togglePending,
}: LooseRecord) => {
  const [isOpen, setIsOpen] = useState(false)
  const { data: users, isLoading } = useReactionUsers(commentId, emoji, isOpen)

  return (
    <TooltipProvider delay={300}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger
          onClick={() => onToggle(emoji)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
            hasReacted
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border/50 bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="w-auto min-w-[150px] border bg-popover p-2 text-popover-foreground shadow-md"
        >
          {isLoading || togglePending ? (
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="border-b border-border/50 pb-1 text-xs font-semibold text-muted-foreground">
                Reacted with {emoji}
              </div>
              <div className="flex max-h-[200px] flex-col gap-2 overflow-y-auto pr-2">
                {users?.map((u: LooseRecord) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 border border-border">
                      <AvatarImage src={u.image || ""} />
                      <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                        {u.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{u.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
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
  const [isHovered, setIsHovered] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  // Group reactions by emoji
  const reactionGroups = (comment.reactions || []).reduce(
    (acc: LooseRecord, reaction: LooseRecord) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    },
    {}
  )

  const handleToggleReaction = (emoji: string) => {
    toggleReactionMutation.mutate({ commentId: comment.id, emoji })
    setShowEmojiPicker(false)
  }

  return (
    <div className="relative space-y-3">
      {/* Comment Card */}
      <div
        className="group relative flex gap-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <div className="absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 shadow-sm">
            {["❤️", "👍", "🙏", "👎"].map((emoji) => (
              <button
                key={emoji}
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-muted"
                onClick={() => handleToggleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
                <SmilePlus size={14} />
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="w-auto border-none bg-transparent p-0 shadow-none"
              >
                <EmojiPicker
                  onEmojiClick={(e) => handleToggleReaction(e.emoji)}
                  theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Avatar className="mt-1 h-8 w-8 flex-shrink-0 border border-border">
          <AvatarImage src={comment.user?.image || ""} />
          <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
            {comment.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 rounded-xl border border-border/40 bg-muted/40 p-3.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {comment.user?.name}
              {comment.isEdited && (
                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground italic">
                  (edited)
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">
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
            <>
              <div
                className="ProseMirror mb-2 max-w-full overflow-hidden text-xs text-foreground"
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
              {/* Actions bar inside comment card */}
              <div className="mt-1 flex items-center gap-3 border-t border-border/40 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToCommentId(comment.id)
                    setReplyContent("")
                  }}
                  className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:text-primary"
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
                      className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:text-destructive"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Reactions Display */}
          {Object.keys(reactionGroups).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Object.entries(reactionGroups) as LooseAny).map(
                ([emoji, reactions]: [string, LooseRecord[]]) => {
                  const hasReacted = reactions.some(
                    (r: LooseRecord) => r.userId === currentUser?.user?.id
                  )
                  return (
                    <ReactionChip
                      key={emoji}
                      commentId={comment.id}
                      emoji={emoji}
                      count={reactions.length}
                      hasReacted={hasReacted}
                      onToggle={handleToggleReaction}
                      togglePending={
                        toggleReactionMutation.isPending &&
                        toggleReactionMutation.variables?.emoji === emoji
                      }
                    />
                  )
                }
              )}
              <Popover>
                <PopoverTrigger className="flex h-6 w-6 items-center justify-center self-center rounded-full border border-border/50 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted">
                  <SmilePlus size={12} />
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  className="w-auto border-none bg-transparent p-0 shadow-none"
                >
                  <EmojiPicker
                    onEmojiClick={(e) => handleToggleReaction(e.emoji)}
                    theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Inline Reply Editor specifically for this comment */}
      {replyingToCommentId === comment.id && (
        <div className="ml-8 space-y-2 border-l-2 border-border/60 pl-3">
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
        <div className="relative mt-2 ml-6 space-y-4 before:absolute before:top-0 before:bottom-[28px] before:left-0 before:w-[2px] before:bg-border/40">
          {comment.replies.map((reply: LooseRecord) => (
            <div key={reply.id} className="relative pl-6">
              {/* Elbow connector */}
              <div className="absolute top-0 left-0 h-[16px] w-[16px] rounded-bl-md border-b-[2px] border-l-[2px] border-border/40" />
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

const buildCommentThreads = (comments: LooseRecord[]) => {
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
        new Date(a.createdAt as string).getTime() -
        new Date(b.createdAt as string).getTime()
    )
  })

  return roots
}
