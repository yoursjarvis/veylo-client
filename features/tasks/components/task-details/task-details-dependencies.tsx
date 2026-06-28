"use client"

import React, { useState } from "react"
import { Task, TaskStatus } from "@/types/models"
import { Button } from "@/components/ui/button"
import { Plus, X, Link as LinkIcon, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useProjectTasks } from "../../hooks/use-tasks"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TaskDetailsDependenciesProps {
  task: Task
  projectStatuses: TaskStatus[]
  onNavigateToTask: (id: string) => void
  onAddDependency: (data: { dependencyTaskId: string; direction: "blocks" | "blocked_by" }) => void
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
  const [addingType, setAddingType] = useState<"blocking" | "blocked_by" | null>(null)

  const { data: allTasks } = useProjectTasks(task.projectId, {})

  const availableTasks = (allTasks || []).filter(
    (t: any) => 
      t.id !== task.id &&
      !blockingDeps.some(d => d.blockedTaskId === t.id) &&
      !blockedByDeps.some(d => d.blockingTaskId === t.id)
  )

  const getStatusColor = (statusId: string) => {
    const status = projectStatuses.find(s => s.id === statusId)
    if (!status) return "bg-slate-500/10 text-slate-500"
    if (status.category === "done") return "bg-emerald-500/10 text-emerald-600"
    if (status.category === "in_progress") return "bg-blue-500/10 text-blue-600"
    return "bg-slate-500/10 text-slate-500"
  }

  const getStatusName = (statusId: string) => {
    return projectStatuses.find(s => s.id === statusId)?.name || "Unknown"
  }

  const handleSelectTask = (targetTaskId: string) => {
    if (!addingType) return
    onAddDependency({
      dependencyTaskId: targetTaskId,
      direction: addingType === "blocking" ? "blocks" : "blocked_by"
    })
    setPopoverOpen(false)
    setAddingType(null)
  }

  const renderAddDependencyButton = (type: "blocking" | "blocked_by") => (
    <Popover 
      open={popoverOpen && addingType === type} 
      onOpenChange={(open) => {
        setPopoverOpen(open)
        if (open) setAddingType(type)
        else setAddingType(null)
      }}
    >
      <PopoverTrigger 
        render={<Button variant="ghost" size="icon-xs" className="h-6 w-6" />}
      >
        <Plus className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80" align="end">
        <Command>
          <CommandInput placeholder="Search tasks..." />
          <CommandList>
            <CommandEmpty>No tasks found.</CommandEmpty>
            <CommandGroup>
              {availableTasks.map((t: any) => (
                <CommandItem
                  key={t.id}
                  value={t.taskKey + " " + t.title}
                  onSelect={() => handleSelectTask(t.id)}
                >
                  <span className="text-xs font-medium text-muted-foreground w-12">{t.taskKey}</span>
                  <span className="truncate flex-1">{t.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          Dependencies
        </h3>
      </div>

      {!hasDependencies ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
          <LinkIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <h3 className="text-sm font-medium text-foreground">No dependencies</h3>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Link tasks to show what needs to be done first.
          </p>
          <div className="flex gap-2">
            <div className="relative">
              {renderAddDependencyButton("blocked_by")}
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none text-muted-foreground whitespace-nowrap">Add Blocked By</span>
            </div>
            <div className="relative ml-20">
              {renderAddDependencyButton("blocking")}
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none text-muted-foreground whitespace-nowrap">Add Blocking</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border p-4 bg-muted/10">
          
          {/* Blocked By Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                Blocked By
              </h4>
              {renderAddDependencyButton("blocked_by")}
            </div>
            {blockedByDeps.length === 0 ? (
              <p className="text-xs text-muted-foreground italic pl-5">This task is not waiting on any other tasks.</p>
            ) : (
              <div className="space-y-2">
                {blockedByDeps.map(dep => {
                  const linkedTask = dep.blockingTask
                  if (!linkedTask) return null
                  return (
                    <div key={dep.id} className="flex items-center justify-between group rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent/50 transition-colors">
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => onNavigateToTask(linkedTask.id)}
                      >
                        <span className="text-xs font-medium text-muted-foreground shrink-0">{linkedTask.taskKey}</span>
                        <span className="truncate font-medium">{linkedTask.title}</span>
                        <Badge variant="secondary" className={`ml-auto shrink-0 text-[10px] uppercase font-semibold h-5 px-1.5 border-0 ${getStatusColor(linkedTask.statusId)}`}>
                          {getStatusName(linkedTask.statusId)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 ml-2 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onRemoveDependency?.(dep.id) }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="h-px bg-border my-4" />

          {/* Blocking Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <LinkIcon className="h-3.5 w-3.5 text-emerald-500" />
                Blocks
              </h4>
              {renderAddDependencyButton("blocking")}
            </div>
            {blockingDeps.length === 0 ? (
              <p className="text-xs text-muted-foreground italic pl-5">This task does not block any other tasks.</p>
            ) : (
              <div className="space-y-2">
                {blockingDeps.map(dep => {
                  const linkedTask = dep.blockedTask
                  if (!linkedTask) return null
                  return (
                    <div key={dep.id} className="flex items-center justify-between group rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent/50 transition-colors">
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => onNavigateToTask(linkedTask.id)}
                      >
                        <span className="text-xs font-medium text-muted-foreground shrink-0">{linkedTask.taskKey}</span>
                        <span className="truncate font-medium">{linkedTask.title}</span>
                        <Badge variant="secondary" className={`ml-auto shrink-0 text-[10px] uppercase font-semibold h-5 px-1.5 border-0 ${getStatusColor(linkedTask.statusId)}`}>
                          {getStatusName(linkedTask.statusId)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 ml-2 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onRemoveDependency?.(dep.id) }}
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
