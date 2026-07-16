"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Task, TaskStatus } from "@/types/models"
import { AlertCircle, Link as LinkIcon, X } from "lucide-react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import React, { useState } from "react"
import { useProjectTasks } from "../../hooks/use-tasks"

interface TaskDetailsDependenciesProps {
  task: Task
  projectStatuses: TaskStatus[]
  onNavigateToTask: (id: string) => void
  onAddDependency: (data: {
    dependencyTaskId: string
    direction: "blocks" | "blocked_by"
  }) => void
  onRemoveDependency: (dependencyId: string) => void
}

export function TaskDetailsDependencies({
  task,
  projectStatuses,
  onNavigateToTask,
  onAddDependency,
  onRemoveDependency,
}: TaskDetailsDependenciesProps) {
  const blockingDeps = task.blockingDependencies || []
  const blockedByDeps = task.blockedByDependencies || []

  const hasDependencies = blockingDeps.length > 0 || blockedByDeps.length > 0

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [addingType, setAddingType] = useState<
    "blocking" | "blocked_by" | null
  >(null)
  const [isRendered, setIsRendered] = useState(false)

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (popoverOpen) {
      timer = setTimeout(() => {
        setIsRendered(true)
      }, 50)
    } else {
      timer = setTimeout(() => {
        setIsRendered(false)
      }, 0)
    }
    return () => clearTimeout(timer)
  }, [popoverOpen])

  React.useEffect(() => {
    if (isRendered) {
      const input = document.querySelector<HTMLInputElement>(
        'input[data-slot="command-input"]'
      )
      if (input) {
        input.focus({ preventScroll: true })
      }
    }
  }, [isRendered])

  const { data: allTasks } = useProjectTasks(task.projectId, {})

  const availableTasks = (allTasks || []).filter(
    (t: Task) =>
      t.id !== task.id &&
      !blockingDeps.some((d) => d.blockedTaskId === t.id) &&
      !blockedByDeps.some((d) => d.blockingTaskId === t.id)
  )

  const getStatusColor = (statusId: string) => {
    const status = projectStatuses.find((s) => s.id === statusId)
    if (!status) return "bg-muted/10 text-muted-foreground"
    if (status.category === "done") return "bg-success/10 text-success"
    if (status.category === "in_progress") return "bg-primary/10 text-primary"
    return "bg-muted/10 text-muted-foreground"
  }

  const getStatusName = (statusId: string) => {
    return projectStatuses.find((s) => s.id === statusId)?.name || "Unknown"
  }

  const handleSelectTask = (targetTaskId: string) => {
    if (!addingType) return
    onAddDependency({
      dependencyTaskId: targetTaskId,
      direction: addingType === "blocking" ? "blocks" : "blocked_by",
    })
    setPopoverOpen(false)
    setAddingType(null)
  }

  const renderAddDependencyButton = (
    type: "blocking" | "blocked_by",
    customTrigger?: React.ReactElement
  ) => (
    <Popover
      open={popoverOpen && addingType === type}
      onOpenChange={(open) => {
        setPopoverOpen(open)
        if (open) setAddingType(type)
        else setAddingType(null)
      }}
    >
      <PopoverTrigger
        render={
          customTrigger || (
            <Button variant="ghost" size="icon-xs" className="h-6 w-6">
              <HugeiconsIcon icon={PlusSignIcon} className="h-3.5 w-3.5" />
            </Button>
          )
        }
      />
      <PopoverContent
        className="w-96 p-0"
        align="end"
        initialFocus={() => false}
      >
        {isRendered && (
          <Command>
            <CommandInput placeholder="Search tasks..." />
            <CommandList>
              <CommandEmpty>No tasks found.</CommandEmpty>
              <CommandGroup>
                {availableTasks.map((t: Task) => (
                  <CommandItem
                    key={t.id}
                    value={t.taskKey + " " + t.title}
                    onSelect={() => handleSelectTask(t.id)}
                  >
                    <span className="w-16 text-xs font-medium text-muted-foreground">
                      {t.taskKey}
                    </span>
                    <span className="flex-1 truncate">{t.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          Dependencies
        </h3>
      </div>

      {!hasDependencies ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
          <LinkIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <h3 className="text-sm font-medium text-foreground">
            No dependencies
          </h3>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">
            Link tasks to show what needs to be done first.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {renderAddDependencyButton(
              "blocked_by",
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-medium"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="mr-1.5 h-3.5 w-3.5" />
                Add Blocked By
              </Button>
            )}
            {renderAddDependencyButton(
              "blocking",
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-medium"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="mr-1.5 h-3.5 w-3.5" />
                Add Blocking
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border bg-muted/10 p-4">
          {/* Blocked By Section */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <AlertCircle className="h-3.5 w-3.5 text-warning" />
                Blocked By
              </h4>
              {renderAddDependencyButton("blocked_by")}
            </div>
            {blockedByDeps.length === 0 ? (
              <p className="pl-5 text-xs text-muted-foreground italic">
                This task is not waiting on any other tasks.
              </p>
            ) : (
              <div className="space-y-2">
                {blockedByDeps.map((dep) => {
                  const linkedTask = dep.blockingTask
                  if (!linkedTask) return null
                  return (
                    <div
                      key={dep.id}
                      className="group flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                    >
                      <div
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                        onClick={() => onNavigateToTask(linkedTask.id)}
                      >
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {linkedTask.taskKey}
                        </span>
                        <span className="truncate font-medium">
                          {linkedTask.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`ml-auto h-5 shrink-0 border-0 px-1.5 text-2xs font-semibold uppercase ${getStatusColor(linkedTask.statusId)}`}
                        >
                          {getStatusName(linkedTask.statusId)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="ml-2 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveDependency?.(dep.id)
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="my-4 h-px bg-border" />

          {/* Blocking Section */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <LinkIcon className="h-3.5 w-3.5 text-success" />
                Blocks
              </h4>
              {renderAddDependencyButton("blocking")}
            </div>
            {blockingDeps.length === 0 ? (
              <p className="pl-5 text-xs text-muted-foreground italic">
                This task does not block any other tasks.
              </p>
            ) : (
              <div className="space-y-2">
                {blockingDeps.map((dep) => {
                  const linkedTask = dep.blockedTask
                  if (!linkedTask) return null
                  return (
                    <div
                      key={dep.id}
                      className="group flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                    >
                      <div
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                        onClick={() => onNavigateToTask(linkedTask.id)}
                      >
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {linkedTask.taskKey}
                        </span>
                        <span className="truncate font-medium">
                          {linkedTask.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`ml-auto h-5 shrink-0 border-0 px-1.5 text-2xs font-semibold uppercase ${getStatusColor(linkedTask.statusId)}`}
                        >
                          {getStatusName(linkedTask.statusId)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="ml-2 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveDependency?.(dep.id)
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
