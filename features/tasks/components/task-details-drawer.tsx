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
  useReactionUsers,
} from "../hooks/use-tasks"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
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
  MoreHorizontal,
} from "lucide-react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

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
  const [statusInputValue, setStatusInputValue] = useState("")
  const [sprintInputValue, setSprintInputValue] = useState("")
  const [typeInputValue, setTypeInputValue] = useState("")
  const [priorityInputValue, setPriorityInputValue] = useState("")
  const [epicInputValue, setEpicInputValue] = useState("")
  const [milestoneInputValue, setMilestoneInputValue] = useState("")
  const [customFieldInputValues, setCustomFieldInputValues] = useState<
    Record<string, string>
  >({})
  const [depDirectionInputValue, setDepDirectionInputValue] = useState("")
  const [depProjectInputValue, setDepProjectInputValue] = useState("")
  const [depTaskInputValue, setDepTaskInputValue] = useState("")

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
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
          <div>
            <SheetTitle className="text-sm font-semibold text-muted-foreground">
              Task Details
            </SheetTitle>
          </div>
          {task && (
            <div className="flex items-center gap-2 pr-6">
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
                  <DropdownMenuItem
                    onClick={async () => {
                      const url = `${window.location.origin}/${activeWorkspace?.slug}/tasks/${task.id}`
                      await navigator.clipboard.writeText(url)
                      toast.success("Task link copied to clipboard")
                    }}
                    className="text-xs"
                  >
                    <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      window.open(
                        `/${activeWorkspace?.slug}/tasks/${task.id}`,
                        "_blank"
                      )
                    }}
                    className="text-xs"
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    Open Page
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <div className="space-y-8">
                {/* Title & Task ID */}
                <div className="space-y-1.5 px-0.5">
                  <Input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="h-auto w-full rounded-lg border-transparent bg-transparent px-1.5 py-1 text-2xl font-bold tracking-tight text-foreground transition-all hover:bg-muted/20 focus:border-border/40 focus:bg-background focus:ring-0 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 px-1.5 text-xs text-muted-foreground">
                    <span>Task ID:</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                      {task?.id}
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
                      projectMembers={projectMembers}
                      minHeight="150px"
                    />
                  </div>
                </div>

                {/* Checklist / Subtasks */}
                <div className="space-y-4 border-t border-border/60 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    <CheckCircle2
                      size={14}
                      className="text-muted-foreground/70"
                    />{" "}
                    Subtask Checklist
                  </label>
                  <div className="space-y-1 pl-0.5">
                    {task?.subtasks?.map((subtask: LooseRecord) => (
                      <div
                        key={subtask.id}
                        className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30"
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
                            className={`text-sm ${subtask.isCompleted ? "font-normal text-muted-foreground line-through" : "font-medium text-foreground"}`}
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
                      placeholder="Add a subtask..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="h-8 flex-1 border border-border bg-background text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      className="h-8 px-3 text-xs"
                    >
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                  </form>
                </div>

                {/* Task Dependencies Section */}
                <div className="space-y-4 border-t border-border/60 pt-6">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      <AlertTriangle size={14} className="text-warning/80" />{" "}
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
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">
                            Relationship
                          </label>
                          <Combobox
                            value={
                              depDirection
                                ? {
                                    value: depDirection,
                                    label:
                                      depDirection === "blocked_by"
                                        ? "is blocked by"
                                        : "blocks",
                                  }
                                : null
                            }
                            onValueChange={(val: any) =>
                              setDepDirection(
                                val?.value as "blocks" | "blocked_by"
                              )
                            }
                            inputValue={depDirectionInputValue}
                            onInputValueChange={setDepDirectionInputValue}
                          >
                            <ComboboxInput
                              className="flex h-8 w-full items-center rounded border border-border bg-card text-xs text-foreground"
                              placeholder="Select relationship..."
                            />
                            <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                              <ComboboxList className="max-h-56 overflow-y-auto">
                                <ComboboxItem
                                  value={{
                                    value: "blocked_by",
                                    label: "is blocked by",
                                  }}
                                >
                                  is blocked by
                                </ComboboxItem>
                                <ComboboxItem
                                  value={{ value: "blocks", label: "blocks" }}
                                >
                                  blocks
                                </ComboboxItem>
                                <ComboboxEmpty>No options found</ComboboxEmpty>
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">
                            Project
                          </label>
                          <Combobox
                            value={
                              targetProjectId
                                ? {
                                    value: targetProjectId,
                                    label:
                                      projects.find(
                                        (p: LooseRecord) =>
                                          p.id === targetProjectId
                                      )?.title +
                                        (targetProjectId === projectId
                                          ? " (Current)"
                                          : "") || "",
                                  }
                                : null
                            }
                            onValueChange={(val: any) => {
                              setTargetProjectId(val?.value || projectId)
                              setTargetTaskId("")
                            }}
                            inputValue={depProjectInputValue}
                            onInputValueChange={setDepProjectInputValue}
                          >
                            <ComboboxInput
                              className="flex h-8 w-full items-center rounded border border-border bg-card text-xs text-foreground"
                              placeholder="Select project..."
                            />
                            <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                              <ComboboxList className="max-h-56 overflow-y-auto">
                                {projects.map((p: LooseRecord) => (
                                  <ComboboxItem
                                    key={p.id}
                                    value={{
                                      value: p.id,
                                      label:
                                        p.title +
                                        (p.id === projectId
                                          ? " (Current)"
                                          : ""),
                                    }}
                                  >
                                    {p.title}{" "}
                                    {p.id === projectId ? "(Current)" : ""}
                                  </ComboboxItem>
                                ))}
                                <ComboboxEmpty>No projects found</ComboboxEmpty>
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Target Task
                        </label>
                        <Combobox
                          value={
                            targetTaskId
                              ? {
                                  value: targetTaskId,
                                  label:
                                    availableTasks.find(
                                      (t: LooseRecord) => t.id === targetTaskId
                                    )?.title || "",
                                }
                              : null
                          }
                          onValueChange={(val: any) =>
                            setTargetTaskId(val?.value || "")
                          }
                          inputValue={depTaskInputValue}
                          onInputValueChange={setDepTaskInputValue}
                        >
                          <ComboboxInput
                            className="flex h-8 w-full items-center rounded border border-border bg-card text-xs text-foreground"
                            placeholder="Select task..."
                          />
                          <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                            <ComboboxList className="max-h-56 overflow-y-auto">
                              {availableTasks.map((t: LooseRecord) => (
                                <ComboboxItem
                                  key={t.id}
                                  value={{
                                    value: t.id,
                                    label: `${t.title} (${t.priority})`,
                                  }}
                                >
                                  {t.title} ({t.priority})
                                </ComboboxItem>
                              ))}
                              <ComboboxEmpty>No tasks found</ComboboxEmpty>
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
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
                          <span className="bg-info/10 text-info flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase">
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
                        <p className="pl-1 text-xs text-muted-foreground italic">
                          No linked issues.
                        </p>
                      )}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-6 border-t border-border/60 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    <MessageSquare
                      size={14}
                      className="text-muted-foreground/70"
                    />{" "}
                    Discussion / Comments
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
                        className="px-3 text-xs"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
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
                <div className="space-y-4 border-t border-border/60 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    <Activity size={14} className="text-muted-foreground/70" />{" "}
                    Activity Feed
                  </label>
                  <div className="space-y-3 pl-1">
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
            </ScrollArea>

            {/* Right Side Settings Panel */}
            <div className="h-full w-[280px] flex-shrink-0 space-y-6 overflow-y-auto bg-background p-5">
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
                        task?.statusId
                          ? {
                              value: task.statusId,
                              label:
                                projectStatuses.find(
                                  (s: LooseRecord) => s.id === task.statusId
                                )?.name || "",
                            }
                          : null
                      }
                      onValueChange={(val: any) =>
                        handleFieldChange("statusId", val?.value)
                      }
                      inputValue={statusInputValue}
                      onInputValueChange={setStatusInputValue}
                    >
                      <ComboboxInput
                        className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                        placeholder="Select status..."
                      />
                      <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                        <ComboboxList className="max-h-56 overflow-y-auto">
                          {projectStatuses.map((st: LooseRecord) => (
                            <ComboboxItem
                              key={st.id}
                              value={{ value: st.id, label: st.name }}
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
                      value={comboboxValue}
                      onValueChange={(val: any) =>
                        handleFieldChange(
                          "assigneeId",
                          val?.value === "unassigned"
                            ? null
                            : val?.value || null
                        )
                      }
                      inputValue={assigneeInputValue}
                      onInputValueChange={setAssigneeInputValue}
                      isItemEqualToValue={(a: any, b: any) =>
                        a?.value === b?.value
                      }
                    >
                      <ComboboxInput
                        className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
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
                              value={{
                                value: "unassigned",
                                label: "Unassigned",
                              }}
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

                  {/* Type */}
                  <span className="font-medium text-muted-foreground">
                    Type
                  </span>
                  <div>
                    <Combobox
                      value={
                        task?.type
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
                      onValueChange={(val: any) =>
                        handleFieldChange("type", val?.value)
                      }
                      inputValue={typeInputValue}
                      onInputValueChange={setTypeInputValue}
                    >
                      <ComboboxInput
                        className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                        placeholder="Select type..."
                      />
                      <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                        <ComboboxList className="max-h-56 overflow-y-auto">
                          <ComboboxItem
                            value={{ value: "task", label: "Task" }}
                          >
                            Task
                          </ComboboxItem>
                          <ComboboxItem
                            value={{ value: "bug", label: "Bug (Defect)" }}
                          >
                            Bug (Defect)
                          </ComboboxItem>
                          <ComboboxItem
                            value={{ value: "feature", label: "Feature" }}
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
                        task?.priority
                          ? {
                              value: task.priority,
                              label:
                                task.priority.charAt(0).toUpperCase() +
                                task.priority.slice(1),
                            }
                          : null
                      }
                      onValueChange={(val: any) =>
                        handleFieldChange("priority", val?.value)
                      }
                      inputValue={priorityInputValue}
                      onInputValueChange={setPriorityInputValue}
                    >
                      <ComboboxInput
                        className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                        placeholder="Select priority..."
                      />
                      <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                        <ComboboxList className="max-h-56 overflow-y-auto">
                          <ComboboxItem value={{ value: "low", label: "Low" }}>
                            Low
                          </ComboboxItem>
                          <ComboboxItem
                            value={{ value: "medium", label: "Medium" }}
                          >
                            Medium
                          </ComboboxItem>
                          <ComboboxItem
                            value={{ value: "high", label: "High" }}
                          >
                            High
                          </ComboboxItem>
                          <ComboboxItem
                            value={{ value: "urgent", label: "Urgent" }}
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
                            task?.sprintId
                              ? {
                                  value: task.sprintId,
                                  label:
                                    projectSprints.find(
                                      (s: LooseRecord) => s.id === task.sprintId
                                    )?.name || "",
                                }
                              : { value: "", label: "Backlog" }
                          }
                          onValueChange={(val: any) =>
                            handleFieldChange("sprintId", val?.value || null)
                          }
                          inputValue={sprintInputValue}
                          onInputValueChange={setSprintInputValue}
                        >
                          <ComboboxInput
                            className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                            placeholder="Select sprint..."
                          />
                          <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                            <ComboboxList className="max-h-56 overflow-y-auto">
                              <ComboboxItem
                                value={{ value: "", label: "Backlog" }}
                              >
                                Backlog
                              </ComboboxItem>
                              {projectSprints.map((sp: LooseRecord) => (
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
                          value={task?.estimate ?? ""}
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
                              !task?.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
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
                  <span className="font-medium text-muted-foreground">
                    Epic
                  </span>
                  <div>
                    <Combobox
                      value={
                        task?.epicId
                          ? {
                              value: task.epicId,
                              label:
                                projectEpics.find(
                                  (e: LooseRecord) => e.id === task.epicId
                                )?.title || "",
                            }
                          : { value: "", label: "No Epic" }
                      }
                      onValueChange={(val: any) =>
                        handleFieldChange("epicId", val?.value || null)
                      }
                      inputValue={epicInputValue}
                      onInputValueChange={setEpicInputValue}
                    >
                      <ComboboxInput
                        className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                        placeholder="Select epic..."
                      />
                      <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                        <ComboboxList className="max-h-56 overflow-y-auto">
                          <ComboboxItem value={{ value: "", label: "No Epic" }}>
                            No Epic
                          </ComboboxItem>
                          {projectEpics.map((ep: LooseRecord) => (
                            <ComboboxItem
                              key={ep.id}
                              value={{ value: ep.id, label: ep.title }}
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
                        task?.milestoneId
                          ? {
                              value: task.milestoneId,
                              label:
                                projectMilestones.find(
                                  (m: LooseRecord) => m.id === task.milestoneId
                                )?.title || "",
                            }
                          : { value: "", label: "No Milestone" }
                      }
                      onValueChange={(val: any) =>
                        handleFieldChange("milestoneId", val?.value || null)
                      }
                      inputValue={milestoneInputValue}
                      onInputValueChange={setMilestoneInputValue}
                    >
                      <ComboboxInput
                        className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                        placeholder="Select milestone..."
                      />
                      <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                        <ComboboxList className="max-h-56 overflow-y-auto">
                          <ComboboxItem
                            value={{ value: "", label: "No Milestone" }}
                          >
                            No Milestone
                          </ComboboxItem>
                          {projectMilestones.map((ms: LooseRecord) => (
                            <ComboboxItem
                              key={ms.id}
                              value={{ value: ms.id, label: ms.title }}
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
                        .filter((lbl) =>
                          (task?.labels || []).some(
                            (tl: LooseRecord) => tl.labelId === lbl.id
                          )
                        )
                        .map((lbl: LooseRecord) => (
                          <button
                            key={lbl.id}
                            type="button"
                            onClick={() => {
                              const currentIds = (task?.labels || []).map(
                                (tl: LooseRecord) => tl.labelId
                              )
                              const nextIds = currentIds.filter(
                                (id: string) => id !== lbl.id
                              )
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
                            {projectLabels.map((lbl: LooseRecord) => {
                              const isSelected = (task?.labels || []).some(
                                (tl: LooseRecord) => tl.labelId === lbl.id
                              )
                              return (
                                <button
                                  key={lbl.id}
                                  type="button"
                                  onClick={() => {
                                    const currentIds = (task?.labels || []).map(
                                      (tl: LooseRecord) => tl.labelId
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
                      {customFieldDefinitions.map((fieldDef: LooseRecord) => {
                        const fieldValue =
                          task?.customFields?.[fieldDef.id] ?? ""
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
                                  onValueChange={(val: any) =>
                                    handleCustomFieldChange(
                                      fieldDef.id,
                                      val?.value || ""
                                    )
                                  }
                                  inputValue={
                                    customFieldInputValues[fieldDef.id] || ""
                                  }
                                  onInputValueChange={(v: string) =>
                                    setCustomFieldInputValues((prev) => ({
                                      ...prev,
                                      [fieldDef.id]: v,
                                    }))
                                  }
                                >
                                  <ComboboxInput
                                    className="flex h-8 w-full items-center rounded border-transparent bg-transparent px-2 text-xs text-foreground transition-colors focus-within:border-border/80 focus-within:bg-background hover:border-border/50 hover:bg-muted/40 focus:outline-none"
                                    placeholder="Choose option..."
                                  />
                                  <ComboboxContent className="w-full rounded-lg border border-border bg-card shadow-lg">
                                    <ComboboxList className="max-h-56 overflow-y-auto">
                                      {fieldDef.options?.map((opt: string) => (
                                        <ComboboxItem
                                          key={opt}
                                          value={{ value: opt, label: opt }}
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
                                      ? format(
                                          new Date(fieldValue),
                                          "yyyy-MM-dd"
                                        )
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
                {comment.user?.id === currentUser?.user?.id && (
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
