"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { axiosInstance } from "@/lib/axios"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Plus,
} from "lucide-react"
import React, { useState } from "react"
import type { ProjectMember } from "@/types/models"
import {
  useCreateSprint,
  useCreateTask,
  useUpdateSprint,
} from "../hooks/use-tasks"

interface TaskBacklogProps {
  projectId: string
  tasks: {
    id: string
    sprintId: string | null
    estimate?: number
    type: string
    title: string
    status: { name: string; category?: string }
    assignee?: { name?: string; image?: string }
  }[]
  sprints: {
    id: string
    name: string
    status: string
    goal?: string
    startDate?: string
    endDate?: string
  }[]
  projectMembers: ProjectMember[]
  statuses: { id: string }[]
  onSelectTask: (taskId: string) => void
}

export function TaskBacklog({
  projectId,
  tasks,
  sprints,
  statuses,
  onSelectTask,
}: TaskBacklogProps) {
  const createSprintMutation = useCreateSprint(projectId)
  const updateSprintMutation = useUpdateSprint(projectId)
  const createTaskMutation = useCreateTask(projectId)

  // States
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false)
  const [newSprintName, setNewSprintName] = useState("")
  const [newSprintGoal, setNewSprintGoal] = useState("")
  const [newSprintStart, setNewSprintStart] = useState<Date | undefined>()
  const [newSprintEnd, setNewSprintEnd] = useState<Date | undefined>()

  const [activeQuickAddTaskSprintId, setActiveQuickAddTaskSprintId] = useState<
    string | null
  >(null)
  const [quickAddTaskTitle, setQuickAddTaskTitle] = useState("")

  // Sprint Completion Wizard state
  const [completingSprint, setCompletingSprint] = useState<{
    id: string
    name: string
  } | null>(null)
  const [completeDestSprintId, setCompleteDestSprintId] = useState<string>("")

  // Toggle sprint card folding
  const [foldedSprints, setFoldedSprints] = useState<Record<string, boolean>>(
    {}
  )

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId)
  }

  const handleDropOnSprint = async (
    e: React.DragEvent,
    sprintId: string | null
  ) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("text/plain")
    if (!taskId) return

    // Call API patch dynamically and trigger reload/invalidate query client
    await axiosInstance.patch(`/tasks/${taskId}`, { sprintId })
    window.location.reload() // Simple refetch fallback
  }

  const handleCreateSprintSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSprintName.trim()) return

    createSprintMutation.mutate(
      {
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || null,
        startDate: newSprintStart ? newSprintStart.toISOString() : null,
        endDate: newSprintEnd ? newSprintEnd.toISOString() : null,
      },
      {
        onSuccess: () => {
          setIsCreateSprintOpen(false)
          setNewSprintName("")
          setNewSprintGoal("")
          setNewSprintStart(undefined)
          setNewSprintEnd(undefined)
        },
      }
    )
  }

  const handleStartSprint = (sprint: { id: string; name: string }) => {
    // Check if another sprint is active
    const activeSprint = sprints.find((s) => s.status === "active")
    if (activeSprint) {
      alert("A sprint is already active. Complete it first.")
      return
    }

    updateSprintMutation.mutate({
      id: sprint.id,
      data: { status: "active", startDate: new Date().toISOString() },
    })
  }

  const triggerCompleteSprint = (sprint: { id: string; name: string }) => {
    setCompletingSprint(sprint)
    // Find default destination (first planned sprint or backlog)
    const plannedSprints = sprints.filter(
      (s) => s.status === "planned" && s.id !== sprint.id
    )
    if (plannedSprints.length > 0) {
      setCompleteDestSprintId(plannedSprints[0].id)
    } else {
      setCompleteDestSprintId("")
    }
  }

  const handleCompleteSprintSubmit = () => {
    if (!completingSprint) return

    updateSprintMutation.mutate(
      {
        id: completingSprint.id,
        data: {
          status: "completed",
          uncompletedTasksDestination: completeDestSprintId || null,
        },
      },
      {
        onSuccess: () => {
          setCompletingSprint(null)
        },
      }
    )
  }

  const handleQuickAddTask = (e: React.FormEvent, sprintId: string | null) => {
    e.preventDefault()
    if (!quickAddTaskTitle.trim()) return

    // Use first status for new tasks (usually To Do / Backlog)
    const defaultStatusId = statuses[0]?.id

    createTaskMutation.mutate(
      {
        title: quickAddTaskTitle.trim(),
        statusId: defaultStatusId,
        sprintId,
        type: "task",
        priority: "medium",
      },
      {
        onSuccess: () => {
          setQuickAddTaskTitle("")
          setActiveQuickAddTaskSprintId(null)
        },
      }
    )
  }

  const toggleFold = (sprintId: string) => {
    setFoldedSprints((prev) => ({ ...prev, [sprintId]: !prev[sprintId] }))
  }

  const renderTaskCard = (task: {
    id: string
    type: string
    title: string
    estimate?: number
    status: { name: string; category?: string }
    assignee?: { name?: string; image?: string }
  }) => (
    <div
      key={task.id}
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
      onClick={() => onSelectTask(task.id)}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-border hover:bg-muted"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Badge
          className={`py-0.5 text-[9px] font-bold uppercase ${task.type === "bug" ? "bg-destructive/20 text-destructive" : task.type === "feature" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
        >
          {task.type}
        </Badge>
        <span className="truncate text-xs font-medium text-foreground">
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Status */}
        <Badge className="border border-border bg-muted py-0 text-[10px] text-muted-foreground">
          {task.status.name}
        </Badge>

        {/* Estimate */}
        {task.estimate !== null && (
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {task.estimate}
          </span>
        )}

        {/* Assignee */}
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
  )

  return (
    <div className="flex-1 space-y-6 overflow-y-auto pr-2 pb-6">
      {/* Header action */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Sprint Backlog Planner
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Plan sprints, assign estimations, drag items, and track velocity.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateSprintOpen(true)}
          className="h-8 text-xs"
        >
          <Plus size={14} className="mr-1.5" /> Create Sprint
        </Button>
      </div>

      {/* Active & Planned Sprints */}
      <div className="space-y-4">
        {sprints.map((sprint) => {
          const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id)
          const totalPoints = sprintTasks.reduce(
            (acc, t) => acc + (t.estimate || 0),
            0
          )
          const isFolded = !!foldedSprints[sprint.id]

          return (
            <Card
              key={sprint.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnSprint(e, sprint.id)}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleFold(sprint.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isFolded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronUp size={16} />
                    )}
                  </button>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                    {sprint.name}
                    {sprint.status === "active" && (
                      <Badge className="border border-success/20 bg-success/10 py-0 text-[9px] text-success">
                        Active
                      </Badge>
                    )}
                    {sprint.status === "completed" && (
                      <Badge className="bg-muted py-0 text-[9px] text-muted-foreground">
                        Completed
                      </Badge>
                    )}
                  </CardTitle>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {sprintTasks.length} tasks • {totalPoints} pts
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Goal */}
                  {sprint.goal && (
                    <span className="max-w-[200px] truncate text-[10px] text-muted-foreground italic">
                      &quot;{sprint.goal}&quot;
                    </span>
                  )}

                  {/* Dates */}
                  {sprint.startDate && sprint.endDate && (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                      <CalendarIcon size={12} />
                      {format(new Date(sprint.startDate), "MMM d")} -{" "}
                      {format(new Date(sprint.endDate), "MMM d")}
                    </span>
                  )}

                  {/* Sprint Actions */}
                  {sprint.status === "planned" && (
                    <Button
                      onClick={() => handleStartSprint(sprint)}
                      size="sm"
                      className="h-7 px-2.5 text-[10px]"
                    >
                      <Play size={10} className="mr-1" /> Start Sprint
                    </Button>
                  )}

                  {sprint.status === "active" && (
                    <Button
                      onClick={() => triggerCompleteSprint(sprint)}
                      size="sm"
                      className="h-7 bg-success px-2.5 text-[10px] text-success-foreground hover:bg-success/90"
                    >
                      <CheckCircle size={10} className="mr-1" /> Complete Sprint
                    </Button>
                  )}
                </div>
              </div>

              {/* Tasks List */}
              {!isFolded && (
                <CardContent className="space-y-2 p-3">
                  {sprintTasks.length === 0 ? (
                    <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                      No tasks inside this sprint. Drag backlog items here.
                    </div>
                  ) : (
                    sprintTasks.map(renderTaskCard)
                  )}

                  {/* Quick Add inside Sprint */}
                  {sprint.status !== "completed" && (
                    <form
                      onSubmit={(e) => handleQuickAddTask(e, sprint.id)}
                      className="flex gap-2 pt-1.5"
                    >
                      <Input
                        placeholder="Quick add task to this sprint..."
                        value={
                          activeQuickAddTaskSprintId === sprint.id
                            ? quickAddTaskTitle
                            : ""
                        }
                        onChange={(e) => {
                          setActiveQuickAddTaskSprintId(sprint.id)
                          setQuickAddTaskTitle(e.target.value)
                        }}
                        className="h-8 border-border bg-background text-xs text-foreground"
                      />
                      <Button type="submit" size="sm" className="h-8 text-xs">
                        Add
                      </Button>
                    </form>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Product Backlog Section */}
      <Card
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDropOnSprint(e, null)}
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="flex items-center justify-between border-b border-border bg-card p-4">
          <CardTitle className="text-sm font-bold text-foreground">
            Product Backlog (Unscheduled)
          </CardTitle>
          <span className="font-mono text-[10px] text-muted-foreground">
            {tasks.filter((t) => t.sprintId === null).length} tasks
          </span>
        </div>
        <CardContent className="space-y-2 p-3">
          {tasks.filter((t) => t.sprintId === null).length === 0 ? (
            <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No tasks in backlog. Add one below!
            </div>
          ) : (
            tasks.filter((t) => t.sprintId === null).map(renderTaskCard)
          )}

          {/* Quick Add in Backlog */}
          <form
            onSubmit={(e) => handleQuickAddTask(e, null)}
            className="flex gap-2 pt-2"
          >
            <Input
              placeholder="Add unscheduled backlog task..."
              value={
                activeQuickAddTaskSprintId === null ? quickAddTaskTitle : ""
              }
              onChange={(e) => {
                setActiveQuickAddTaskSprintId(null)
                setQuickAddTaskTitle(e.target.value)
              }}
              className="h-8 border-border bg-background text-xs text-foreground"
            />
            <Button type="submit" size="sm" className="h-8 text-xs">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* DIALOG 1: CREATE SPRINT MODAL */}
      {isCreateSprintOpen && (
        <Dialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen}>
          <DialogContent className="border border-border bg-card p-6 text-foreground sm:max-w-112.5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Create New Sprint
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSprintSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Sprint Name
                </Label>
                <Input
                  required
                  placeholder="e.g. Sprint 1 - Core MVP"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Goal
                </Label>
                <Input
                  placeholder="What is this sprint's core objective?"
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  className="border-border bg-background text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Start Date
                  </Label>
                  <Popover>
                    <PopoverTrigger 
                      render={
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start border-border bg-background text-left text-xs font-normal",
                            !newSprintStart && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newSprintStart ? (
                        format(newSprintStart, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newSprintStart}
                        onSelect={setNewSprintStart}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    End Date
                  </Label>
                  <Popover>
                    <PopoverTrigger 
                      render={
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start border-border bg-background text-left text-xs font-normal",
                            !newSprintEnd && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newSprintEnd ? (
                        format(newSprintEnd, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newSprintEnd}
                        onSelect={setNewSprintEnd}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateSprintOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-xs">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 2: SPRINT COMPLETION WIZARD */}
      {completingSprint && (
        <Dialog
          open={!!completingSprint}
          onOpenChange={(open) => !open && setCompletingSprint(null)}
        >
          <DialogContent className="border border-border bg-card p-6 text-foreground sm:max-w-112.5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Complete {completingSprint.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                This sprint will be closed. What should we do with all
                uncompleted tasks remaining in this sprint?
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Move uncompleted tasks to:
                </Label>
                <select
                  value={completeDestSprintId}
                  onChange={(e) => setCompleteDestSprintId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Product Backlog (Unscheduled)</option>
                  {sprints
                    .filter(
                      (s) =>
                        s.status === "planned" && s.id !== completingSprint.id
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Planned)
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                variant="ghost"
                onClick={() => setCompletingSprint(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteSprintSubmit}
                className="text-xs font-semibold"
              >
                Complete & Rollover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
