"use client"

import React, { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CircleCheckIcon,
  UserAdd01Icon,
  Calendar01Icon,
  Delete01Icon,
  Add01Icon
} from "@hugeicons/core-free-icons"
import { Task, ProjectMember, TaskStatus } from "@/types/models"
import { format } from "date-fns"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { useProjectChecklistTemplates, useApplyChecklistTemplate } from "@/features/tasks/hooks/use-tasks"
import { cn } from "@/lib/utils"
interface TaskDetailsSubtasksProps {
  taskId: string
  subtasks: Task[]
  completedStatus?: TaskStatus
  projectStatuses: TaskStatus[]
  projectMembers: ProjectMember[]
  onUpdateSubtask: (id: string, data: Partial<Task>) => void
  onDeleteSubtask: (id: string) => void
  onNavigateToSubtask: (id: string) => void
  onAddSubtask: (title: string) => void
}

export function TaskDetailsSubtasks({
  taskId,
  subtasks = [],
  completedStatus,
  projectStatuses,
  projectMembers,
  onUpdateSubtask,
  onDeleteSubtask,
  onNavigateToSubtask,
  onAddSubtask,
}: TaskDetailsSubtasksProps) {
  const { activeWorkspace } = useWorkspaceContext()
  const { data: templates = [] } = useProjectChecklistTemplates(activeWorkspace?.id || null)
  const applyTemplateMutation = useApplyChecklistTemplate(taskId)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    onAddSubtask(newSubtaskTitle.trim())
    setNewSubtaskTitle("")
  }

  return (
    <div className="space-y-4 border-t border-border/60 pt-6">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <HugeiconsIcon icon={CircleCheckIcon} size={14} className="text-muted-foreground/70" />{" "}
          Subtask Checklist
        </label>
        {templates.length > 0 && (
          <Popover>
            <PopoverTrigger render={
              <Button
                type="button"
                variant="outline"
                className="h-7 text-[10px] font-semibold flex items-center gap-1.5"
              />
            }>
              <HugeiconsIcon icon={Add01Icon} size={10} />
              Load Template
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1.5">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 border-b border-border/40 mb-1">
                Apply Checklist Template
              </div>
              {templates.map((tpl: { id: string; name: string; description?: string }) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    applyTemplateMutation.mutate(tpl.id)
                  }}
                  disabled={applyTemplateMutation.isPending}
                  className="w-full text-left text-xs font-medium px-2 py-1.5 rounded-md hover:bg-muted/60 disabled:opacity-50 transition-colors flex flex-col gap-0.5"
                >
                  <span className="text-foreground">{tpl.name}</span>
                  {tpl.description && (
                    <span className="text-[9px] text-muted-foreground line-clamp-1">{tpl.description}</span>
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="space-y-1 pl-0.5">
        {subtasks.map((subtask) => {
          const isSubtaskCompleted = subtask.statusId === completedStatus?.id
          const subtaskAssignee = projectMembers.find((m) => m.user?.id === subtask.assigneeId)?.user

          return (
            <div
              key={subtask.id}
              className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30"
            >
              <div className="flex flex-1 items-center gap-2.5">
                <Checkbox
                  checked={isSubtaskCompleted}
                  onCheckedChange={(checked) =>
                    onUpdateSubtask(subtask.id, {
                      statusId: checked
                        ? completedStatus?.id
                        : projectStatuses[0]?.id,
                    })
                  }
                  className="border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                />
                <button
                  type="button"
                  onClick={() => onNavigateToSubtask(subtask.id)}
                  className={cn(
                    "text-left text-sm transition-colors",
                    isSubtaskCompleted
                      ? "font-normal text-muted-foreground line-through"
                      : "font-medium text-foreground hover:underline"
                  )}
                >
                  {subtask.title}
                </button>
              </div>

              <div
                className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [&:has([data-state=open])]:opacity-100"
                style={{
                  opacity: subtask.assigneeId || subtask.dueDate ? 1 : undefined,
                }}
              >
                {/* Assignee Popover */}
                <Popover>
                  <PopoverTrigger render={
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-transparent transition-colors hover:border-border/50 hover:bg-muted"
                      title="Assign to..."
                    />
                  }>
                      {subtaskAssignee ? (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={subtaskAssignee.image || ""} />
                          <AvatarFallback className="text-[9px]">
                            {subtaskAssignee.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <HugeiconsIcon icon={UserAdd01Icon} size={12} className="text-muted-foreground" />
                      )}
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search team..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No member found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => onUpdateSubtask(subtask.id, { assigneeId: null })}
                            className="text-xs"
                          >
                            <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/50">
                              <HugeiconsIcon icon={UserAdd01Icon} size={10} className="text-muted-foreground/70" />
                            </div>
                            Unassigned
                            {subtask.assigneeId === null && (
                              <HugeiconsIcon icon={CircleCheckIcon} size={12} className="ml-auto text-primary" />
                            )}
                          </CommandItem>
                          {projectMembers
                            .filter((m) => m.user)
                            .map((member) => (
                              <CommandItem
                                key={member.id}
                                onSelect={() => onUpdateSubtask(subtask.id, { assigneeId: member.user?.id })}
                                className="text-xs"
                              >
                                <Avatar className="mr-2 h-5 w-5">
                                  <AvatarImage src={member.user?.image || ""} />
                                  <AvatarFallback className="text-[9px]">
                                    {member.user?.name?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {member.user?.name}
                                {subtask.assigneeId === member.user?.id && (
                                  <HugeiconsIcon icon={CircleCheckIcon} size={12} className="ml-auto text-primary" />
                                )}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Due Date Popover */}
                <Popover>
                  <PopoverTrigger render={
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-1 rounded border border-transparent px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:border-border/50 hover:bg-muted",
                        subtask.dueDate ? "text-foreground" : "text-muted-foreground"
                      )}
                      title="Set due date"
                    />
                  }>
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        size={12}
                        className={subtask.dueDate ? "text-primary" : ""}
                      />
                      {subtask.dueDate ? format(new Date(subtask.dueDate), "MMM d") : ""}
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                      onSelect={(date) =>
                        onUpdateSubtask(subtask.id, {
                          dueDate: date?.toISOString() || null,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <button
                  onClick={() => onDeleteSubtask(subtask.id)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  title="Delete Subtask"
                >
                  <HugeiconsIcon icon={Delete01Icon} size={12} />
                </button>
              </div>
            </div>
          )
        })}
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
          <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1" /> Add
        </Button>
      </form>
    </div>
  )
}
