"use client";

import React, { useState, useMemo } from "react";
import { useProject } from "../layout";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Lock,
  EyeOff
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek
} from "date-fns";

interface TaskItem {
  id: string;
  taskKey: string;
  title: string;
  dueDate?: string | null;
  priority: string;
  status: { name: string; category: string };
  assignee?: { name?: string; image?: string | null } | null;
  isPrivate?: boolean;
}

export default function CalendarPage() {
  const { projectId, handleSelectTask, setIsCreateTaskOpen } = useProject();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch all tasks for the project without filtering out any initially on the server,
  // but we can add filter options in the UI.
  const { data: tasks, isLoading } = useProjectTasks(projectId);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const setToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    if (!tasks) return map;

    tasks.forEach((task: TaskItem) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
        if (!map[dateKey]) {
          map[dateKey] = [];
        }
        map[dateKey].push(task);
      }
    });
    return map;
  }, [tasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      case "high":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "medium":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full bg-background text-foreground animate-in fade-in-50 duration-300">
      {/* Calendar Header / Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/40 border border-border/40 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Editorial Calendar</h1>
            <p className="text-xs text-muted-foreground">
              Track campaigns, milestones, and deliverable deadlines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center border border-border/80 rounded-lg p-0.5 bg-muted/40">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="h-8 w-8 rounded-md"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={setToday}
              className="h-8 px-3 text-xs font-semibold rounded-md"
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <span className="text-sm font-bold min-w-[120px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>

          <Button
            size="sm"
            onClick={() => setIsCreateTaskOpen(true)}
            className="gap-2 h-9 text-xs font-semibold rounded-lg bg-primary text-primary-foreground shadow-md hover:bg-primary/95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-muted-foreground/80 uppercase tracking-wider px-1">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[500px]">
        {days.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={index}
              className={`flex flex-col min-h-[100px] border border-border/40 rounded-xl p-2 transition-all duration-200 ${
                isCurrentMonth
                  ? "bg-card/40 dark:bg-card/25"
                  : "bg-muted/10 opacity-40"
              } ${isDayToday ? "ring-2 ring-primary/80 bg-primary/5 border-primary/30" : ""}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isDayToday
                      ? "bg-primary text-primary-foreground font-extrabold shadow-xs"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                    {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                  </span>
                )}
              </div>

              {/* Day Tasks List */}
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[120px] custom-scrollbar">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task.id)}
                    className="flex flex-col text-left p-1.5 rounded-lg border border-border/50 bg-background/80 hover:bg-muted/60 active:scale-[0.98] transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-[9px] font-bold tracking-tight text-primary/80 group-hover:text-primary transition-colors">
                        {task.taskKey}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {task.isPrivate && (
                          <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
                        )}
                        <span className={`text-[8px] font-semibold px-1 rounded-sm ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium leading-tight truncate text-foreground/90 mt-0.5">
                      {task.title}
                    </span>
                    {task.assignee && (
                      <span className="text-[8px] text-muted-foreground mt-1 truncate">
                        👤 {task.assignee.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
