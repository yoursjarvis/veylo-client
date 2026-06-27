"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { TaskDependency } from "@/types/models";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  AlertCircle,
  CheckSquare,
  ArrowUp,
  ArrowDown,
  Lock,
} from "lucide-react";
import {
  format,
  addDays,
  addMonths,
  addWeeks,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  isToday,
} from "date-fns";

interface ProjectTimelineProps {
  workspaceId: string;
  onSelectTask: (taskId: string) => void;
}

type TimelineTask = {
  id: string;
  title: string;
  projectTitle: string;
  type: string;
  priority: string;
  status: { name: string; category: string };
  createdAt: string;
  dueDate?: string;
  blockedByDependencies?: TaskDependency[];
  assignee?: { name?: string; image?: string };
  deletedAt?: string;
};

type ZoomLevel = "weeks" | "months" | "quarters";

export function ProjectTimeline({
  workspaceId,
  onSelectTask,
}: ProjectTimelineProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("months");
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch all projects in this workspace
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/projects`);
      return response.data.data;
    },
    enabled: !!workspaceId,
  });

  // 2. Fetch tasks for all projects in parallel
  const taskResults = useQueries({
    queries: projects.map((p: { id: string; title: string }) => ({
      queryKey: ["tasks", p.id],
      queryFn: async () => {
        const response = await axiosInstance.get(`/projects/${p.id}/tasks`);
        return {
          projectId: p.id,
          projectTitle: p.title,
          tasks: response.data.data,
        };
      },
      enabled: !!p.id,
    })),
  });

  const isTasksLoading = taskResults.some((r) => r.isLoading);

  // 3. Combine tasks across all projects
  const allProjectsTasks = useMemo(() => {
    const list: TimelineTask[] = [];
    taskResults.forEach((r) => {
      const data = r.data as { projectTitle: string; tasks: Omit<TimelineTask, "projectTitle">[] } | undefined;
      if (data) {
        const { projectTitle, tasks } = data;
        tasks?.forEach((t: Omit<TimelineTask, "projectTitle">) => {
          list.push({
            ...t,
            projectTitle,
          });
        });
      }
    });
    return list.filter((t) => !t.deletedAt);
  }, [taskResults]);

  // 4. Calculate date range boundaries for columns based on Zoom Level
  const { startDate, endDate, columns } = useMemo(() => {
    let start: Date;
    let end: Date;
    const cols: { start: Date; end: Date; label: string; subLabel: string; parentLabel: string }[] = [];

    if (zoom === "weeks") {
      // 16 columns of weeks. Base date centered (index 4)
      start = startOfWeek(addWeeks(baseDate, -4), { weekStartsOn: 1 });
      end = endOfWeek(addWeeks(start, 15), { weekStartsOn: 1 });

      for (let i = 0; i < 16; i++) {
        const wStart = startOfWeek(addWeeks(start, i), { weekStartsOn: 1 });
        const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        cols.push({
          start: wStart,
          end: wEnd,
          label: format(wStart, "d MMM"),
          subLabel: `W${format(wStart, "w")}`,
          parentLabel: format(wStart, "MMMM yyyy"),
        });
      }
    } else if (zoom === "quarters") {
      // 8 columns of quarters. Base date centered (index 2)
      start = startOfQuarter(addMonths(baseDate, -6));
      end = endOfQuarter(addMonths(start, 7 * 3));

      for (let i = 0; i < 8; i++) {
        const qStart = startOfQuarter(addMonths(start, i * 3));
        const qEnd = endOfQuarter(addMonths(qStart, 2));
        const quarterNum = Math.floor(qStart.getMonth() / 3) + 1;
        cols.push({
          start: qStart,
          end: qEnd,
          label: `Q${quarterNum}`,
          subLabel: format(qStart, "yyyy"),
          parentLabel: format(qStart, "yyyy"),
        });
      }
    } else {
      // "months" view (default): 12 columns of months. Base date centered (index 3)
      start = startOfMonth(addMonths(baseDate, -3));
      end = endOfMonth(addMonths(start, 11));

      for (let i = 0; i < 12; i++) {
        const mStart = startOfMonth(addMonths(start, i));
        const mEnd = endOfMonth(mStart);
        cols.push({
          start: mStart,
          end: mEnd,
          label: format(mStart, "MMM"),
          subLabel: format(mStart, "yyyy"),
          parentLabel: format(mStart, "yyyy"),
        });
      }
    }

    return { startDate: start, endDate: end, columns: cols };
  }, [zoom, baseDate]);

  // Total scope width in days
  const totalDays = useMemo(() => {
    return differenceInDays(endDate, startDate) + 1;
  }, [startDate, endDate]);

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return allProjectsTasks;
    const query = searchQuery.toLowerCase();
    return allProjectsTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.projectTitle.toLowerCase().includes(query)
    );
  }, [allProjectsTasks, searchQuery]);

  // Navigation handlers
  const handlePrev = () => {
    if (zoom === "weeks") setBaseDate((d) => addWeeks(d, -4));
    else if (zoom === "quarters") setBaseDate((d) => addMonths(d, -9));
    else setBaseDate((d) => addMonths(d, -3));
  };

  const handleNext = () => {
    if (zoom === "weeks") setBaseDate((d) => addWeeks(d, 4));
    else if (zoom === "quarters") setBaseDate((d) => addMonths(d, 9));
    else setBaseDate((d) => addMonths(d, 3));
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  // Render priority icon helper
  const renderPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <ArrowUp className="h-3 w-3 text-red-500 stroke-[3px]" />;
      case "high":
        return <ArrowUp className="h-3 w-3 text-amber-500 stroke-[2px]" />;
      case "medium":
        return <ArrowUp className="h-3 w-3 text-primary stroke-[1.5px]" />;
      default:
        return <ArrowDown className="h-3 w-3 text-teal-400" />;
    }
  };

  // Render task type icon helper
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      case "feature":
        return <Sparkles className="h-3.5 w-3.5 text-purple-400" />;
      default:
        return <CheckSquare className="h-3.5 w-3.5 text-blue-400" />;
    }
  };

  // Today reference line offset
  const todayOffsetPercent = useMemo(() => {
    const today = new Date();
    if (today < startDate || today > endDate) return null;
    const offset = differenceInDays(today, startDate);
    return (offset / totalDays) * 100;
  }, [startDate, endDate, totalDays]);

  if (isProjectsLoading || isTasksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Today, Prev/Next, Zoom Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search roadmap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-background border-border placeholder:text-muted-foreground/60 w-full"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timeline Navigation */}
          <div className="flex items-center gap-1 border border-border rounded-lg bg-background p-1 h-9">
            <Button
              variant="ghost"
              size="xs"
              className="text-[11px] font-semibold h-7"
              onClick={handleToday}
            >
              Today
            </Button>
            <div className="h-4 w-px bg-border/80" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Level Switcher */}
          <div className="flex items-center border border-border rounded-lg bg-background p-1 h-9 font-semibold text-[11px]">
            {(["weeks", "months", "quarters"] as ZoomLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setZoom(level)}
                className={`px-3 py-1 rounded-md capitalize transition-all ${
                  zoom === level
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt Timeline Board */}
      <Card className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="flex divide-x divide-border">
          {/* LEFT PANEL: Task Title List (Sticky Sidebar) */}
          <div className="w-[320px] md:w-[350px] flex-shrink-0 flex flex-col bg-card">
            {/* Header placeholder */}
            <div className="h-[52px] border-b border-border bg-muted/20 px-4 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Projects & Issues
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {filteredTasks.length} Issues
              </span>
            </div>

            {/* Task Row List */}
            <div className="divide-y divide-border/60">
              {filteredTasks.map((task: TimelineTask) => (
                <div
                  key={task.id}
                  className="h-12 px-4 flex items-center gap-2.5 hover:bg-muted/15 transition-colors cursor-pointer min-w-0"
                  onClick={() => onSelectTask(task.id)}
                >
                  <span className="flex-shrink-0">
                    {renderTypeIcon(task.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-mono text-muted-foreground font-bold tracking-tight select-none">
                      {task.projectTitle.slice(0, 3).toUpperCase()}-{(task.id.slice(-4))}
                    </span>
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">
                      {task.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {renderPriorityIcon(task.priority)}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        task.status.category === "done"
                          ? "bg-green-500/10 text-green-500"
                          : task.status.category === "in_progress"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {task.status.name}
                    </span>
                  </div>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground italic px-4 text-center">
                  No issues found matching query.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Scrollable Timeline grid */}
          <div className="flex-1 overflow-x-auto relative">
            <div className="min-w-[900px] select-none relative">
              {/* Today vertical line */}
              {todayOffsetPercent !== null && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-500/60 z-30 pointer-events-none"
                  style={{ left: `${todayOffsetPercent}%` }}
                >
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm border border-white" />
                </div>
              )}

              {/* TIMELINE GRID HEADER */}
              <div className="h-[52px] border-b border-border bg-muted/20 flex flex-col justify-between">
                {/* Year/Month Major Labels */}
                <div className="flex-1 flex border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider items-center">
                  {columns.map((col, idx) => (
                    <div
                      key={idx}
                      className="flex-1 border-l border-border/40 pl-2 truncate"
                    >
                      {col.parentLabel}
                    </div>
                  ))}
                </div>
                {/* Subheader Column Units */}
                <div className="flex-1 flex text-[10px] font-bold text-foreground items-center text-center">
                  {columns.map((col, idx) => {
                    const active = isToday(col.start) || (new Date() >= col.start && new Date() <= col.end);
                    return (
                      <div
                        key={idx}
                        className={`flex-1 border-l border-border/40 py-0.5 truncate ${
                          active ? "text-primary font-black" : ""
                        }`}
                      >
                        {col.label}
                        <span className="text-[8px] text-muted-foreground ml-1">
                          {zoom === "weeks" ? col.subLabel : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TIMELINE GRID BODY */}
              <div className="divide-y divide-border/60 relative">
                {filteredTasks.map((task: TimelineTask) => {
                  // Task schedules
                  const start = new Date(task.createdAt);
                  const end = task.dueDate ? new Date(task.dueDate) : addDays(start, 7);

                  let leftPercent = 0;
                  let widthPercent = 0;

                  // Out of bounds checks
                  if (end < startDate || start > endDate) {
                    leftPercent = -1;
                    widthPercent = -1;
                  } else {
                    const clampedStart = start < startDate ? startDate : start;
                    const clampedEnd = end > endDate ? endDate : end;

                    const leftDays = differenceInDays(clampedStart, startDate);
                    const barDays = differenceInDays(clampedEnd, clampedStart) + 1;

                    leftPercent = (leftDays / totalDays) * 100;
                    widthPercent = (barDays / totalDays) * 100;
                  }

                  const visible = leftPercent >= 0 && widthPercent > 0;

                  return (
                    <div
                      key={task.id}
                      className="h-12 relative flex items-center hover:bg-muted/5 transition-colors"
                    >
                      {/* Column dividing guidelines */}
                      {columns.map((_, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-full border-l border-border/20 pointer-events-none"
                        />
                      ))}

                      {/* Scheduling Gantt Bar */}
                      {visible && (
                        <div
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          onClick={() => onSelectTask(task.id)}
                          className={`absolute h-7 rounded-lg px-2.5 flex items-center justify-between text-[10px] font-bold shadow-sm cursor-pointer select-none transition-all hover:scale-[1.01] hover:brightness-105 z-10 ${
                            task.status.category === "done"
                              ? "bg-green-500/70 border border-green-500/30 line-through"
                              : task.priority === "urgent"
                              ? "bg-red-500 border border-red-400"
                              : task.priority === "high"
                              ? "bg-amber-500 border border-amber-400"
                              : task.priority === "medium"
                              ? "bg-primary border border-primary/50"
                              : "bg-teal-500 border border-teal-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {(task.blockedByDependencies?.length || 0) > 0 && (
                              <Lock className="h-3 w-3 flex-shrink-0 animate-pulse text-red-200" />
                            )}
                            <span className="truncate pr-2 select-none">
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[8.5px] opacity-90 select-none">
                              {task.dueDate ? format(new Date(task.dueDate), "d MMM") : "No due date"}
                            </span>
                            <Avatar className="h-4 w-4 border border-white/40 shadow-xs flex-shrink-0">
                              <AvatarImage src={task.assignee?.image || ""} />
                              <AvatarFallback className="text-[8px] bg-muted-foreground text-foreground uppercase">
                                {task.assignee?.name?.slice(0, 2) || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="h-48 flex items-center justify-center pointer-events-none" />
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
