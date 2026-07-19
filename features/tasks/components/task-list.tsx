"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, isPast, isToday } from "date-fns"
import { AnimatePresence, motion } from "motion/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import React, { useState, useMemo } from "react"
import type { Epic, Milestone, Sprint } from "@/types/models"

import { IconStack } from "@/components/reui/icon-stack"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DraggableAttributes,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowDown,
  ArrowUp,
  AlertCircle,
  Minus,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  User,
  Calendar as CalendarIcon,
  GripVertical,
  Bug,
  Sparkles,
  CheckSquare,
} from "lucide-react"
import { useUpdateTask, useUpdateTaskOrder } from "../hooks/use-tasks"

interface Task {
  id: string
  taskKey?: string
  title: string
  description?: string
  statusId?: string
  priority: string
  type: string
  status: { name: string; progressWeight?: number }
  assignee?: { image?: string; name?: string; id?: string }
  assigneeId?: string | null
  reporter?: { image?: string; name?: string; id?: string }
  reporterId?: string | null
  createdAt?: string
  dueDate?: string
  estimate?: string | number
  labels?: { labelId: string }[]
  comments?: { id: string }[]
  position?: number
  epicId?: string | null
  milestoneId?: string | null
  sprintId?: string | null
}

interface TaskRowProps {
  task: Task
  projectTemplate: string
  onSelectTask: (taskId: string) => void
  projectLabels: { id: string; name: string; color?: string }[]
  isSelected: boolean
  onToggleSelect: (taskId: string, selected: boolean) => void
  dragHandleProps?: DraggableAttributes
  dragHandleListeners?: SyntheticListenerMap
  projectId: string
  statuses: { id: string; name: string; progressWeight?: number }[]
  projectMembers: {
    role?: string
    user: {
      id: string
      name?: string | null
      image?: string | null
      email?: string | null
    }
  }[]
}

const gridCols =
  "grid-cols-[40px_80px_1fr_128px_112px_128px_112px_96px_40px]"

const getStatusProgress = (status?: { name: string; progressWeight?: number }) => {
  if (status && typeof status.progressWeight === "number") {
    return status.progressWeight
  }
  const statusName = status?.name || "Todo"
  switch (statusName.toLowerCase()) {
    case "done":
      return 100
    case "in review":
    case "review":
      return 90
    case "in progress":
      return 65
    case "blocked":
      return 15
    case "todo":
    default:
      return 0
  }
}

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "bug":
      return <Bug className="h-3.5 w-3.5 text-danger shrink-0" />
    case "feature":
    case "story":
      return <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0" />
    default:
      return <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
  }
}

import { getPriority, renderPriorityIcon, priorityList } from "@/lib/priority"

const getPriorityIcon = (prio: string) => {
  return renderPriorityIcon(prio, "h-3.5 w-3.5 shrink-0");
}

function UserSelect({
  value,
  onChange,
  users,
  placeholder = "Unassigned",
}: {
  value: string | null
  onChange: (userId: string | null) => void
  users: {
    role?: string
    user: {
      id: string
      name?: string | null
      image?: string | null
      email?: string | null
    }
  }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedMember = users.find((u) => u.user.id === value)
  const selectedUser = selectedMember?.user

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <HoverCard>
        <HoverCardTrigger
          render={
            <PopoverTrigger
              render={
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex w-full items-center gap-2 overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:bg-muted focus:outline-none"
                >
                  {selectedUser ? (
                    <>
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={selectedUser.image || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {selectedUser.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs text-secondary-foreground">
                        {selectedUser.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted text-muted-foreground">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="truncate text-xs text-muted-foreground italic">
                        {placeholder}
                      </span>
                    </>
                  )}
                </button>
              }
            />
          }
        />
        {selectedUser && (
          <HoverCardContent
            className="w-80 rounded-xl border border-border/80 bg-popover p-4 shadow-lg"
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              <Avatar className="h-12 w-12 shrink-0 border border-border/50">
                <AvatarImage src={selectedUser.image || undefined} />
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {selectedUser.name?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1">
                <h4 className="truncate text-sm font-semibold text-foreground">
                  {selectedUser.name}
                </h4>
                {selectedUser.email && (
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedUser.email}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-medium text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                  <span className="text-2xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {selectedMember?.role || "Member"}
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
      <PopoverContent
        className="w-56 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search users..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
              No users found.
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
                className="py-1.5 text-xs"
              >
                <div className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5" />
                </div>
                Unassigned
              </CommandItem>
              {users.map((member) => (
                <CommandItem
                  key={member.user.id}
                  onSelect={() => {
                    onChange(member.user.id)
                    setOpen(false)
                  }}
                  className="py-1.5 text-xs"
                >
                  <Avatar className="mr-2 h-6 w-6 shrink-0">
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {member.user.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{member.user.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function DatePicker({
  value,
  onChange,
}: {
  value: string | undefined | null
  onChange: (date: Date | null) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex w-full items-center justify-between overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1.5 text-left text-xs transition-colors hover:border-border/80 hover:bg-muted focus:outline-none",
              value && isPast(new Date(value)) && !isToday(new Date(value))
                ? "font-medium text-destructive"
                : "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {value ? (
                format(new Date(value), "MMM d")
              ) : (
                <span className="italic opacity-70">No date</span>
              )}
            </span>
            <CalendarIcon
              className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50"
            />
          </button>
        }
      />
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date: Date | undefined) => {
            onChange(date || null)
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export function StatusSelect({
  value,
  onChange,
  statuses,
  placeholder = "Status",
}: {
  value: string | null
  onChange: (statusId: string) => void
  statuses: { id: string; name: string; color?: string }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedStatus = statuses.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center gap-2 overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:bg-muted focus:outline-none"
          >
            {selectedStatus ? (
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: selectedStatus.color || "var(--primary)"
                  }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: selectedStatus.color || "var(--primary)"
                  }}
                >
                  {selectedStatus.name}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className="text-xs text-muted-foreground italic truncate">
                  {placeholder}
                </span>
              </div>
            )}
          </button>
        }
      />
      <PopoverContent
        className="w-56 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput
            placeholder="Search status..."
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
              No status found.
            </CommandEmpty>
            <CommandGroup>
              {statuses.map((st) => (
                <CommandItem
                  key={st.id}
                  onSelect={() => {
                    onChange(st.id)
                    setOpen(false)
                  }}
                  className="py-1.5 text-xs"
                >
                  <div className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        !st.color && "bg-primary/60"
                      )}
                      style={
                        st.color ? { backgroundColor: st.color } : undefined
                      }
                    />
                  </div>
                  <span className="truncate">{st.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const PRIORITIES = priorityList

export function PrioritySelect({
  value,
  onChange,
  placeholder = "Priority",
}: {
  value: string | null
  onChange: (priority: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedPriority = getPriority(value || "medium")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center gap-2 overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:bg-muted focus:outline-none"
          >
            {value ? (
              <div className="flex items-center gap-1.5">
                {getPriorityIcon(selectedPriority.value)}
                <span className={cn("text-xs font-semibold", selectedPriority.color)}>
                  {selectedPriority.label}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Minus className="h-3.5 w-3.5" />
                <span className="text-xs italic truncate">{placeholder}</span>
              </div>
            )}
          </button>
        }
      />
      <PopoverContent
        className="w-48 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput
            placeholder="Search priority..."
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
              No priority found.
            </CommandEmpty>
            <CommandGroup>
              {PRIORITIES.map((p) => (
                <CommandItem
                  key={p.value}
                  onSelect={() => {
                    onChange(p.value)
                    setOpen(false)
                  }}
                  className="py-1.5 text-xs"
                >
                  <div className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center">
                    {getPriorityIcon(p.value)}
                  </div>
                  <span className="truncate">{p.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function TaskRow({
  task,
  projectTemplate,
  onSelectTask,
  projectLabels = [],
  isSelected,
  onToggleSelect,
  dragHandleProps,
  dragHandleListeners,
  projectId,
  statuses,
  projectMembers,
}: TaskRowProps) {
  const taskKey = task.taskKey || task.id.substring(0, 8).toUpperCase()
  const updateTaskMutation = useUpdateTask(projectId, task.id)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task.title)

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleCheckboxChange = (checked: boolean) => {
    onToggleSelect(task.id, checked)
  }

  return (
    <div
      onClick={() => onSelectTask(task.id)}
      className={cn(
        "group grid cursor-pointer items-center border-b border-border bg-background text-sm transition-colors duration-200 hover:bg-muted/30",
        gridCols,
        isSelected ? "bg-primary/5" : ""
      )}
      style={{ minHeight: "44px" }}
    >
      {/* Checkbox and drag handle (Column 1) */}
      <div className="flex items-center justify-center gap-1.5 px-2 py-2">
        {dragHandleProps && dragHandleListeners && (
          <div
            {...dragHandleProps}
            {...dragHandleListeners}
            className="cursor-grab rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted active:cursor-grabbing shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        )}
        <div onClick={handleCheckboxClick} className="shrink-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(c) => handleCheckboxChange(c as boolean)}
          />
        </div>
      </div>

      {/* ID (Column 2) */}
      <div className="flex items-center gap-1.5 px-3 py-2 font-mono text-xs text-muted-foreground truncate">
        {getTypeIcon(task.type)}
        <span title={taskKey}>{taskKey}</span>
      </div>

      {/* Title (Column 3) */}
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
        {isEditingTitle ? (
          <Input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={() => {
              setIsEditingTitle(false)
              if (titleValue.trim() && titleValue !== task.title) {
                updateTaskMutation.mutate({ title: titleValue })
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setIsEditingTitle(false)
                if (titleValue.trim() && titleValue !== task.title) {
                  updateTaskMutation.mutate({ title: titleValue })
                }
              }
            }}
            className="h-8 w-full px-2 py-0.5 text-xs bg-muted/40"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingTitle(true)
            }}
            className="block cursor-text truncate text-sm font-semibold text-foreground hover:underline decoration-primary/40"
          >
            {task.title}
          </span>
        )}
        <div className="flex flex-shrink-0 items-center gap-1">
          {(task.labels || []).map((tl) => {
            const labelObj = projectLabels.find((l) => l.id === tl.labelId)
            if (!labelObj) return null
            return (
              <span
                key={tl.labelId}
                className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold text-secondary-foreground"
              >
                {labelObj.name}
              </span>
            )
          })}
        </div>
      </div>

      {/* Status (Column 4) */}
      <div className="flex items-center truncate px-3 py-2">
        <StatusSelect
          value={task.statusId || null}
          onChange={(val) => updateTaskMutation.mutate({ statusId: val })}
          statuses={statuses}
        />
      </div>

      {/* Priority (Column 5) */}
      <div className="flex items-center truncate px-3 py-2">
        <PrioritySelect
          value={task.priority}
          onChange={(val) =>
            updateTaskMutation.mutate({
              priority: val as "low" | "medium" | "high" | "urgent",
            })
          }
        />
      </div>

      {/* Progress (Column 6) */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${getStatusProgress(task.status)}%` }}
          ></div>
        </div>
        <span className="w-8 text-right text-xs text-muted-foreground">
          {getStatusProgress(task.status)}%
        </span>
      </div>

      {/* Assignee (Column 7) */}
      <div className="flex items-center truncate px-3 py-2">
        <UserSelect
          value={task.assigneeId || null}
          onChange={(val) => updateTaskMutation.mutate({ assigneeId: val })}
          users={projectMembers}
          placeholder="Unassigned"
        />
      </div>

      {/* Due Date (Column 8) */}
      <div className="flex items-center truncate px-3 py-2">
        <DatePicker
          value={task.dueDate}
          onChange={(date) =>
            updateTaskMutation.mutate({
              dueDate: date ? date.toISOString() : null,
            })
          }
        />
      </div>

      {/* Actions (Column 9) */}
      <div className="flex items-center justify-center px-3 py-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelectTask(task.id)
          }}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function SortableTaskRow(props: TaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.task.id,
    data: { type: "Task", task: props.task },
  })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  return (
    <motion.div
      layout
      layoutId={props.task.id}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative outline-none",
        isDragging &&
          "z-50 border-y border-dashed border-primary/40 bg-muted/40 shadow-inner"
      )}
    >
      <div className={cn(isDragging ? "invisible" : "")}>
        <TaskRow
          {...props}
          dragHandleProps={attributes as DraggableAttributes}
          dragHandleListeners={listeners as SyntheticListenerMap}
        />
      </div>
    </motion.div>
  )
}

interface StatusSectionProps {
  status: { id: string; name: string; color?: string }
  tasks: Task[]
  projectTemplate: string
  onSelectTask: (taskId: string) => void
  projectLabels: { id: string; name: string; color?: string }[]
  isCollapsed: boolean
  onToggle: () => void
  selectedTasks: Set<string>
  onToggleSelect: (taskId: string, selected: boolean) => void
  projectId: string
  statuses: { id: string; name: string }[]
  projectMembers: {
    role?: string
    user: {
      id: string
      name?: string | null
      image?: string | null
      email?: string | null
    }
  }[]
  scrollElement: HTMLDivElement | null
  setIsCreateTaskOpen?: (open: boolean) => void
  isDragDisabled?: boolean
}

export function StatusSection({
  status,
  tasks,
  projectTemplate,
  onSelectTask,
  projectLabels,
  isCollapsed,
  onToggle,
  selectedTasks,
  onToggleSelect,
  projectId,
  statuses,
  projectMembers,
  scrollElement,
  setIsCreateTaskOpen,
  isDragDisabled = false,
}: StatusSectionProps) {
  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 48,
    overscan: 10,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { type: "StatusSection", status },
    disabled: isDragDisabled,
  })

  if (tasks.length === 0) {
    return (
      <div
        className={cn(
          "mb-4 flex flex-col",
          !isDragDisabled && isOver && "rounded-md bg-primary/5 outline-1 outline-primary/30"
        )}
        ref={isDragDisabled ? undefined : setNodeRef}
      >
        <div
          className="group sticky top-9 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-2 cursor-pointer transition-colors hover:bg-muted/30"
          onClick={onToggle}
        >
          <button className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <div className="flex items-center gap-1.5">
            {status.color && (
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: status.color }}
              />
            )}
            <span className="text-sm font-semibold text-foreground">
              {status.name}
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-medium">
              {tasks.length}
            </span>
          </div>
          <div className="flex-1" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsCreateTaskOpen?.(true)
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add task</span>
          </button>
        </div>
        {!isCollapsed && (
          <div
            className={cn(
              "mx-2 my-2 flex h-12 items-center justify-center rounded-md border-2 border-dashed border-border/45 text-xs font-medium text-muted-foreground/60 transition-colors",
              !isDragDisabled && isOver && "border-primary/45 bg-primary/5 text-primary"
            )}
          >
            {isDragDisabled ? "No tasks" : "Drop tasks here"}
          </div>
        )}
      </div>
    )
  }

  const listContent = (
    <div
      style={{
        height: `${totalSize}px`,
        width: "100%",
        position: "relative",
      }}
    >
      {virtualItems.map((virtualItem) => {
        const task = tasks[virtualItem.index]
        if (!task) return null
        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {isDragDisabled ? (
              <TaskRow
                task={task}
                projectTemplate={projectTemplate}
                onSelectTask={onSelectTask}
                projectLabels={projectLabels}
                isSelected={selectedTasks.has(task.id)}
                onToggleSelect={onToggleSelect}
                projectId={projectId}
                statuses={statuses}
                projectMembers={projectMembers}
              />
            ) : (
              <SortableTaskRow
                task={task}
                projectTemplate={projectTemplate}
                onSelectTask={onSelectTask}
                projectLabels={projectLabels}
                isSelected={selectedTasks.has(task.id)}
                onToggleSelect={onToggleSelect}
                projectId={projectId}
                statuses={statuses}
                projectMembers={projectMembers}
              />
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div
      className={cn(
        "flex flex-col pb-4",
        !isDragDisabled && isOver && "bg-primary/5 outline-1 outline-primary/20"
      )}
      ref={isDragDisabled ? undefined : setNodeRef}
    >
      <div
        className="group sticky top-9 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-2 cursor-pointer transition-colors hover:bg-muted/30"
        onClick={onToggle}
      >
        <button className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <div className="flex items-center gap-1.5">
          {status.color && (
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: status.color }}
            />
          )}
          <span className="text-sm font-semibold text-foreground">
            {status.name}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-medium">
            {tasks.length}
          </span>
        </div>
        <div className="flex-1" />
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsCreateTaskOpen?.(true)
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add task</span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="flex flex-col overflow-hidden"
          >
            {isDragDisabled ? (
              listContent
            ) : (
              <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {listContent}
              </SortableContext>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface TaskListProps {
  projectId: string
  tasks: Task[]
  statuses: { id: string; name: string }[]
  projectMembers?: {
    role?: string
    user: {
      id: string
      name?: string | null
      image?: string | null
      email?: string | null
    }
  }[]
  projectTemplate: string
  onSelectTask: (taskId: string) => void
  projectLabels?: { id: string; name: string; color?: string }[]
  setIsCreateTaskOpen?: (open: boolean) => void
  groupBy?: "status" | "assignee" | "type" | "priority" | "epics" | "milestones" | "sprints"
  epics?: Epic[]
  milestones?: Milestone[]
  sprints?: Sprint[]
  sortBy?: "position" | "title" | "dueDate" | "priority" | "createdAt"
  sortOrder?: "asc" | "desc"
}

export function TaskList({
  projectId,
  tasks: initialTasks,
  statuses,
  projectMembers = [],
  projectTemplate,
  onSelectTask,
  projectLabels = [],
  setIsCreateTaskOpen,
  groupBy = "status",
  epics = [],
  milestones = [],
  sprints = [],
  sortBy = "position",
  sortOrder = "asc",
}: TaskListProps) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({})
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  const [prevTasks, setPrevTasks] = useState<Task[]>(initialTasks)
  const [prevSortBy, setPrevSortBy] = useState<string>(sortBy)
  const [prevSortOrder, setPrevSortOrder] = useState<string>(sortOrder)

  const sortedTasks = useMemo(() => {
    const getPriorityWeight = (priority?: string) => {
      switch (priority?.toLowerCase()) {
        case "urgent":
        case "critical":
        case "highest":
          return 5
        case "high":
          return 4
        case "medium":
          return 3
        case "low":
          return 2
        case "lowest":
        default:
          return 1
      }
    }

    return [...initialTasks].sort((a, b) => {
      if (sortBy === "title") {
        const comp = (a.title || "").localeCompare(b.title || "")
        return sortOrder === "asc" ? comp : -comp
      }
      if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        const comp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        return sortOrder === "asc" ? comp : -comp
      }
      if (sortBy === "priority") {
        const comp = getPriorityWeight(a.priority) - getPriorityWeight(b.priority)
        return sortOrder === "asc" ? comp : -comp
      }
      if (sortBy === "createdAt") {
        if (!a.createdAt && !b.createdAt) return 0
        if (!a.createdAt) return 1
        if (!b.createdAt) return -1
        const comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        return sortOrder === "asc" ? comp : -comp
      }
      return (a.position || 0) - (b.position || 0)
    })
  }, [initialTasks, sortBy, sortOrder])

  const [listTasks, setListTasks] = useState<Task[]>(sortedTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const updateTaskOrderMutation = useUpdateTaskOrder(projectId)

  if (
    initialTasks !== prevTasks ||
    sortBy !== prevSortBy ||
    sortOrder !== prevSortOrder
  ) {
    setPrevTasks(initialTasks)
    setPrevSortBy(sortBy)
    setPrevSortOrder(sortOrder)
    setListTasks(sortedTasks)
  }

  const toggleSection = (statusId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [statusId]: !prev[statusId],
    }))
  }

  const groups = useMemo(() => {
    switch (groupBy) {
      case "assignee": {
        const memberGroups = projectMembers.map((m) => ({
          id: m.user.id,
          name: m.user.name || "Unknown User",
          color: undefined,
        }))
        return [
          ...memberGroups,
          { id: "unassigned", name: "Unassigned", color: undefined },
        ]
      }
      case "type":
        return [
          { id: "task", name: "Task", color: undefined },
          { id: "bug", name: "Bug", color: undefined },
          { id: "feature", name: "Feature", color: undefined },
        ]
      case "priority":
        return [
          { id: "urgent", name: "Urgent", color: undefined },
          { id: "high", name: "High", color: undefined },
          { id: "medium", name: "Medium", color: undefined },
          { id: "low", name: "Low", color: undefined },
          { id: "lowest", name: "Lowest", color: undefined },
        ]
      case "epics": {
        const epicGroups = (epics || []).map((ep) => ({
          id: ep.id,
          name: ep.title,
          color: ep.color,
        }))
        return [
          ...epicGroups,
          { id: "no-epic", name: "No Epic", color: undefined },
        ]
      }
      case "milestones": {
        const milestoneGroups = (milestones || []).map((ms) => ({
          id: ms.id,
          name: ms.title,
          color: undefined,
        }))
        return [
          ...milestoneGroups,
          { id: "no-milestone", name: "No Milestone", color: undefined },
        ]
      }
      case "sprints": {
        const sprintGroups = (sprints || []).map((sp) => ({
          id: sp.id,
          name: sp.name,
          color: undefined,
        }))
        return [
          ...sprintGroups,
          { id: "no-sprint", name: "No Sprint", color: undefined },
        ]
      }
      case "status":
      default:
        return statuses.length > 0 ? statuses : [{ id: "unknown", name: "Backlog", color: undefined }]
    }
  }, [groupBy, projectMembers, epics, milestones, sprints, statuses])

  const getTasksForGroup = (groupId: string) => {
    switch (groupBy) {
      case "assignee":
        if (groupId === "unassigned") {
          return listTasks.filter((t) => !t.assigneeId || t.assigneeId === "null")
        }
        return listTasks.filter((t) => t.assigneeId === groupId)
      case "type":
        return listTasks.filter((t) => t.type?.toLowerCase() === groupId)
      case "priority":
        return listTasks.filter((t) => t.priority?.toLowerCase() === groupId)
      case "epics":
        if (groupId === "no-epic") {
          return listTasks.filter((t) => !t.epicId || t.epicId === "null")
        }
        return listTasks.filter((t) => t.epicId === groupId)
      case "milestones":
        if (groupId === "no-milestone") {
          return listTasks.filter((t) => !t.milestoneId || t.milestoneId === "null")
        }
        return listTasks.filter((t) => t.milestoneId === groupId)
      case "sprints":
        if (groupId === "no-sprint") {
          return listTasks.filter((t) => !t.sprintId || t.sprintId === "null")
        }
        return listTasks.filter((t) => t.sprintId === groupId)
      case "status":
      default:
        return listTasks.filter(
          (t) =>
            t.statusId === groupId ||
            (!t.statusId && groupId === groups[0].id)
        )
    }
  }

  const handleToggleSelect = (taskId: string, selected: boolean) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      if (selected) next.add(taskId)
      else next.delete(taskId)
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(listTasks.map((t) => t.id)))
    } else {
      setSelectedTasks(new Set())
    }
  }

  const allSelected =
    listTasks.length > 0 && selectedTasks.size === listTasks.length

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveTask(listTasks.find((t) => t.id === active.id) || null)
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === "Task"
    const isOverTask = over.data.current?.type === "Task"
    const isOverSection = over.data.current?.type === "StatusSection"

    if (!isActiveTask) return

    setListTasks((tasks) => {
      const activeIndex = tasks.findIndex((t) => t.id === activeId)
      const overIndex = tasks.findIndex((t) => t.id === overId)

      if (isOverTask) {
        const activeTask = tasks[activeIndex]
        const overTask = tasks[overIndex]
        if (activeTask.statusId !== overTask.statusId) {
          const newTasks = [...tasks]
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            statusId: overTask.statusId,
          }
          return arrayMove(newTasks, activeIndex, overIndex)
        }
        return arrayMove(tasks, activeIndex, overIndex)
      }

      if (isOverSection) {
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
    const activeTask = listTasks.find((t) => t.id === activeId)
    if (!activeTask) return

    const statusTasks = listTasks.filter(
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

    setListTasks((prevTasks) =>
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

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.4" } },
    }),
  }

  if (listTasks.length === 0) {
    return (
      <Card className="m-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card px-4 py-16 text-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <IconStack aria-hidden="true" className="h-24 w-22 text-primary">
                <CheckSquare
                  className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                />
              </IconStack>
            </EmptyMedia>
            <EmptyTitle>No task found.</EmptyTitle>
            <EmptyDescription>
              No tasks match your search query or filters in this view. Try
              adjusting your filters above or create a new task to get started.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    )
  }

  const listContainer = (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md border border-border bg-background shadow-sm">
      <div className="h-full w-full overflow-auto" ref={setScrollElement}>
        <div className="flex min-w-[1100px] flex-col">
          {/* Header */}
          <div
            className={cn(
              "sticky top-0 z-20 grid h-9 border-b border-border bg-card/95 text-xs font-semibold text-muted-foreground uppercase tracking-wider shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur-sm",
              gridCols
            )}
          >
            <div className="flex items-center justify-center px-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(c) => handleSelectAll(c as boolean)}
              />
            </div>
            <div className="flex items-center px-3">ID</div>
            <div className="flex items-center px-3">Title</div>
            <div className="flex items-center px-3">Status</div>
            <div className="flex items-center px-3">Priority</div>
            <div className="flex items-center px-3">Progress</div>
            <div className="flex items-center px-3">Assignee</div>
            <div className="flex items-center px-3">Due Date</div>
            <div className="flex items-center px-3"></div>
          </div>

          {/* Body */}
          <div className="flex flex-col pb-6">
            {groups.map((group) => {
              const groupTasks = getTasksForGroup(group.id)

              return (
                <StatusSection
                  key={group.id}
                  status={group}
                  tasks={groupTasks}
                  projectTemplate={projectTemplate}
                  onSelectTask={onSelectTask}
                  projectLabels={projectLabels}
                  isCollapsed={!!collapsedSections[group.id]}
                  onToggle={() => toggleSection(group.id)}
                  selectedTasks={selectedTasks}
                  onToggleSelect={handleToggleSelect}
                  projectId={projectId}
                  statuses={statuses}
                  projectMembers={projectMembers || []}
                  scrollElement={scrollElement}
                  setIsCreateTaskOpen={setIsCreateTaskOpen}
                  isDragDisabled={groupBy !== "status" || sortBy !== "position"}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  if (groupBy !== "status" || sortBy !== "position") {
    return listContainer
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {listContainer}
      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
          <div className="scale-[1.01] cursor-grabbing overflow-hidden rounded-md border border-border bg-background shadow-2xl">
            <TaskRow
              task={activeTask}
              projectTemplate={projectTemplate}
              onSelectTask={onSelectTask}
              projectLabels={projectLabels}
              isSelected={selectedTasks.has(activeTask.id)}
              onToggleSelect={handleToggleSelect}
              projectId={projectId}
              statuses={statuses}
              projectMembers={projectMembers || []}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
