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
import React, { useState } from "react"

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
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Bug01FreeIcons,
  CalendarIcon,
  CheckmarkSquare03Icon,
  CircleArrowUp01Icon,
  EqualSignIcon,
  SparklesIcon,
  Target03Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { GripVertical } from "lucide-react"
import { useUpdateTask, useUpdateTaskOrder } from "../hooks/use-tasks"

interface Task {
  id: string
  taskKey?: string
  title: string
  description?: string
  statusId?: string
  priority: string
  type: string
  status: { name: string }
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
}

const gridCols =
  "grid-cols-[32px_40px_40px_90px_minmax(300px,1fr)_140px_140px_160px_140px_160px_120px]"

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "bug":
      return (
        <HugeiconsIcon
          icon={Bug01FreeIcons}
          className="h-4 w-4 text-destructive"
        />
      )
    case "feature":
    case "story":
      return <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4 text-info" />
    default:
      return (
        <HugeiconsIcon
          icon={CheckmarkSquare03Icon}
          className="h-4 w-4 text-primary"
        />
      )
  }
}

const getPriorityIcon = (prio: string) => {
  switch (prio.toLowerCase()) {
    case "urgent":
    case "highest":
      return (
        <HugeiconsIcon
          icon={CircleArrowUp01Icon}
          className="h-10 w-10 text-destructive"
          strokeWidth={2.5}
        />
      )
    case "high":
      return (
        <HugeiconsIcon
          icon={ArrowUp01Icon}
          className="h-7 w-7 text-destructive"
          strokeWidth={2.5}
        />
      )
    case "medium":
      return (
        <HugeiconsIcon
          icon={EqualSignIcon}
          className="h-7 w-7 text-warning"
          strokeWidth={2}
        />
      )
    case "low":
      return (
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="h-7 w-7 text-primary"
          strokeWidth={2.5}
        />
      )
    case "lowest":
      return (
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="h-7 w-7 text-muted-foreground"
          strokeWidth={2.5}
        />
      )
    default:
      return (
        <HugeiconsIcon
          icon={EqualSignIcon}
          className="h-7 w-7 text-muted-foreground"
          strokeWidth={2.5}
        />
      )
  }
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
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={selectedUser.image || undefined} />
                        <AvatarFallback className="text-2xs">
                          {selectedUser.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{selectedUser.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted text-muted-foreground">
                        <HugeiconsIcon icon={UserIcon} className="h-4 w-4" />
                      </div>
                      <span className="truncate text-muted-foreground italic">
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
                  <HugeiconsIcon icon={UserIcon} className="h-4 w-4" />
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
                  <Avatar className="mr-2 h-7 w-7 shrink-0">
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback className="text-2xs">
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
                format(new Date(value), "MMM d, yyyy")
              ) : (
                <span className="italic opacity-70">No date</span>
              )}
            </span>
            <HugeiconsIcon
              icon={CalendarIcon}
              className="ml-1 h-4 w-4 shrink-0 opacity-50"
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
              <>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      !selectedStatus.color && "bg-primary/60"
                    )}
                    style={
                      selectedStatus.color
                        ? { backgroundColor: selectedStatus.color }
                        : undefined
                    }
                  />
                </div>
                <span className="truncate">{selectedStatus.name}</span>
              </>
            ) : (
              <>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-transparent" />
                </div>
                <span className="truncate text-muted-foreground italic">
                  {placeholder}
                </span>
              </>
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

const PRIORITIES = [
  { value: "lowest", label: "Lowest" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

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
  const selectedPriority = PRIORITIES.find(
    (p) => p.value === value?.toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center gap-2 overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:bg-muted focus:outline-none"
          >
            {selectedPriority ? (
              <>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {getPriorityIcon(selectedPriority.value)}
                </div>
                <span className="truncate">{selectedPriority.label}</span>
              </>
            ) : (
              <>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted text-muted-foreground">
                  <HugeiconsIcon icon={EqualSignIcon} className="h-10 w-10" />
                </div>
                <span className="truncate text-muted-foreground italic">
                  {placeholder}
                </span>
              </>
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
  onSelectTask,
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
        "group grid cursor-pointer items-center border-b border-border/50 transition-colors duration-200 hover:bg-muted/50",
        gridCols,
        isSelected ? "bg-primary/5" : "bg-card"
      )}
    >
      <div className="flex items-center justify-center px-1 py-2">
        <div
          {...(dragHandleProps || {})}
          {...(dragHandleListeners || {})}
          className="cursor-grab rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
      <div
        className="flex items-center justify-center px-3 py-2"
        onClick={handleCheckboxClick}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(c) => handleCheckboxChange(c as boolean)}
        />
      </div>
      <div
        className="flex items-center justify-center px-3 py-2"
        title={task.type}
      >
        {getTypeIcon(task.type)}
      </div>
      <div
        className="truncate px-3 py-2 text-xs font-normal text-muted-foreground"
        title={taskKey}
      >
        {taskKey}
      </div>
      <div className="flex items-center overflow-hidden px-3 py-2">
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
            className="h-8 w-full px-2 py-0.5 text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingTitle(true)
            }}
            className="block cursor-text truncate text-sm font-semibold text-foreground decoration-primary underline-offset-2 hover:underline"
          >
            {task.title}
          </span>
        )}
      </div>
      <div className="flex items-center truncate px-3 py-2">
        <StatusSelect
          value={task.statusId || null}
          onChange={(val) => updateTaskMutation.mutate({ statusId: val })}
          statuses={statuses}
        />
      </div>
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
      <div className="flex items-center truncate px-3 py-2">
        <UserSelect
          value={task.assigneeId || null}
          onChange={(val) => updateTaskMutation.mutate({ assigneeId: val })}
          users={projectMembers}
          placeholder="Unassigned"
        />
      </div>
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
      <div className="flex items-center truncate px-3 py-2">
        <UserSelect
          value={task.reporterId || null}
          onChange={(val) => updateTaskMutation.mutate({ reporterId: val })}
          users={projectMembers}
          placeholder="Unassigned"
        />
      </div>
      <div className="flex items-center truncate px-3 py-2 text-xs text-muted-foreground">
        {task.createdAt ? format(new Date(task.createdAt), "MMM d, yyyy") : "-"}
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
  })

  if (tasks.length === 0) {
    return (
      <div
        className={cn(
          "mb-4 flex flex-col",
          isOver && "rounded-md bg-primary/5 outline-1 outline-primary/30"
        )}
        ref={setNodeRef}
      >
        <div
          className="group cursor-pointer border-b border-border/50 bg-muted/20 transition-colors hover:bg-muted/40"
          onClick={onToggle}
        >
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="p-0.5 text-muted-foreground transition-colors group-hover:text-foreground">
              {isCollapsed ? (
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              ) : (
                <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
              )}
            </div>
            <div className="flex h-full items-center gap-1.5">
              {status.color && (
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
              )}
              <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase transition-colors group-hover:text-foreground">
                {status.name}{" "}
                <span className="ml-1 font-medium text-muted-foreground/60">
                  ({tasks.length})
                </span>
              </h3>
            </div>
          </div>
        </div>
        {!isCollapsed && (
          <div
            className={cn(
              "mx-2 my-2 flex h-12 items-center justify-center rounded-md border-2 border-dashed border-border/40 text-2xs font-medium text-muted-foreground/50 transition-colors",
              isOver && "border-primary/40 bg-primary/5 text-primary/70"
            )}
          >
            Drop tasks here
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col pb-4",
        isOver && "bg-primary/5 outline-1 outline-primary/20"
      )}
      ref={setNodeRef}
    >
      <div
        className="group sticky top-9 z-10 cursor-pointer border-b border-border/50 bg-muted/30 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur-md transition-colors hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className="p-0.5 text-muted-foreground transition-colors group-hover:text-foreground">
            {isCollapsed ? (
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            ) : (
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
            )}
          </div>
          <div className="flex h-full items-center gap-1.5">
            {status.color && (
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: status.color }}
              />
            )}
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase transition-colors group-hover:text-foreground">
              {status.name}{" "}
              <span className="ml-1 font-medium text-muted-foreground/60">
                ({tasks.length})
              </span>
            </h3>
          </div>
        </div>
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
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
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
                    </div>
                  )
                })}
              </div>
            </SortableContext>
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
}

export function TaskList({
  projectId,
  tasks: initialTasks,
  statuses,
  projectMembers = [],
  projectTemplate,
  onSelectTask,
  projectLabels = [],
}: TaskListProps) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({})
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  const [prevTasks, setPrevTasks] = useState<Task[]>(initialTasks)
  const [listTasks, setListTasks] = useState<Task[]>(() =>
    [...initialTasks].sort((a, b) => (a.position || 0) - (b.position || 0))
  )
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const updateTaskOrderMutation = useUpdateTaskOrder(projectId)

  if (initialTasks !== prevTasks) {
    setPrevTasks(initialTasks)
    setListTasks(
      [...initialTasks].sort((a, b) => (a.position || 0) - (b.position || 0))
    )
  }

  const toggleSection = (statusId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [statusId]: !prev[statusId],
    }))
  }

  const activeStatuses =
    statuses.length > 0 ? statuses : [{ id: "unknown", name: "Backlog" }]

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
                <HugeiconsIcon
                  icon={Target03Icon}
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md border border-border bg-background shadow-sm">
        <div className="h-full w-full overflow-auto" ref={setScrollElement}>
          <div className="flex min-w-325 flex-col">
            {/* Header */}
            <div
              className={cn(
                "sticky top-0 z-20 grid h-9 border-b border-border bg-background/95 text-xs font-semibold text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur-sm",
                gridCols
              )}
            >
              <div className="flex items-center justify-center px-3">
                {/* Space for drag handle */}
              </div>
              <div className="flex items-center justify-center px-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(c) => handleSelectAll(c as boolean)}
                />
              </div>
              <div className="flex items-center justify-center px-3">Type</div>
              <div className="flex items-center px-3">Key</div>
              <div className="flex items-center px-3">Summary</div>
              <div className="flex items-center px-3">Status</div>
              <div className="flex items-center px-3">Priority</div>
              <div className="flex items-center px-3">Assignee</div>
              <div className="flex items-center px-3">Due Date</div>
              <div className="flex items-center px-3">Reporter</div>
              <div className="flex items-center px-3">Created At</div>
            </div>

            {/* Body */}
            <div className="flex flex-col pb-6">
              {activeStatuses.map((status) => {
                const statusTasks = listTasks.filter(
                  (t) =>
                    t.statusId === status.id ||
                    (!t.statusId && status.id === activeStatuses[0].id)
                )

                return (
                  <StatusSection
                    key={status.id}
                    status={status}
                    tasks={statusTasks}
                    projectTemplate={projectTemplate}
                    onSelectTask={onSelectTask}
                    projectLabels={projectLabels}
                    isCollapsed={!!collapsedSections[status.id]}
                    onToggle={() => toggleSection(status.id)}
                    selectedTasks={selectedTasks}
                    onToggleSelect={handleToggleSelect}
                    projectId={projectId}
                    statuses={statuses}
                    projectMembers={projectMembers || []}
                    scrollElement={scrollElement}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
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
