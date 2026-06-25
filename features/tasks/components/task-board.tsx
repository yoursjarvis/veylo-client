"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { useCreateTask } from "../hooks/use-tasks"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { axiosInstance } from "@/lib/axios"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Bug,
  Sparkles,
  Clock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"
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

  const completedStatus =
    statuses.find(
      (st) =>
        st.name.toLowerCase() === "done" ||
        st.name.toLowerCase() === "completed" ||
        st.name.toLowerCase() === "complete"
    ) || statuses[statuses.length - 1]

  const handleMarkComplete = (taskId: string, currentStatusId: string) => {
    if (!completedStatus) return
    if (currentStatusId === completedStatus.id) {
      const firstStatus = statuses[0]
      if (firstStatus) {
        updateTaskMutation.mutate({ taskId, statusId: firstStatus.id })
      }
    } else {
      updateTaskMutation.mutate({ taskId, statusId: completedStatus.id })
    }
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
        return <Badge variant="destructive">Urgent</Badge>
      case "high":
        return (
          <Badge
            variant="outline"
            className="border-warning/30 bg-warning/5 text-warning"
          >
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="secondary" className="font-bold uppercase text-info bg-info/10">
            Medium
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="font-bold text-muted-foreground uppercase"
          >
            Low
          </Badge>
        )
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="h-3.5 w-3.5 text-destructive" />
      case "feature":
        return <Sparkles className="h-3.5 w-3.5 text-info" />
      default:
        return <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
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
        {statuses.map((status: { id: string; name: string }) => {
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
              columnTasks={columnTasks}
              onSelectTask={onSelectTask}
              quickAddStatusId={quickAddStatusId}
              setQuickAddStatusId={setQuickAddStatusId}
              quickAddTitle={quickAddTitle}
              setQuickAddTitle={setQuickAddTitle}
              handleQuickAddSubmit={handleQuickAddSubmit}
              getPriorityBadge={getPriorityBadge}
              getTypeIcon={getTypeIcon}
              completedStatusId={completedStatus?.id}
              onMarkComplete={handleMarkComplete}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="pointer-events-none flex w-[254px] scale-105 rotate-2 flex-col gap-2.5 rounded-xl border border-border border-primary/40 bg-background p-3.5 opacity-95 shadow-2xl transition-transform select-none">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <span className="line-clamp-2 text-xs leading-snug font-semibold text-foreground">
                {activeTask.title}
              </span>
              <div className="mt-0.5 flex-shrink-0">
                {getTypeIcon(activeTask.type)}
              </div>
            </div>

            {/* Meta Section */}
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {getPriorityBadge(activeTask.priority)}
                {activeTask.estimate && (
                  <Badge className="border border-border bg-muted px-1 py-0 font-mono text-[9px] text-muted-foreground">
                    {activeTask.estimate}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Due Date Indicator */}
                {activeTask.dueDate && (
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Clock size={10} />
                    <span>{format(new Date(activeTask.dueDate), "MMM d")}</span>
                  </div>
                )}

                {/* Assignee Avatar */}
                <Avatar className="h-5 w-5 border border-border">
                  <AvatarImage src={activeTask.assignee?.image || ""} />
                  <AvatarFallback className="bg-muted text-[8px] font-bold text-muted-foreground">
                    {activeTask.assignee?.name
                      ? activeTask.assignee.name.charAt(0).toUpperCase()
                      : "-"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DragDropProvider>
  )
}

interface BoardColumnProps {
  status: { id: string; name: string }
  columnTasks: TaskBoardProps["tasks"]
  onSelectTask: (taskId: string) => void
  quickAddStatusId: string | null
  setQuickAddStatusId: (statusId: string | null) => void
  quickAddTitle: string
  setQuickAddTitle: (title: string) => void
  handleQuickAddSubmit: (e: React.FormEvent, statusId: string) => void
  getPriorityBadge: (prio: string) => React.ReactNode
  getTypeIcon: (type: string) => React.ReactNode
  completedStatusId?: string
  onMarkComplete: (taskId: string, currentStatusId: string) => void
}

function BoardColumn({
  status,
  columnTasks,
  onSelectTask,
  quickAddStatusId,
  setQuickAddStatusId,
  quickAddTitle,
  setQuickAddTitle,
  handleQuickAddSubmit,
  getPriorityBadge,
  getTypeIcon,
  completedStatusId,
  onMarkComplete,
}: BoardColumnProps) {
  const { ref: droppableRef } = useDroppable({
    id: status.id,
  })

  return (
    <div
      ref={droppableRef}
      className="flex h-full max-h-[70vh] w-[280px] flex-shrink-0 flex-col rounded-xl border border-border bg-card p-3 shadow-lg backdrop-blur-md"
    >
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {status.name}
          </span>
          <Badge className="bg-muted px-1.5 py-0 text-[10px] text-muted-foreground hover:bg-muted">
            {columnTasks.length}
          </Badge>
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
              getTypeIcon={getTypeIcon}
              completedStatusId={completedStatusId}
              onMarkComplete={onMarkComplete}
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
  getTypeIcon: (type: string) => React.ReactNode
  completedStatusId?: string
  onMarkComplete: (taskId: string, currentStatusId: string) => void
}

function TaskCard({
  task,
  index,
  statusId,
  onSelectTask,
  getPriorityBadge,
  getTypeIcon,
  completedStatusId,
  onMarkComplete,
}: TaskCardProps) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: task.id,
    index,
    group: statusId,
  })

  return (
    <div
      ref={(node) => {
        ref(node)
        handleRef(node)
      }}
      onClick={() => !isDragSource && onSelectTask(task.id)}
      className={cn(
        "group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-border bg-background p-3.5 shadow transition duration-150 select-none hover:border-border/80 hover:bg-muted active:cursor-grabbing",
        isDragSource &&
          "pointer-events-none border-2 border-dashed border-primary/20 bg-muted/40 opacity-30 shadow-none"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {/* Quick Action Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMarkComplete(task.id, statusId)
            }}
            className={cn(
              "mt-0.5 flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors",
              statusId === completedStatusId
                ? "border-success bg-success text-success-foreground"
                : "border-muted-foreground/40 text-transparent hover:border-success hover:bg-success/10 hover:text-success"
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
          </button>
          <span
            className={cn(
              "line-clamp-2 text-xs leading-snug font-semibold text-foreground transition-colors group-hover:text-primary",
              statusId === completedStatusId &&
                "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
        </div>
        <div className="mt-0.5 flex-shrink-0">{getTypeIcon(task.type)}</div>
      </div>

      {/* Meta Section */}
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {getPriorityBadge(task.priority)}
          {task.estimate && (
            <Badge className="border border-border bg-muted px-1 py-0 font-mono text-[9px] text-muted-foreground">
              {task.estimate}
            </Badge>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Due Date Indicator */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Clock size={10} />
              <span>{format(new Date(task.dueDate), "MMM d")}</span>
            </div>
          )}

          {/* Assignee Avatar */}
          <Avatar className="h-5 w-5 flex-shrink-0 border border-border">
            <AvatarImage src={task.assignee?.image || ""} />
            <AvatarFallback className="bg-muted text-[8px] font-bold text-muted-foreground">
              {task.assignee?.name
                ? task.assignee.name.charAt(0).toUpperCase()
                : "-"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  )
}
