"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { useCreateTask } from "../hooks/use-tasks"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { axiosInstance } from "@/lib/axios"

import { Badge } from "@/components/reui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, ListChecks, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  DragDropProvider,
  useDroppable,
  DragOverlay,
  DragEndEvent,
  PointerSensor,
} from "@dnd-kit/react"
import { useSortable, isSortable } from "@dnd-kit/react/sortable"
import { PointerActivationConstraints } from "@dnd-kit/dom"
import { Separator } from "@/components/ui/separator"

const COLUMN_DOT_COLORS = [
  "bg-slate-400",
  "bg-blue-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
]

interface TaskBoardProps {
  projectId: string
  tasks: {
    id: string
    sprintId: string | null
    statusId: string
    type: string
    title: string
    priority: string
    position?: number
    createdAt?: string
    estimate?: number
    dueDate?: string
    assignee?: { name?: string; image?: string }
    identifier?: string
    labels?: { id: string; name: string; color?: string }[]
    subtasksDone?: number
    subtasksTotal?: number
    commentCount?: number
    _count?: {
      subtasks?: number
      comments?: number
    }
  }[]
  statuses: { id: string; name: string }[]
  projectMembers: Record<string, unknown>[]
  sprints: Record<string, unknown>[]
  projectTemplate: string
  activeSprintId?: string | null
  onSelectTask: (taskId: string) => void
}

export function TaskBoard({
  projectId,
  tasks,
  statuses,
  projectTemplate,
  activeSprintId,
  onSelectTask,
}: TaskBoardProps) {
  const queryClient = useQueryClient()
  const createTaskMutation = useCreateTask(projectId)

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      statusId,
      position,
    }: {
      taskId: string
      statusId: string
      position?: number
    }) => {
      const response = await axiosInstance.patch(`/tasks/${taskId}`, {
        statusId,
        position,
      })
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
      toast.success("Task updated")
    },
    onError: (err: LooseAny) => {
      toast.error(err.response?.data?.message || "Failed to update task")
    },
  })

  // Tracks which column has an active "quick add" text field
  const [quickAddStatusId, setQuickAddStatusId] = useState<string | null>(null)
  const [quickAddTitle, setQuickAddTitle] = useState("")
  // Track active dragged item ID for custom overlay styling
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = React.useMemo(
    () => [
      PointerSensor.configure({
        activationConstraints(event) {
          const { pointerType } = event
          if (pointerType === "mouse") {
            return [new PointerActivationConstraints.Distance({ value: 5 })]
          }
          if (pointerType === "touch") {
            return [
              new PointerActivationConstraints.Delay({
                value: 250,
                tolerance: 5,
              }),
            ]
          }
          return undefined
        },
      }),
    ],
    []
  )

  // Filters tasks for the current board
  const boardTasks = tasks.filter((t) => {
    // If it's a Scrum template, filter by active sprint if passed
    if (projectTemplate === "scrum" && activeSprintId !== undefined) {
      return t.sprintId === activeSprintId
    }
    return true
  })

  const getNormalizedPositions = (tasksList: typeof boardTasks) => {
    const positionsSet = new Set(tasksList.map((t) => t.position ?? 0))
    const hasDuplicates =
      positionsSet.size < tasksList.length || positionsSet.has(0)

    if (hasDuplicates) {
      return tasksList.map((t, index) => ({
        ...t,
        position: (index + 1) * 1000,
      }))
    }
    return tasksList.map((t) => ({
      ...t,
      position: t.position ?? 0,
    }))
  }

  const handleDropOnCard = (
    draggedTaskId: string,
    targetTaskId: string,
    targetStatusId: string,
    columnTasksList: typeof boardTasks
  ) => {
    const draggedIdx = columnTasksList.findIndex((t) => t.id === draggedTaskId)
    const targetIdx = columnTasksList.findIndex((t) => t.id === targetTaskId)

    const normalizedTasks = getNormalizedPositions(columnTasksList)
    const targetTask = normalizedTasks[targetIdx]

    let newPosition: number

    if (draggedIdx !== -1 && draggedIdx < targetIdx) {
      // Moving DOWN: place AFTER target card
      if (targetIdx === normalizedTasks.length - 1) {
        newPosition = targetTask.position + 1000
      } else {
        newPosition =
          (targetTask.position + normalizedTasks[targetIdx + 1].position) / 2
      }
    } else {
      // Moving UP or from DIFFERENT column: place BEFORE target card
      if (targetIdx === 0) {
        newPosition = targetTask.position - 1000
      } else {
        newPosition =
          (normalizedTasks[targetIdx - 1].position + targetTask.position) / 2
      }
    }

    updateTaskMutation.mutate({
      taskId: draggedTaskId,
      statusId: targetStatusId,
      position: newPosition,
    })
  }

  const handleDropOnColumn = (
    draggedTaskId: string,
    targetStatusId: string
  ) => {
    const targetColumnTasks = boardTasks
      .filter((t) => t.statusId === targetStatusId)
      .sort((a, b) => {
        const posA = a.position ?? 0
        const posB = b.position ?? 0
        if (posA !== posB) return posA - posB
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

    const draggedIdx = targetColumnTasks.findIndex(
      (t) => t.id === draggedTaskId
    )
    if (draggedIdx !== -1 && draggedIdx === targetColumnTasks.length - 1) {
      return
    }

    let newPosition = 1000
    if (targetColumnTasks.length > 0) {
      const normalizedTasks = getNormalizedPositions(targetColumnTasks)
      const lastTask = normalizedTasks[normalizedTasks.length - 1]
      newPosition = lastTask.position + 1000
    }

    updateTaskMutation.mutate({
      taskId: draggedTaskId,
      statusId: targetStatusId,
      position: newPosition,
    })
  }

  const handleDragStart = (event: any) => {
    setActiveId(String(event.operation.source?.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    // Delay executing updates to allow dnd-kit DOM operations to settle first, preventing race conditions with React DOM reconciliation
    const { canceled, operation } = event

    setTimeout(() => {
      setActiveId(null)
      if (canceled) return

      const source = operation.source
      const target = operation.target

      if (!source || !target) return

      const draggedTaskId = String(source.id)

      if (isSortable(target)) {
        const targetSortable = target.sortable
        const targetTaskId = String(targetSortable.id)
        const targetStatusId = String(targetSortable.group)

        if (draggedTaskId === targetTaskId) return

        const columnTasksList = boardTasks
          .filter((t) => t.statusId === targetStatusId)
          .sort((a, b) => {
            const posA = a.position ?? 0
            const posB = b.position ?? 0
            if (posA !== posB) return posA - posB
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dateB - dateA
          })

        handleDropOnCard(
          draggedTaskId,
          targetTaskId,
          targetStatusId,
          columnTasksList
        )
      } else {
        const targetStatusId = String(target.id)
        handleDropOnColumn(draggedTaskId, targetStatusId)
      }
    }, 0)
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

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "urgent":
        return (
          <Badge
            variant="destructive"
            size="xs"
            radius="full"
            className="uppercase font-bold text-[10px] px-2 py-0.5 leading-none"
          >
            Urgent
          </Badge>
        )
      case "high":
        return (
          <Badge
            variant="warning-light"
            size="xs"
            radius="full"
            className="uppercase font-bold text-[10px] px-2 py-0.5 leading-none border border-warning/20"
          >
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge
            variant="info-light"
            size="xs"
            radius="full"
            className="uppercase font-bold text-[10px] px-2 py-0.5 leading-none border border-info/20"
          >
            Medium
          </Badge>
        )
      default:
        return (
          <Badge
            variant="invert-light"
            size="xs"
            radius="full"
            className="uppercase font-bold text-[10px] px-2 py-0.5 leading-none border border-border text-muted-foreground"
          >
            Low
          </Badge>
        )
    }
  }

  const activeTask = tasks.find((t) => t.id === activeId)

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto py-2">
        {statuses.map(
          (status: { id: string; name: string }, statusIndex: number) => {
            const columnTasks = boardTasks
              .filter((t) => t.statusId === status.id)
              .sort((a, b) => {
                const posA = a.position ?? 0
                const posB = b.position ?? 0
                if (posA !== posB) return posA - posB
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                return dateB - dateA
              })

            return (
              <BoardColumn
                key={status.id}
                status={status}
                columnIndex={statusIndex}
                columnTasks={columnTasks}
                onSelectTask={onSelectTask}
                quickAddStatusId={quickAddStatusId}
                setQuickAddStatusId={setQuickAddStatusId}
                quickAddTitle={quickAddTitle}
                setQuickAddTitle={setQuickAddTitle}
                handleQuickAddSubmit={handleQuickAddSubmit}
                getPriorityBadge={getPriorityBadge}
              />
            )
          }
        )}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="pointer-events-none flex w-[280px] scale-105 rotate-2 flex-col gap-2.5 rounded-xl border border-primary/40 bg-background p-3.5 opacity-95 shadow-2xl transition-transform select-none">
            {/* Row 1: Identifier + Priority */}
            <div className="flex items-center justify-between gap-2">
              {activeTask.identifier ? (
                <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {activeTask.identifier}
                </span>
              ) : (
                <span />
              )}
              {getPriorityBadge(activeTask.priority)}
            </div>

            {/* Row 2: Title */}
            <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
              {activeTask.title}
            </span>

            {/* Row 3: Due date */}
            {activeTask.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <Calendar size={12} />
                <span>{format(new Date(activeTask.dueDate), "MMM d")}</span>
              </div>
            )}

            {/* Row 4: Labels */}
            {activeTask.labels && activeTask.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activeTask.labels.map((label, labelIndex) => (
                  <span
                    key={label.id || labelIndex}
                    className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Row 5: Progress bar */}
            {activeTask.subtasksTotal != null &&
              activeTask.subtasksTotal > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.round(((activeTask.subtasksDone ?? 0) / activeTask.subtasksTotal) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

            <Separator />

            {/* Row 6: Bottom row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeTask.subtasksTotal != null &&
                  activeTask.subtasksTotal > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ListChecks size={12} />
                      <span>
                        {activeTask.subtasksDone ?? 0}/
                        {activeTask.subtasksTotal}
                      </span>
                    </div>
                  )}
                {activeTask.commentCount != null &&
                  activeTask.commentCount > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MessageSquare size={12} />
                      <span>{activeTask.commentCount}</span>
                    </div>
                  )}
              </div>
              <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={activeTask.assignee?.image || ""} />
                <AvatarFallback className="bg-muted text-[9px] font-bold text-muted-foreground">
                  {activeTask.assignee?.name
                    ? activeTask.assignee.name.charAt(0).toUpperCase()
                    : "-"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DragDropProvider>
  )
}

interface BoardColumnProps {
  status: { id: string; name: string }
  columnIndex: number
  columnTasks: TaskBoardProps["tasks"]
  onSelectTask: (taskId: string) => void
  quickAddStatusId: string | null
  setQuickAddStatusId: (statusId: string | null) => void
  quickAddTitle: string
  setQuickAddTitle: (title: string) => void
  handleQuickAddSubmit: (e: React.FormEvent, statusId: string) => void
  getPriorityBadge: (prio: string) => React.ReactNode
}

function BoardColumn({
  status,
  columnIndex,
  columnTasks,
  onSelectTask,
  quickAddStatusId,
  setQuickAddStatusId,
  quickAddTitle,
  setQuickAddTitle,
  handleQuickAddSubmit,
  getPriorityBadge,
}: BoardColumnProps) {
  const { ref: droppableRef } = useDroppable({
    id: status.id,
  })

  const dotColor = COLUMN_DOT_COLORS[columnIndex % COLUMN_DOT_COLORS.length]

  return (
    <div
      ref={droppableRef}
      className="flex h-full max-h-[70vh] w-[280px] flex-shrink-0 flex-col rounded-xl bg-muted/30 p-3"
    >
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1 select-none">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", dotColor)} />
          <span className="text-xs font-bold tracking-wide text-foreground uppercase">
            {status.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {columnTasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setQuickAddStatusId(status.id)}
          className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus size={14} />
        </Button>
      </div>

      {/* Quick Add Form */}
      {quickAddStatusId === status.id && (
        <form
          onSubmit={(e) => handleQuickAddSubmit(e, status.id)}
          className="mb-3 rounded-lg border border-border bg-background p-2"
        >
          <Input
            autoFocus
            placeholder="Task title..."
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            className="h-7 border-none bg-transparent px-1 py-1 text-xs text-foreground placeholder-muted-foreground/60 focus-visible:ring-0"
          />
          <div className="mt-1.5 flex justify-end gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setQuickAddStatusId(null)}
              className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-6 text-[10px]">
              Add
            </Button>
          </div>
        </form>
      )}

      {/* Cards Container */}
      <div className="min-h-[150px] flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {columnTasks.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border text-[10px] text-muted-foreground select-none">
            Drag tasks here
          </div>
        ) : (
          columnTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              statusId={status.id}
              onSelectTask={onSelectTask}
              getPriorityBadge={getPriorityBadge}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface TaskCardProps {
  task: TaskBoardProps["tasks"][number]
  index: number
  statusId: string
  onSelectTask: (taskId: string) => void
  getPriorityBadge: (prio: string) => React.ReactNode
}

function TaskCard({
  task,
  index,
  statusId,
  onSelectTask,
  getPriorityBadge,
}: TaskCardProps) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: task.id,
    index,
    group: statusId,
  })

  const subtasksTotal = task._count?.subtasks ?? task.subtasksTotal ?? 0
  const subtasksDone = task.subtasksDone ?? 0
  const commentCount = task._count?.comments ?? task.commentCount ?? 0
  const subtaskProgress =
    subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0

  return (
    <div
      ref={(node) => {
        ref(node)
        handleRef(node)
      }}
      onClick={() => !isDragSource && onSelectTask(task.id)}
      className={cn(
        "group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-border bg-background p-3.5 shadow-sm transition duration-150 select-none hover:shadow-md active:cursor-grabbing",
        isDragSource &&
          "pointer-events-none border-2 border-dashed border-primary/20 bg-muted/40 opacity-30 shadow-none"
      )}
    >
      {/* Row 1: Identifier badge (left) + Priority badge (right) */}
      <div className="flex items-center justify-between gap-2">
        {task.identifier ? (
          <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {task.identifier}
          </span>
        ) : (
          <span />
        )}
        {getPriorityBadge(task.priority)}
      </div>

      {/* Row 2: Task title */}
      <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
        {task.title}
      </span>

      {/* Row 3: Due date (optional) */}
      {task.dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <Calendar size={12} />
          <span>{format(new Date(task.dueDate), "MMM d")}</span>
        </div>
      )}

      {/* Row 4: Labels (optional) */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label, labelIndex) => (
            <span
              key={label.id || labelIndex}
              className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Row 5: Progress bar (optional) */}
      {subtasksTotal > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      <Separator />
      {/* Row 6: Bottom row - subtask count + comment count (left) + assignee avatar (right) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {subtasksTotal > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ListChecks size={12} />
              <span>
                {subtasksDone}/{subtasksTotal}
              </span>
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquare size={12} />
              <span>{commentCount}</span>
            </div>
          )}
        </div>

        <Avatar className="h-6 w-6 border border-border">
          <AvatarImage src={task.assignee?.image || ""} />
          <AvatarFallback className="bg-muted text-[9px] font-bold text-muted-foreground">
            {task.assignee?.name
              ? task.assignee.name.charAt(0).toUpperCase()
              : "-"}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
