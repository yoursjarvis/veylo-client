"use client"

import React, { useState, useMemo } from "react"
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
  ExternalLink,
  Paperclip,
  Download,
  MessageSquare,
  CheckCircle2,
  Calendar as CalendarIcon,
  Copy,
  AlertTriangle,
  SmilePlus,
  MoreHorizontal,
  UserPlus,
} from "lucide-react"
import Image from "next/image"
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
  useProjectEpics,
  useProjectMilestones,
  useProjectLabels,
  useUploadTaskAttachment,
} from "@/features/tasks/hooks/use-tasks"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Project, ProjectMember, TaskStatus, Subtask, Comment, CommentReaction, TaskActivity, Sprint, Epic, Milestone, Label, TaskLabel, CustomFieldDefinition, User } from "@/types/models"

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
  const { data: selectedProject } = useQuery<Project & { members?: ProjectMember[], template?: string }>({
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
      (st: TaskStatus) =>
        st.name.toLowerCase() === "done" ||
        st.name.toLowerCase() === "completed" ||
        st.name.toLowerCase() === "complete"
    ) || projectStatuses[projectStatuses.length - 1]
  const isCompleted = task?.statusId === completedStatus?.id

  const { data: projectSprints = [] } = useProjectSprints(projectId || "")
  const { data: projectEpics = [] } = useProjectEpics(projectId || "")
  const { data: projectMilestones = [] } = useProjectMilestones(projectId || "")
  const { data: projectLabels = [] } = useProjectLabels(projectId || "")
  const projectMembers = useMemo(() => selectedProject?.members || [], [selectedProject?.members])
  const editorProjectMembers = useMemo(() => projectMembers.map((m: ProjectMember) => ({
    user: {
      id: String(m.user?.id || ""),
      name: m.user?.name,
      image: m.user?.image,
      email: m.user?.email
    }
  })), [projectMembers])
  const projectTemplate = selectedProject?.template || "simple"

  const updateTaskMutation = useUpdateTask(projectId || "", taskId)
  const createSubtaskMutation = useCreateSubtask(projectId || "", taskId)
  const updateSubtaskMutation = useUpdateSubtask(taskId)
  const deleteSubtaskMutation = useDeleteSubtask(taskId)
  const createCommentMutation = useCreateComment(taskId)
  const deleteCommentMutation = useDeleteComment(taskId)
  const updateCommentMutation = useUpdateComment(taskId)
  const toggleReactionMutation = useToggleCommentReaction(taskId)
  const uploadAttachmentMutation = useUploadTaskAttachment(taskId)

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
  const [epicInputValue, setEpicInputValue] = useState("")
  const [milestoneInputValue, setMilestoneInputValue] = useState("")

  const subtaskForm = useForm({
    defaultValues: {
      title: "",
    },
    onSubmit: async ({ value }) => {
      setSubtaskValidationErrors({})
      createSubtaskMutation.mutate(
        {
          title: value.title.trim(),
          statusId: projectStatuses[0]?.id || "",
          type: "subtask",
          priority: "medium",
        },
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

  const [prevTaskRef, setPrevTaskRef] = useState<unknown>(null)
  if (task !== prevTaskRef) {
    setPrevTaskRef(task)
    if (task) {
      setLocalTitle(task.title || "")
      setLocalDesc(task.description || "")
    }
  }

  const [prevAssigneeState, setPrevAssigneeState] = useState<{ id?: string | null | number, members: ProjectMember[] }>({ id: undefined, members: [] })
  if (task?.assigneeId !== prevAssigneeState.id || projectMembers !== prevAssigneeState.members) {
    setPrevAssigneeState({ id: task?.assigneeId, members: projectMembers })
    if (task?.assigneeId) {
      const member = projectMembers.find(
        (m: ProjectMember) => m.user?.id === task.assigneeId
      )
      if (member) setAssigneeInputValue(member.user?.name || "")
      else setAssigneeInputValue("")
    } else {
      setAssigneeInputValue("")
    }
  }

  const filteredMembers = projectMembers.filter((m: ProjectMember) => {
    const selectedMember = projectMembers.find(
      (pm: ProjectMember) => pm.user?.id === task?.assigneeId
    )
    if (selectedMember && selectedMember.user?.name === assigneeInputValue)
      return true
    return m.user?.name?.toLowerCase().includes(assigneeInputValue.toLowerCase())
  })
  const showUnassigned =
    !assigneeInputValue ||
    "unassigned".includes(assigneeInputValue.toLowerCase()) ||
    (() => {
      const selectedMember = projectMembers.find(
        (pm: ProjectMember) => pm.user?.id === task?.assigneeId
      )
      return selectedMember && selectedMember.user?.name === assigneeInputValue
    })()

  const handleFieldChange = (field: string, value: unknown) => {
    updateTaskMutation.mutate({ [field]: value })
  }

  const handleCustomFieldChange = (fieldKey: string, value: unknown) => {
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
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isCompleted ? "secondary" : "outline"}
              size="sm"
              className="flex h-8 items-center gap-1.5 text-xs font-medium"
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
                className={isCompleted ? "fill-success/10 text-success" : ""}
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
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={copyTaskUrl} className="text-xs">
                  <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/${workspaceSlug}/projects/${projectId}`)
                  }
                  className="text-xs"
                >
                  <ArrowLeft className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Back to Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          {/* Left Columns (Main content) */}
          <div className="min-w-0 flex-1 space-y-8">
            {/* Title & Task ID */}
            <div className="space-y-1.5 px-0.5">
              <Input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="h-auto w-full rounded-lg border-transparent bg-transparent px-1.5 py-1 text-3xl font-bold tracking-tight text-foreground transition-all hover:bg-muted/20 focus:border-border/40 focus:bg-background focus:ring-0 focus:outline-none"
              />
              <div className="flex items-center gap-2 px-1.5 text-xs text-muted-foreground">
                <span>Task ID:</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  {task.id}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <FileText size={14} className="text-muted-foreground/70" />{" "}
                Description
              </label>
              <div className="px-0.5">
                <RichTextEditor
                  placeholder="Describe this task... (Use @ to mention, / for blocks, paste images)"
                  value={localDesc}
                  onChange={setLocalDesc}
                  onBlur={handleDescBlur}
                  projectMembers={editorProjectMembers}
                  minHeight="200px"
                />
              </div>
            </div>

            {/* Subtasks checklist */}
            <div className="space-y-4 border-t border-border/60 pt-6">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <CheckCircle2 size={14} className="text-muted-foreground/70" />{" "}
                Subtask Checklist
              </h3>
              <div className="space-y-1 pl-0.5">
                {task.subtasks?.map((subtask: Task) => {
                  const isSubtaskCompleted = subtask.statusId === completedStatus?.id;
                  const subtaskAssignee = projectMembers.find((m: ProjectMember) => m.user?.id === subtask.assigneeId)?.user;
                  return (
                  <div
                    key={subtask.id}
                    className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-1 items-center gap-2.5">
                      <Checkbox
                        checked={isSubtaskCompleted}
                        onCheckedChange={(checked) =>
                          updateSubtaskMutation.mutate({
                            id: subtask.id,
                            data: { 
                              statusId: checked ? completedStatus?.id : projectStatuses[0]?.id 
                            },
                          })
                        }
                        className="border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <button
                        type="button"
                        onClick={() => router.push(`/${workspaceSlug}/tasks/${subtask.id}`)}
                        className={`text-sm text-left ${isSubtaskCompleted ? "font-normal text-muted-foreground line-through" : "font-medium text-foreground hover:underline"}`}
                      >
                        {subtask.title}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [&:has([data-state=open])]:opacity-100" style={{ opacity: (subtask.assigneeId || subtask.dueDate) ? 1 : undefined }}>
                      {/* Subtask Assignee */}
                      <Popover>
                        <PopoverTrigger>
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border/50"
                            title="Assign to..."
                          >
                            {subtaskAssignee ? (
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={subtaskAssignee.image || ""} />
                                <AvatarFallback className="text-[9px]">
                                  {subtaskAssignee.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <UserPlus size={12} className="text-muted-foreground" />
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Search team..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No member found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => updateSubtaskMutation.mutate({ id: subtask.id, data: { assigneeId: null } })}
                                  className="text-xs"
                                >
                                  <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/50">
                                    <UserPlus size={10} className="text-muted-foreground/70" />
                                  </div>
                                  Unassigned
                                  {subtask.assigneeId === null && <CheckCircle2 size={12} className="ml-auto text-primary" />}
                                </CommandItem>
                                {projectMembers.filter((m: ProjectMember) => m.user).map((member: ProjectMember) => (
                                  <CommandItem
                                    key={member.id}
                                    onSelect={() => updateSubtaskMutation.mutate({ id: subtask.id, data: { assigneeId: member.user?.id } })}
                                    className="text-xs"
                                  >
                                    <Avatar className="mr-2 h-5 w-5">
                                      <AvatarImage src={member.user?.image || ""} />
                                      <AvatarFallback className="text-[9px]">
                                        {member.user?.name?.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {member.user?.name}
                                    {subtask.assigneeId === member.user?.id && <CheckCircle2 size={12} className="ml-auto text-primary" />}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Subtask Due Date */}
                      <Popover>
                        <PopoverTrigger>
                          <button
                            type="button"
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors border border-transparent hover:border-border/50 hover:bg-muted ${subtask.dueDate ? "text-foreground" : "text-muted-foreground"}`}
                            title="Set due date"
                          >
                            <CalendarIcon size={12} className={subtask.dueDate ? "text-primary" : ""} />
                            {subtask.dueDate ? format(new Date(subtask.dueDate), "MMM d") : ""}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                            onSelect={(date) => updateSubtaskMutation.mutate({ id: subtask.id, data: { dueDate: date?.toISOString() || null } })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <button
                        onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        title="Delete Subtask"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                )})}
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
                            className="h-8 flex-1 border border-border bg-background text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                            aria-invalid={hasError}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                            className="h-8 shrink-0 px-3 text-xs"
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
            <div className="space-y-6 border-t border-border/60 pt-6">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <MessageSquare size={14} className="text-muted-foreground/70" />{" "}
                Discussion / Comments
              </h3>

              <div className="flex flex-col gap-2">
                <RichTextEditor
                  placeholder="Write a comment... (Supports rich text, @mentions, /commands, paste images)"
                  value={newComment}
                  onChange={setNewComment}
                  projectMembers={editorProjectMembers}
                  minHeight="80px"
                  onSubmit={handleAddComment}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => handleAddComment()}
                    size="sm"
                    className="px-3 text-xs"
                  >
                    Post Comment
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {buildCommentThreads(task.comments || []).map(
                  (comment: Comment) => (
                    <CommentNode
                      key={comment.id}
                      comment={comment}
                      currentUser={currentUser}
                      projectMembers={editorProjectMembers}
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

            {/* Attachments */}
            <div className="space-y-4 border-t border-border/60 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  <Paperclip
                    size={14}
                    className="text-muted-foreground/70"
                  />{" "}
                  Attachments
                </h3>
                <div className="relative">
                  <Input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    title="Upload file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        uploadAttachmentMutation.mutate(e.target.files[0])
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" className="h-7 text-xs font-medium" disabled={uploadAttachmentMutation.isPending}>
                    {uploadAttachmentMutation.isPending ? "Uploading..." : "Add Attachment"}
                  </Button>
                </div>
              </div>
              {task?.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {task.attachments.map((attachment: any) => (
                    <div key={attachment.id} className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-muted/20 hover:bg-muted/40 transition">
                      <div className="flex flex-1 items-center justify-center p-4">
                        {attachment.mimeType?.startsWith("image/") ? (
                          <Image unoptimized src={attachment.url} alt={attachment.name} width={200} height={200} className="max-h-24 object-contain" />
                        ) : (
                          <FileText size={32} className="text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex items-center justify-between border-t border-border/60 bg-background/50 px-2 py-1.5 text-xs">
                        <span className="truncate pr-2 font-medium" title={attachment.name}>{attachment.name}</span>
                        <a href={attachment.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                          <Download size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No attachments yet. Click the button above to upload.
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="space-y-4 border-t border-border/60 pt-6">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <Activity size={14} className="text-muted-foreground/70" />{" "}
                Activity Feed
              </h3>
              <div className="space-y-3 pl-1">
                {task.activityLogs?.map((activity: TaskActivity) => (
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
                        {activity.user?.name}{" "}
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
          <div className="space-y-6 lg:w-[280px] lg:flex-shrink-0">
            {/* Group 1: Status, Assignee, Type, Priority */}
            <div className="space-y-3.5">
              <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                Properties
              </h3>
              <div className="grid grid-cols-[100px_1fr] items-center gap-x-2 gap-y-3 text-xs">
                {/* Status */}
                <span className="font-medium text-muted-foreground">
                  Status
                </span>
                <div>
                  <Combobox
                    value={
                      task.statusId
                        ? {
                            value: task.statusId,
                            label:
                              projectStatuses.find(
                                (s: TaskStatus) => s.id === task.statusId
                              )?.name || "",
                          }
                        : null
                    }
                    onValueChange={(val: string | null) =>
                      handleFieldChange("statusId", val?.value)
                    }
                    inputValue={statusInputValue}
                    onInputValueChange={setStatusInputValue}
                  >
                    <ComboboxInput
                      className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                      placeholder="Select status..."
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {projectStatuses.map((st: TaskStatus) => (
                          <ComboboxItem key={st.id}
                            value={st.id}
                          >
                            {st.name}
                          </ComboboxItem>
                        ))}
                        <ComboboxEmpty>No statuses found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Assignee */}
                <span className="font-medium text-muted-foreground">
                  Assignee
                </span>
                <div>
                  <Combobox
                    value={
                      task.assigneeId
                        ? {
                            value: task.assigneeId,
                            label:
                              projectMembers.find(
                                (m: ProjectMember) =>
                                  m.user?.id === task.assigneeId
                              )?.user?.name || "",
                          }
                        : null
                    }
                    onValueChange={(val: string | null) =>
                      handleFieldChange("assigneeId", val?.value || null)
                    }
                    inputValue={assigneeInputValue}
                    onInputValueChange={setAssigneeInputValue}
                  >
                    <ComboboxInput
                      className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                      placeholder="Select assignee..."
                    >
                      {task.assigneeId &&
                        (() => {
                          const member = projectMembers.find(
                            (m: ProjectMember) => m.user?.id === task.assigneeId
                          )
                          return member ? (
                            <InputGroupAddon align="inline-start">
                              <Avatar className="h-5 w-5 border border-border">
                                <AvatarImage src={member.user?.image || ""} />
                                <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                                  {member.user?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </InputGroupAddon>
                          ) : null
                        })()}
                    </ComboboxInput>
                    <ComboboxContent>
                      <ComboboxList>
                        {showUnassigned && (
                          <ComboboxItem value={""}
                          >
                            Unassigned
                          </ComboboxItem>
                        )}
                        {filteredMembers.map((m: ProjectMember) => (
                          <ComboboxItem key={m.user?.id}
                            value={m.user?.id}
                          >
                            <Avatar className="h-5 w-5 border border-border">
                              <AvatarImage src={m.user?.image || ""} />
                              <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                                {m.user?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {m.user?.name}
                          </ComboboxItem>
                        ))}
                        <ComboboxEmpty>No members found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Type */}
                <span className="font-medium text-muted-foreground">Type</span>
                <div>
                  <Combobox
                    value={
                      task.type
                        ? {
                            value: task.type,
                            label:
                              task.type === "bug"
                                ? "Bug (Defect)"
                                : task.type === "feature"
                                  ? "Feature"
                                  : "Task",
                          }
                        : null
                    }
                    onValueChange={(val: string | null) =>
                      handleFieldChange("type", val?.value)
                    }
                    inputValue={typeInputValue}
                    onInputValueChange={setTypeInputValue}
                  >
                    <ComboboxInput
                      className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                      placeholder="Select type..."
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        <ComboboxItem value={"task"}>
                          Task
                        </ComboboxItem>
                        <ComboboxItem value={"bug"}
                        >
                          Bug (Defect)
                        </ComboboxItem>
                        <ComboboxItem value={"feature"}
                        >
                          Feature
                        </ComboboxItem>
                        <ComboboxEmpty>No types found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Priority */}
                <span className="font-medium text-muted-foreground">
                  Priority
                </span>
                <div>
                  <Combobox
                    value={
                      task.priority
                        ? {
                            value: task.priority,
                            label:
                              task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1),
                          }
                        : null
                    }
                    onValueChange={(val: string | null) =>
                      handleFieldChange("priority", val?.value)
                    }
                    inputValue={priorityInputValue}
                    onInputValueChange={setPriorityInputValue}
                  >
                    <ComboboxInput
                      className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                      placeholder="Select priority..."
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        <ComboboxItem value={"low"}>
                          Low
                        </ComboboxItem>
                        <ComboboxItem value={"medium"}
                        >
                          Medium
                        </ComboboxItem>
                        <ComboboxItem value={"high"}>
                          High
                        </ComboboxItem>
                        <ComboboxItem value={"urgent"}
                        >
                          Urgent
                        </ComboboxItem>
                        <ComboboxEmpty>No priorities found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Group 2: Sprint, Estimate, Due Date */}
            <div className="space-y-3.5">
              <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                Planning
              </h3>
              <div className="grid grid-cols-[100px_1fr] items-center gap-x-2 gap-y-3 text-xs">
                {/* Sprint (Scrum Only) */}
                {projectTemplate === "scrum" && (
                  <>
                    <span className="font-medium text-muted-foreground">
                      Sprint
                    </span>
                    <div>
                      <Combobox
                        value={
                          task.sprintId
                            ? {
                                value: task.sprintId,
                                label:
                                  projectSprints.find(
                                    (s: Sprint) => s.id === task.sprintId
                                  )?.name || "",
                              }
                            : null
                        }
                        onValueChange={(val: string | null) =>
                          handleFieldChange("sprintId", val?.value || null)
                        }
                        inputValue={sprintInputValue}
                        onInputValueChange={setSprintInputValue}
                      >
                        <ComboboxInput
                          className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                          placeholder="Select sprint..."
                        />
                        <ComboboxContent>
                          <ComboboxList>
                            <ComboboxItem value={""}
                            >
                              Backlog
                            </ComboboxItem>
                            {projectSprints.map((sp: Sprint) => (
                              <ComboboxItem
                                key={sp.id}
                                value={{
                                  value: sp.id,
                                  label: `${sp.name} (${sp.status})`,
                                }}
                              >
                                {sp.name} ({sp.status})
                              </ComboboxItem>
                            ))}
                            <ComboboxEmpty>No sprints found</ComboboxEmpty>
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>
                  </>
                )}

                {/* Estimate */}
                {projectTemplate !== "simple" && (
                  <>
                    <span className="font-medium text-muted-foreground">
                      Estimate
                    </span>
                    <div>
                      <Input
                        type="number"
                        value={task.estimate ?? ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "estimate",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="h-8 w-full rounded-md border-transparent bg-transparent px-2 text-xs text-foreground transition-colors hover:border-border/50 hover:bg-muted/40 focus:border-border/80 focus:bg-background focus:outline-none"
                        placeholder="Estimate value..."
                      />
                    </div>
                  </>
                )}

                {/* Due Date */}
                <span className="font-medium text-muted-foreground">
                  Due Date
                </span>
                <div>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-8 w-full justify-start rounded-md border-transparent bg-transparent px-2 text-xs font-normal text-foreground transition-colors hover:border-border/50 hover:bg-muted/40 focus:border-border/80 focus:bg-background",
                            !task.dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
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
                        selected={
                          task.dueDate ? new Date(task.dueDate) : undefined
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
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Group 3: Epic, Milestone, Labels */}
            <div className="space-y-3.5">
              <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                Context
              </h3>
              <div className="grid grid-cols-[100px_1fr] items-center gap-x-2 gap-y-3 text-xs">
                {/* Epic */}
                <span className="font-medium text-muted-foreground">Epic</span>
                <div>
                  <Combobox
                    value={
                      task.epicId
                        ? {
                            value: task.epicId,
                            label:
                              projectEpics.find(
                                (e: Epic) => e.id === task.epicId
                              )?.title || "",
                          }
                        : { value: "", label: "No Epic" }
                    }
                    onValueChange={(val: string | null) =>
                      handleFieldChange("epicId", val?.value || null)
                    }
                    inputValue={epicInputValue}
                    onInputValueChange={setEpicInputValue}
                  >
                    <ComboboxInput
                      className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                      placeholder="Select epic..."
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        <ComboboxItem value={""}>
                          No Epic
                        </ComboboxItem>
                        {projectEpics.map((ep: Epic) => (
                          <ComboboxItem key={ep.id}
                            value={ep.id}
                          >
                            {ep.title}
                          </ComboboxItem>
                        ))}
                        <ComboboxEmpty>No epics found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Milestone */}
                <span className="font-medium text-muted-foreground">
                  Milestone
                </span>
                <div>
                  <Combobox
                    value={
                      task.milestoneId
                        ? {
                            value: task.milestoneId,
                            label:
                              projectMilestones.find(
                                (m: Milestone) => m.id === task.milestoneId
                              )?.title || "",
                          }
                        : { value: "", label: "No Milestone" }
                    }
                    onValueChange={(val: string | null) =>
                      handleFieldChange("milestoneId", val?.value || null)
                    }
                    inputValue={milestoneInputValue}
                    onInputValueChange={setMilestoneInputValue}
                  >
                    <ComboboxInput
                      className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                      placeholder="Select milestone..."
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        <ComboboxItem value={""}
                        >
                          No Milestone
                        </ComboboxItem>
                        {projectMilestones.map((ms: Milestone) => (
                          <ComboboxItem key={ms.id}
                            value={ms.id}
                          >
                            {ms.title}
                          </ComboboxItem>
                        ))}
                        <ComboboxEmpty>No milestones found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                {/* Labels */}
                <span className="font-medium text-muted-foreground">
                  Labels
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {projectLabels
                      .filter((lbl: Label) =>
                        (task.labels || []).some(
                          (tl: TaskLabel) => tl.labelId === lbl.id
                        )
                      )
                      .map((lbl: Label) => (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => {
                            const nextIds = (task.labels || [])
                              .map((tl: TaskLabel) => tl.labelId)
                              .filter((id: string) => id !== lbl.id)
                            handleFieldChange("labelIds", nextIds)
                          }}
                          className="group relative flex items-center gap-1 rounded border border-transparent px-2 py-0.5 text-[11px] font-semibold text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: lbl.color || "#3b82f6" }}
                          title="Click to remove"
                        >
                          <span>{lbl.name}</span>
                          <span className="text-[9px] opacity-60 transition-opacity group-hover:opacity-100">
                            ×
                          </span>
                        </button>
                      ))}

                    <Popover>
                      <PopoverTrigger
                        render={
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded border border-dashed border-border bg-transparent px-2 py-0.5 text-[11px] text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                          >
                            <Plus size={11} /> Add Label
                          </button>
                        }
                      />
                      <PopoverContent className="w-48 p-1.5" align="start">
                        <div className="mb-1 border-b border-border/50 px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                          Toggle Labels
                        </div>
                        <div className="max-h-48 space-y-0.5 overflow-y-auto">
                          {projectLabels.map((lbl: Label) => {
                            const isSelected = (task.labels || []).some(
                              (tl: TaskLabel) => tl.labelId === lbl.id
                            )
                            return (
                              <button
                                key={lbl.id}
                                type="button"
                                onClick={() => {
                                  const currentIds = (task.labels || []).map(
                                    (tl: TaskLabel) => tl.labelId
                                  )
                                  const nextIds = isSelected
                                    ? currentIds.filter(
                                        (id: string) => id !== lbl.id
                                      )
                                    : [...currentIds, lbl.id]
                                  handleFieldChange("labelIds", nextIds)
                                }}
                                className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-all hover:bg-muted"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: lbl.color }}
                                  />
                                  <span className="font-medium text-foreground">
                                    {lbl.name}
                                  </span>
                                </div>
                                {isSelected && (
                                  <span className="text-xs text-primary">
                                    ✓
                                  </span>
                                )}
                              </button>
                            )
                          })}
                          {projectLabels.length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                              No labels found.
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Fields Editor */}
            {customFieldDefinitions && customFieldDefinitions.length > 0 && (
              <>
                <div className="border-t border-border/50" />
                <div className="space-y-3.5">
                  <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                    Custom Fields
                  </h3>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-x-2 gap-y-3 text-xs">
                    {customFieldDefinitions.map((fieldDef: CustomFieldDefinition) => {
                      const fieldValue = task.customFields?.[fieldDef.id] ?? ""
                      return (
                        <React.Fragment key={fieldDef.id}>
                          <span
                            className="truncate font-medium text-muted-foreground"
                            title={fieldDef.name}
                          >
                            {fieldDef.name}
                          </span>
                          <div>
                            {fieldDef.type === "checkbox" ? (
                              <div className="flex items-center gap-2 pl-2">
                                <Checkbox
                                  checked={!!fieldValue}
                                  onCheckedChange={(checked) =>
                                    handleCustomFieldChange(
                                      fieldDef.id,
                                      !!checked
                                    )
                                  }
                                  className="border-border"
                                />
                                <span className="text-xs text-muted-foreground">
                                  Yes
                                </span>
                              </div>
                            ) : fieldDef.type === "select" ? (
                              <Combobox
                                value={
                                  fieldValue
                                    ? { value: fieldValue, label: fieldValue }
                                    : null
                                }
                                onValueChange={(val: string | null) =>
                                  handleCustomFieldChange(
                                    fieldDef.id,
                                    val?.value || ""
                                  )
                                }
                              >
                                <ComboboxInput
                                  className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                                  placeholder="Choose option..."
                                />
                                <ComboboxContent>
                                  <ComboboxList>
                                    {(fieldDef.options as unknown as string[])?.map((opt: string) => (
                                      <ComboboxItem key={opt}
                                        value={opt}
                                      >
                                        {opt}
                                      </ComboboxItem>
                                    ))}
                                    <ComboboxEmpty>
                                      No options found
                                    </ComboboxEmpty>
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
                                          ? new Date(
                                              e.target.value
                                            ).toISOString()
                                          : ""
                                        : e.target.value
                                  )
                                }
                                className="h-8 w-full rounded-md border-transparent bg-transparent px-2 text-xs text-foreground transition-colors hover:border-border/50 hover:bg-muted/40 focus:border-border/80 focus:bg-background focus:outline-none"
                              />
                            )}
                          </div>
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const formatActivityText = (activity: TaskActivity) => {
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
}: {
  commentId: string
  emoji: string
  count: number
  hasReacted: boolean
  onToggle: (emoji: string) => void
  togglePending: boolean
}) => {
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
                {users?.map((u: User) => (
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
  comment: Comment
  currentUser: { user?: { id?: string | number } | null } | undefined | null
  projectMembers: { user: { id: string; name?: string; image?: string | null | undefined; email?: string | undefined } }[]
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
  deleteCommentMutation: { mutate: (id: string) => void }
  toggleReactionMutation: { mutate: (variables: { commentId: string; emoji: string }) => void; isPending: boolean; variables?: { emoji: string } }
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const { resolvedTheme, theme } = useTheme()
  const isDarkMode = resolvedTheme === "dark" || theme === "dark"

  // Group reactions by emoji
  const reactionGroups = (comment.reactions || []).reduce(
    (acc: Record<string, CommentReaction[]>, reaction: CommentReaction) => {
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
        className="group relative flex gap-3 py-2"
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

        <Avatar className="mt-0.5 h-8 w-8 flex-shrink-0 border border-border">
          <AvatarImage src={comment.user?.image || ""} />
          <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
            {comment.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between">
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
                className="ProseMirror mb-1.5 max-w-full overflow-hidden text-xs leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
              {/* Actions bar inside comment card */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToCommentId(comment.id)
                    setReplyContent("")
                  }}
                  className="text-[10px] font-semibold text-muted-foreground transition-colors hover:text-primary"
                >
                  Reply
                </button>
                {comment.userId === currentUser?.user?.id && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(comment.id)
                        setEditingContent(comment.content)
                      }}
                      className="text-[10px] font-semibold text-muted-foreground transition-colors hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-[10px] font-semibold text-muted-foreground transition-colors hover:text-destructive"
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
              {Object.entries(reactionGroups).map(
                ([emoji, reactions]: [string, CommentReaction[]]) => {
                  const hasReacted = reactions.some(
                    (r: CommentReaction) => r.userId === currentUser?.user?.id
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
          {comment.replies.map((reply: Comment) => (
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

const buildCommentThreads = (comments: Comment[]) => {
  if (!comments) return []
  const commentMap = new Map()
  const roots: Comment[] = []

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
    root.replies?.sort(
      (a: Comment, b: Comment) =>
        new Date(a.createdAt as string).getTime() -
        new Date(b.createdAt as string).getTime()
    )
  })

  return roots
}
