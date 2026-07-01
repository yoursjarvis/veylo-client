"use client"

import { format } from "date-fns"
import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  useCreateStatus,
  useCreateTask,
  useUpdateStatus,
  useUpdateTask,
  useUpdateTaskOrder,
} from "../hooks/use-tasks"

import { Badge } from "@/components/reui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Add01Icon,
  ArrowRight01Icon,
  AttachmentSquareIcon,
  Bug01Icon,
  CheckIcon,
  CheckmarkSquare03Icon,
  ChevronDownIcon,
  Clock05Icon,
  Edit03Icon,
  Message01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface Task {
  id: string
  taskKey?: string
  sprintId: string | null
  statusId: string
  type: string
  title: string
  priority: string
  estimate?: number
  dueDate?: string
  assignee?: { name?: string; image?: string }
  assignees?: { name?: string; image?: string }[]
  position?: number
  coverImage?: string
  commentCount?: number
  attachmentCount?: number
  subtaskCount?: number
  subtasks?: Task[]
  parentTaskId?: string | null
}

interface TaskBoardProps {
  projectId: string
  tasks: Task[]
  statuses: { id: string; name: string }[]
  projectMembers: Record<string, unknown>[]
  sprints: Record<string, unknown>[]
  projectTemplate: string
  activeSprintId?: string | null
  onSelectTask: (taskId: string) => void
}

const getPriorityBadge = (prio: string) => {
  const baseClasses =
    "rounded-md px-2 py-1 text-xs font-medium leading-none capitalize flex items-center justify-center border-none"
  switch (prio) {
    case "urgent":
      return (
        <Badge
          variant="outline"
          className={cn(
            baseClasses,
            "bg-red-500/10 text-red-600 dark:text-red-400"
          )}
        >
          Urgent
        </Badge>
      )
    case "high":
      return (
        <Badge
          variant="outline"
          className={cn(
            baseClasses,
            "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          High
        </Badge>
      )
    case "medium":
      return (
        <Badge
          variant="outline"
          className={cn(
            baseClasses,
            "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          )}
        >
          Medium
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className={cn(
            baseClasses,
            "bg-slate-500/10 text-slate-600 dark:text-slate-400"
          )}
        >
          Low
        </Badge>
      )
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "bug":
      return <HugeiconsIcon icon={Bug01Icon} className="h-4 w-4 text-red-500" />
    case "feature":
      return (
        <HugeiconsIcon
          icon={SparklesIcon}
          className="h-4 w-4 text-violet-500"
        />
      )
    case "task":
      return (
        <HugeiconsIcon
          icon={CheckmarkSquare03Icon}
          strokeWidth={2}
          className="h-4 w-4 text-blue-500"
        />
      )
    default:
      return (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="h-4 w-4 text-muted-foreground"
        />
      )
  }
}

function SubtaskItem({
  subtask,
  projectId,
  statuses,
  completedStatus,
  onSelectTask,
}: {
  subtask: Task
  projectId: string
  statuses: { id: string; name: string }[]
  completedStatus?: { id: string }
  onSelectTask?: (id: string) => void
}) {
  const updateSubtaskMutation = useUpdateTask(projectId, subtask.id)
  const isCompleted = subtask.statusId === completedStatus?.id

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!completedStatus) return
    const newStatusId = isCompleted ? statuses[0].id : completedStatus.id
    updateSubtaskMutation.mutate({ statusId: newStatusId })
  }

  return (
    <div
      className="group/subtask flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
      onClick={(e) => {
        e.stopPropagation()
        onSelectTask?.(subtask.id)
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
          isCompleted
            ? "border-success bg-success text-success-foreground"
            : "border-muted-foreground/30 bg-background text-transparent hover:border-success/50 hover:text-success/30"
        )}
      >
        <HugeiconsIcon icon={CheckIcon} size={10} strokeWidth={3.5} />
      </button>
      <span
        className={cn(
          "line-clamp-1 flex-1 text-sm font-medium transition-colors",
          isCompleted
            ? "text-muted-foreground/60 line-through decoration-muted-foreground/40"
            : "text-foreground/90 group-hover/subtask:text-foreground"
        )}
      >
        {subtask.title}
      </span>

      <div className="flex shrink-0 items-center gap-3">
        {subtask.dueDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Clock05Icon} className="h-4 w-4" />
            <span>{format(new Date(subtask.dueDate), "MMM d")}</span>
          </div>
        )}

        {subtask.assignee && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={subtask.assignee.image || ""} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {subtask.assignee.name
                ? subtask.assignee.name.charAt(0).toUpperCase()
                : "-"}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}

function TaskCard({
  task,
  projectId,
  statuses,
  isDragging,
  onSelectTask,
}: {
  task: Task
  projectId: string
  statuses: { id: string; name: string }[]
  isDragging?: boolean
  onSelectTask?: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const updateTaskMutation = useUpdateTask(projectId, task.id)

  const completedStatus = statuses.find(
    (st) =>
      st.name.toLowerCase() === "done" ||
      st.name.toLowerCase() === "completed" ||
      st.name.toLowerCase() === "closed"
  )
  const isCompleted = completedStatus && task.statusId === completedStatus.id

  const totalSubtasks = task.subtasks?.length || task.subtaskCount || 0
  const completedSubtasks =
    task.subtasks?.filter((st) => st.statusId === completedStatus?.id).length ||
    0
  const subtaskDisplay =
    task.subtasks && task.subtasks.length > 0
      ? `${completedSubtasks}/${totalSubtasks}`
      : totalSubtasks

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      const len = inputRef.current.value.length
      inputRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditedTitle(task.title)
  }

  const handleSave = () => {
    if (editedTitle.trim() !== task.title && editedTitle.trim() !== "") {
      updateTaskMutation.mutate({ title: editedTitle.trim() })
    } else {
      setEditedTitle(task.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      setEditedTitle(task.title)
      setIsEditing(false)
    }
  }

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!completedStatus) return
    const newStatusId = isCompleted ? statuses[0].id : completedStatus.id
    updateTaskMutation.mutate({ statusId: newStatusId })
  }

  return (
    <div
      onClick={(e) => {
        if (!isEditing && onSelectTask) {
          onSelectTask(task.id)
        }
      }}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-200",
        "hover:-translate-y-1 hover:border-border hover:shadow-md",
        isDragging ? "opacity-0" : "opacity-100",
        !isEditing ? "cursor-pointer active:cursor-grabbing" : "cursor-default"
      )}
    >
      {!isEditing && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEditClick}
          className="absolute top-3 right-3 z-10 h-7 w-7 bg-background/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 hover:bg-muted"
        >
          <HugeiconsIcon
            icon={Edit03Icon}
            size={14}
            className="text-muted-foreground"
          />
        </Button>
      )}

      {task.coverImage && (
        <div className="mb-3 w-full overflow-hidden rounded-lg border border-border/40">
          <img
            src={task.coverImage}
            alt="Cover"
            className="h-28 w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium tracking-wider text-muted-foreground">
            {task.taskKey || task.id.substring(0, 8)}
          </span>
        </div>

        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={handleToggleComplete}
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
              isCompleted
                ? "border-success bg-success text-success-foreground"
                : "border-muted-foreground/30 bg-background text-transparent hover:border-success/50 hover:text-success/30"
            )}
          >
            <HugeiconsIcon icon={CheckIcon} size={10} strokeWidth={3.5} />
          </button>

          {isEditing ? (
            <div onClick={(e) => e.stopPropagation()} className="flex-1">
              <textarea
                ref={inputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                rows={2}
                className="w-full resize-none border-none bg-transparent p-0 text-base font-semibold text-foreground focus:ring-0 focus:outline-none"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="flex-1 pr-5">
              <span
                className={cn(
                  "line-clamp-2 text-base font-semibold transition-colors",
                  isCompleted
                    ? "text-muted-foreground line-through decoration-muted-foreground/50"
                    : "text-foreground"
                )}
              >
                {task.title}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {getPriorityBadge(task.priority)}
        
        {task.dueDate && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <HugeiconsIcon
              icon={Clock05Icon}
              className="h-3.5 w-3.5 text-muted-foreground"
              strokeWidth={1.5}
            />
            <span>{format(new Date(task.dueDate), "MMM d")}</span>
          </div>
        )}

        <div className="ml-auto flex items-center">
          {task.assignees && task.assignees.length > 0 ? (
            <div className="flex -space-x-1.5 overflow-hidden p-1">
              {task.assignees.slice(0, 3).map((assignee, idx) => (
                <Avatar
                  key={idx}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-card transition-transform hover:z-10 hover:scale-110"
                >
                  <AvatarImage src={assignee.image || ""} />
                  <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                    {assignee.name
                      ? assignee.name.charAt(0).toUpperCase()
                      : "-"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assignees.length > 3 && (
                <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card transition-transform hover:z-20 hover:scale-110">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          ) : task.assignee ? (
            <div className="p-1">
              <Avatar className="h-6 w-6 ring-2 ring-card transition-transform hover:scale-110">
                <AvatarImage src={task.assignee.image || ""} />
                <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                  {task.assignee.name
                    ? task.assignee.name.charAt(0).toUpperCase()
                    : "-"}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-col border-t border-border/40 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-muted-foreground">
            {task.commentCount !== undefined && task.commentCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-foreground">
                <HugeiconsIcon
                  icon={Message01Icon}
                  size={14}
                  className="text-muted-foreground/70"
                />
                <span>{task.commentCount}</span>
              </div>
            )}

            {task.attachmentCount !== undefined && task.attachmentCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-foreground">
                <HugeiconsIcon
                  icon={AttachmentSquareIcon}
                  size={14}
                  className="text-muted-foreground/70"
                />
                <span>{task.attachmentCount}</span>
              </div>
            )}

            {totalSubtasks > 0 && (
              <div
                className={cn(
                  "-ml-1.5 flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted",
                  isSubtasksExpanded
                    ? "bg-muted/50 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsSubtasksExpanded(!isSubtasksExpanded)
                }}
              >
                <HugeiconsIcon
                  icon={CheckmarkSquare03Icon}
                  size={14}
                  className={
                    isSubtasksExpanded
                      ? "text-primary"
                      : "text-muted-foreground/70"
                  }
                />
                <span>{subtaskDisplay}</span>
                <HugeiconsIcon
                  icon={ChevronDownIcon}
                  size={14}
                  strokeWidth={3}
                  className={cn(
                    "transition-transform",
                    isSubtasksExpanded && "rotate-180"
                  )}
                />
              </div>
            )}
            
            {task.estimate !== undefined && (
              <div className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-foreground">
                 <span>Est: {task.estimate}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center">
             {getTypeIcon(task.type)}
          </div>
        </div>

        {isSubtasksExpanded && task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-3 flex flex-col gap-1 rounded-xl bg-muted/30 p-2">
            {task.subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                projectId={projectId}
                statuses={statuses}
                completedStatus={completedStatus}
                onSelectTask={onSelectTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SortableTaskCard({
  task,
  projectId,
  statuses,
  onSelectTask,
}: {
  task: Task
  projectId: string
  statuses: { id: string; name: string }[]
  onSelectTask: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative rounded-xl outline-none touch-none",
        isDragging &&
          "z-50 border-2 border-dashed border-primary/40 bg-muted/60 shadow-inner"
      )}
    >
      <TaskCard
        task={task}
        projectId={projectId}
        statuses={statuses}
        onSelectTask={onSelectTask}
        isDragging={isDragging}
      />
    </div>
  )
}

interface BoardColumnProps {
  projectId: string
  statuses: { id: string; name: string }[]
  status: { id: string; name: string }
  tasks: Task[]
  quickAddStatusId: string | null
  quickAddTitle: string
  setQuickAddStatusId: (id: string | null) => void
  setQuickAddTitle: (title: string) => void
  handleQuickAddSubmit: (e: React.FormEvent, statusId: string) => void
  onSelectTask: (id: string) => void
}

function BoardColumn({
  projectId,
  statuses,
  status,
  tasks,
  quickAddStatusId,
  quickAddTitle,
  setQuickAddStatusId,
  setQuickAddTitle,
  handleQuickAddSubmit,
  onSelectTask,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { type: "Column", status },
  })

  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [editedStatusName, setEditedStatusName] = useState(status.name)
  const updateStatusMutation = useUpdateStatus(projectId)

  useEffect(() => {
    setEditedStatusName(status.name)
  }, [status.name])

  const handleStatusSave = () => {
    if (
      editedStatusName.trim() !== status.name &&
      editedStatusName.trim() !== ""
    ) {
      updateStatusMutation.mutate({
        id: status.id,
        data: { name: editedStatusName.trim() },
      })
    } else {
      setEditedStatusName(status.name)
    }
    setIsEditingStatus(false)
  }

  const handleStatusKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStatusSave()
    } else if (e.key === "Escape") {
      setEditedStatusName(status.name)
      setIsEditingStatus(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full max-h-[75vh] w-72 shrink-0 flex-col rounded-2xl border bg-secondary/20 p-3.5 shadow-sm backdrop-blur-md transition-colors duration-200 lg:w-80",
        isOver ? "border-primary/40 bg-primary/5" : "border-border/60"
      )}
    >
      <div className="mb-4 mt-0.5 flex items-center justify-between px-1.5">
        <div className="flex items-center gap-2.5">
          {isEditingStatus ? (
            <input
              autoFocus
              value={editedStatusName}
              onChange={(e) => setEditedStatusName(e.target.value)}
              onBlur={handleStatusSave}
              onKeyDown={handleStatusKeyDown}
              className="w-full border-none bg-transparent p-0 text-sm font-semibold tracking-tight text-foreground focus:ring-0 focus:outline-none"
            />
          ) : (
            <span
              onClick={() => setIsEditingStatus(true)}
              className="cursor-text text-sm font-semibold tracking-tight text-foreground/90 transition-colors hover:text-primary"
            >
              {status.name}
            </span>
          )}
          <Badge className="bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuickAddStatusId(status.id)}
          className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
        </Button>
      </div>

      {quickAddStatusId === status.id && (
        <form
          onSubmit={(e) => handleQuickAddSubmit(e, status.id)}
          className="mb-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm"
        >
          <Input
            autoFocus
            placeholder="What needs to be done?"
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            className="h-9 border-none bg-transparent px-1 py-1 text-[13px] text-foreground placeholder-muted-foreground/60 shadow-none focus-visible:ring-0"
          />
          <div className="mt-2.5 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setQuickAddStatusId(null)}
              className="h-7 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-7 px-3 text-xs">
              Save
            </Button>
          </div>
        </form>
      )}

      <div className="flex-1 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent space-y-3 overflow-y-auto pr-1.5 pb-3">
        {tasks.length === 0 ? (
          <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-background/50 text-[13px] font-medium text-muted-foreground/50 transition-colors">
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              projectId={projectId}
              statuses={statuses}
              onSelectTask={onSelectTask}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function TaskBoard({
  projectId,
  tasks: initialTasks,
  statuses,
  projectTemplate,
  activeSprintId,
  onSelectTask,
}: TaskBoardProps) {
  const [prevTasks, setPrevTasks] = useState<Task[]>(initialTasks)
  const [boardTasks, setBoardTasks] = useState<Task[]>(() =>
    [...initialTasks].sort((a, b) => (a.position || 0) - (b.position || 0))
  )
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  if (initialTasks !== prevTasks) {
    setPrevTasks(initialTasks)
    setBoardTasks(
      [...initialTasks].sort((a, b) => (a.position || 0) - (b.position || 0))
    )
  }

  const createTaskMutation = useCreateTask(projectId)
  const updateTaskOrderMutation = useUpdateTaskOrder(projectId)
  const createStatusMutation = useCreateStatus(projectId)

  const [quickAddStatusId, setQuickAddStatusId] = useState<string | null>(null)
  const [quickAddTitle, setQuickAddTitle] = useState("")
  const [isAddingStatus, setIsAddingStatus] = useState(false)
  const [newStatusName, setNewStatusName] = useState("")

  const handleCreateStatus = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatusName.trim()) return
    createStatusMutation.mutate({
      name: newStatusName.trim(),
      category: "todo",
      order: statuses.length,
    })
    setNewStatusName("")
    setIsAddingStatus(false)
  }

  const filteredTasks = useMemo(() => {
    return boardTasks.filter((t) => {
      if (t.parentTaskId) return false

      if (projectTemplate === "scrum" && activeSprintId !== undefined) {
        return t.sprintId === activeSprintId
      }
      return true
    })
  }, [boardTasks, projectTemplate, activeSprintId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveTask(boardTasks.find((t) => t.id === active.id) || null)
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === "Task"
    const isOverTask = over.data.current?.type === "Task"
    const isOverColumn = over.data.current?.type === "Column"

    if (!isActiveTask) return

    setBoardTasks((tasks) => {
      const activeIndex = tasks.findIndex((t) => t.id === activeId)
      const overIndex = tasks.findIndex((t) => t.id === overId)

      if (isOverTask) {
        const activeTask = tasks[activeIndex]
        const overTask = tasks[overIndex]
        
        if (activeTask.statusId !== overTask.statusId) {
          const newTasks = tasks.filter((t) => t.id !== activeId)
          const targetIndex = newTasks.findIndex((t) => t.id === overId)
          
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top > over.rect.top + over.rect.height
            
          const modifier = isBelowOverItem ? 1 : 0
          const insertIndex = targetIndex >= 0 ? targetIndex + modifier : newTasks.length
          
          const updatedActiveTask = {
            ...activeTask,
            statusId: overTask.statusId,
          }
          
          newTasks.splice(insertIndex, 0, updatedActiveTask)
          return newTasks
        }
        
        return arrayMove(tasks, activeIndex, overIndex)
      }

      if (isOverColumn) {
        const activeTask = tasks[activeIndex]
        if (activeTask.statusId !== overId) {
          const newTasks = [...tasks]
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            statusId: overId as string,
          }
          return arrayMove(newTasks, activeIndex, newTasks.length - 1)
        }
      }

      return tasks
    })
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id

    const activeTask = boardTasks.find((t) => t.id === activeId)
    if (!activeTask) return

    const statusTasks = boardTasks.filter(
      (t) => t.statusId === activeTask.statusId
    )
    const activeIndexInStatus = statusTasks.findIndex((t) => t.id === activeId)

    const prev = statusTasks[activeIndexInStatus - 1]
    const next = statusTasks[activeIndexInStatus + 1]

    let newPosition = 0
    if (prev && next) {
      newPosition = ((prev.position || 0) + (next.position || 0)) / 2
    } else if (prev) {
      newPosition = (prev.position || 0) + 1024
    } else if (next) {
      newPosition = (next.position || 0) - 1024
    } else {
      newPosition = 1024
    }

    setBoardTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === activeId ? { ...t, position: newPosition } : t
      )
    )

    updateTaskOrderMutation.mutate({
      taskId: activeId as string,
      data: {
        statusId: activeTask.statusId,
        position: newPosition,
      },
    })
  }

  const handleQuickAddSubmit = (e: React.FormEvent, statusId: string) => {
    e.preventDefault()
    if (!quickAddTitle.trim()) return

    createTaskMutation.mutate({
      title: quickAddTitle.trim(),
      statusId,
      sprintId: activeSprintId || null,
      type: "task",
      priority: "medium",
    })

    setQuickAddTitle("")
    setQuickAddStatusId(null)
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.4" } },
    }),
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex min-h-0 w-full max-w-full min-w-0 flex-1 gap-5 overflow-x-auto px-4 py-4 pb-8 lg:gap-6">
        {statuses.map((status) => {
          const columnTasks = filteredTasks.filter(
            (t) => t.statusId === status.id
          )

          return (
            <SortableContext
              key={status.id}
              items={columnTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <BoardColumn
                projectId={projectId}
                statuses={statuses}
                status={status}
                tasks={columnTasks}
                quickAddStatusId={quickAddStatusId}
                quickAddTitle={quickAddTitle}
                setQuickAddStatusId={setQuickAddStatusId}
                setQuickAddTitle={setQuickAddTitle}
                handleQuickAddSubmit={handleQuickAddSubmit}
                onSelectTask={onSelectTask}
              />
            </SortableContext>
          )
        })}
        <div className="flex h-12 w-72 shrink-0 flex-col justify-start lg:w-80">
          {isAddingStatus ? (
            <form
              onSubmit={handleCreateStatus}
              className="flex items-center gap-2 rounded-xl border border-border/80 bg-card p-2.5 shadow-sm"
            >
              <Input
                autoFocus
                placeholder="Column name"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="h-9 border-none bg-transparent px-2 py-1 text-sm shadow-none focus-visible:ring-0"
              />
              <Button type="submit" size="sm" className="h-8">
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingStatus(false)}
                className="h-8"
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsAddingStatus(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-dashed border-border/60 bg-secondary/10 text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground"
            >
              <HugeiconsIcon icon={Add01Icon} size={18} />
              <span className="text-sm font-medium">Add Column</span>
            </Button>
          )}
        </div>
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
          <div className="scale-105 rotate-3 cursor-grabbing shadow-2xl transition-transform">
            <TaskCard
              task={activeTask}
              projectId={projectId}
              statuses={statuses}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
