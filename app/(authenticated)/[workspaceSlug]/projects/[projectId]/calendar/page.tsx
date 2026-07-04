"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  LockedIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { useMemo, useState } from "react"
import { useProject } from "../layout"

interface TaskItem {
  id: string
  taskKey: string
  title: string
  dueDate?: string | null
  priority: string
  status: { name: string; category: string }
  assignee?: { name?: string; image?: string | null } | null
  isPrivate?: boolean
}

export default function CalendarPage() {
  const { projectId, handleSelectTask, setIsCreateTaskOpen } = useProject()
  const [currentDate, setCurrentDate] = useState(new Date())

  // Fetch all tasks for the project without filtering out any initially on the server,
  // but we can add filter options in the UI.
  const { data: tasks, isLoading } = useProjectTasks(projectId)

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const setToday = () => setCurrentDate(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [startDate, endDate])

  const tasksByDay = useMemo(() => {
    const map: Record<string, TaskItem[]> = {}
    if (!tasks) return map

    tasks.forEach((task: TaskItem) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd")
        if (!map[dateKey]) {
          map[dateKey] = []
        }
        map[dateKey].push(task)
      }
    })
    return map
  }, [tasks])

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
      case "high":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      case "medium":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full space-y-6 p-6 w-full">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="flex-1 w-full rounded-lg min-h-[500px]" />
      </div>
    )
  }

  return (
    <div className="flex h-full animate-in flex-col gap-6 bg-background text-foreground duration-300 fade-in-50">
      {/* Calendar Header / Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-md sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <HugeiconsIcon
              icon={Calendar03Icon}
              className="h-5 w-5 font-bold"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Editorial Calendar
            </h1>
            <p className="text-xs text-muted-foreground">
              Track campaigns, milestones, and deliverable deadlines.
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="h-8 w-8 rounded-md"
              aria-label="Previous month"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                className="h-4 w-4"
                strokeWidth={2.5}
              />
            </Button>
            <Button
              variant="ghost"
              onClick={setToday}
              className="h-8 rounded-md px-3 text-xs font-semibold"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="h-8 w-8 rounded-md"
              aria-label="Next month"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="h-4 w-4"
                strokeWidth={2.5}
              />
            </Button>
          </div>

          <span className="min-w-30 text-center text-sm font-bold">
            {format(currentDate, "MMMM yyyy")}
          </span>

          <Button
            size="sm"
            onClick={() => setIsCreateTaskOpen(true)}
            className="h-9 gap-2 rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/95"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 px-1 text-center text-xs font-bold tracking-wider text-muted-foreground/80 uppercase">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid min-h-125 flex-1 grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd")
          const dayTasks = tasksByDay[dateKey] || []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isDayToday = isToday(day)

          return (
            <div
              key={index}
              className={`flex min-h-25 flex-col rounded-xl border border-border/40 p-2 transition-all duration-200 ${
                isCurrentMonth
                  ? "bg-card/40 dark:bg-card/25"
                  : "bg-muted/10 opacity-40"
              } ${isDayToday ? "border-primary/30 bg-primary/5 ring-2 ring-primary/80" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isDayToday
                      ? "bg-primary font-extrabold text-primary-foreground shadow-xs"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                  </span>
                )}
              </div>

              {/* Day Tasks List */}
              <div className="custom-scrollbar flex max-h-30 flex-col gap-1.5 overflow-y-auto">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task.id)}
                    className="group flex cursor-pointer flex-col rounded-lg border border-border/50 bg-background/80 p-1.5 text-left shadow-2xs transition-all hover:bg-muted/60 active:scale-[0.98]"
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="text-[9px] font-bold tracking-tight text-primary/80 transition-colors group-hover:text-primary">
                        {task.taskKey}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {task.isPrivate && (
                          <HugeiconsIcon
                            icon={LockedIcon}
                            className="h-2.5 w-2.5 text-muted-foreground/60"
                          />
                        )}
                        <span
                          className={`rounded-sm px-1 text-[8px] font-semibold ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <span className="mt-0.5 truncate text-[11px] leading-tight font-medium text-foreground/90">
                      {task.title}
                    </span>
                    {task.assignee && (
                      <span className="mt-1 truncate text-[8px] text-muted-foreground">
                        👤 {task.assignee.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
