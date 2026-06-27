"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import React, { useState } from "react"
import { toast } from "sonner"
import { useCreateTask } from "../hooks/use-tasks"

import { Badge } from "@/components/reui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bug, ChevronRight, Clock, Plus, Sparkles } from "lucide-react"

interface TaskBoardProps {
  projectId: string
  tasks: {
    id: string
    sprintId: string | null
    statusId: string
    type: string
    title: string
    priority: string
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
    }: {
      taskId: string
      statusId: string
    }) => {
      const response = await axiosInstance.patch(`/tasks/${taskId}`, {
        statusId,
      })
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] })
      toast.success("Task status updated")
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update task status")
    },
  })

  // Tracks which column has an active "quick add" text field
  const [quickAddStatusId, setQuickAddStatusId] = useState<string | null>(null)
  const [quickAddTitle, setQuickAddTitle] = useState("")

  // Filters tasks for the current board
  const boardTasks = tasks.filter((t) => {
    // If it's a Scrum template, filter by active sprint if passed
    if (projectTemplate === "scrum" && activeSprintId !== undefined) {
      return t.sprintId === activeSprintId
    }
    return true
  })

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId)
    e.currentTarget.classList.add("opacity-50")
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
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
        return <Badge variant="destructive-light">Urgent</Badge>
      case "high":
        return <Badge variant="rose-light">High</Badge>
      case "medium":
        return (
          <Badge variant="info-light" className="font-bold uppercase">
            Medium
          </Badge>
        )
      default:
        return (
          <Badge variant="default" className="font-bold uppercase">
            Low
          </Badge>
        )
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="h-3.5 w-3.5 text-red-500" />
      case "feature":
        return <Sparkles className="h-3.5 w-3.5 text-violet-400" />
      default:
        return <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto py-2">
      {statuses.map((status: { id: string; name: string }) => {
        const columnTasks = boardTasks.filter((t) => t.statusId === status.id)
        return (
          <div
            key={status.id}
            onDragOver={handleDragOver}
            onDrop={(e) => {
              e.preventDefault()
              const taskId = e.dataTransfer.getData("text/plain")
              if (!taskId) return
              updateTaskMutation.mutate({ taskId, statusId: status.id })
            }}
            className="flex h-full max-h-[70vh] w-[280px] flex-shrink-0 flex-col rounded-xl border border-border bg-card p-3 shadow-lg backdrop-blur-md"
          >
            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between px-1">
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
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
              {columnTasks.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border text-[10px] text-muted-foreground">
                  Drag tasks here
                </div>
              ) : (
                columnTasks.map(
                  (task: {
                    id: string
                    sprintId: string | null
                    statusId: string
                    type: string
                    title: string
                    priority: string
                    estimate?: number
                    dueDate?: string
                    assignee?: { name?: string; image?: string }
                  }) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelectTask(task.id)}
                      className="group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-border bg-background p-3.5 shadow transition duration-150 hover:border-border/80 hover:bg-muted active:cursor-grabbing"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-xs leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
                          {task.title}
                        </span>
                        <div className="mt-0.5 flex-shrink-0">
                          {getTypeIcon(task.type)}
                        </div>
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

                        <div className="flex items-center gap-2">
                          {/* Due Date Indicator */}
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                              <Clock size={10} />
                              <span>
                                {format(new Date(task.dueDate), "MMM d")}
                              </span>
                            </div>
                          )}

                          {/* Assignee Avatar */}
                          <Avatar className="h-5 w-5 border border-border">
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
                )
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { axiosInstance } from "@/lib/axios"
