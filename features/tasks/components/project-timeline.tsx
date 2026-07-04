"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { TaskDependency } from "@/types/models";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Search } from "lucide-react";
import { addDays, format } from "date-fns";
import { Gantt, Willow, WillowDark } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectTimelineProps {
  workspaceId: string;
  projectId?: string;
  onSelectTask: (taskId: string) => void;
}

type TimelineTask = {
  id: string;
  title: string;
  projectId: string;
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

type ZoomLevel = "Day" | "Week" | "Month";

interface GlobalTaskCacheEntry {
  title: string;
  projectTitle: string;
  statusName: string;
  priority: string;
  assigneeName: string;
}

const globalTasksCache = new Map<string, GlobalTaskCacheEntry>();

interface GanttTaskData {
  id?: string | number;
  text?: string;
  progress?: number;
  start?: Date | string;
  end?: Date | string;
  type?: string;
}

function GanttTaskBarWithTooltip({ data }: { data: GanttTaskData }) {
  const taskId = data.id;
  const metadata = taskId ? globalTasksCache.get(String(taskId)) : null;

  const text = metadata?.title || data.text || "Untitled Task";
  const projectTitle = metadata?.projectTitle || "N/A";
  const statusName = metadata?.statusName || "Unknown";
  const priority = metadata?.priority || "Medium";
  const assigneeName = metadata?.assigneeName || "Unassigned";
  const progress = data.progress !== undefined ? data.progress : 0;

  const startFormatted = data.start ? format(new Date(data.start), "MMM dd, yyyy") : "";
  const endFormatted = data.end ? format(new Date(data.end), "MMM dd, yyyy") : "";

  const isMilestone = data.type === "milestone";

  return (
    <Tooltip>
      <TooltipTrigger className="absolute inset-0 z-1 w-full h-full flex items-center px-2 text-white text-[11px] truncate cursor-pointer font-medium select-none border-none bg-transparent outline-none">
        {!isMilestone && text}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="p-3 bg-popover border border-border rounded-xl shadow-lg min-w-[220px] text-xs space-y-2 text-popover-foreground z-50 bg-white dark:bg-slate-950"
      >
        <div className="font-bold text-sm border-b border-border/50 pb-1.5">{text}</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">Project:</span>
          <span className="truncate">{projectTitle}</span>

          <span className="font-semibold text-foreground/80">Dates:</span>
          <span>{startFormatted} - {endFormatted}</span>

          <span className="font-semibold text-foreground/80">Status:</span>
          <span>{statusName}</span>

          <span className="font-semibold text-foreground/80">Priority:</span>
          <span className="capitalize">{priority}</span>

          <span className="font-semibold text-foreground/80">Assignee:</span>
          <span className="truncate">{assigneeName}</span>

          <span className="font-semibold text-foreground/80">Progress:</span>
          <span>{progress}%</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function ProjectTimeline({
  workspaceId,
  projectId,
  onSelectTask,
}: ProjectTimelineProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [api, setApi] = useState<{ exec: (command: string, params: unknown) => void } | null>(null);
  const { resolvedTheme } = useTheme();
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, dueDate }: { taskId: string; dueDate: string | null }) => {
      const response = await axiosInstance.patch(`/tasks/${taskId}`, { dueDate });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      toast.success("Task updated");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to update task");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const handleUpdateTask = (ev: { id?: string | number; task?: { end?: Date | string } }) => {
    if (ev?.id && ev?.task?.end) {
      const newDueDate = new Date(ev.task.end).toISOString();
      updateTaskMutation.mutate({
        taskId: String(ev.id),
        dueDate: newDueDate,
      });
    }
  };

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

  // 2. Fetch tasks (either for the selected project, or for all projects in parallel)
  const { data: singleProjectTasks = [], isLoading: isSingleProjectTasksLoading } = useProjectTasks(projectId || "");

  const taskResults = useQueries({
    queries: (!projectId ? projects : []).map((p: { id: string; title: string }) => ({
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

  const isTasksLoading = projectId
    ? isSingleProjectTasksLoading
    : taskResults.some((r) => r.isLoading);

  // 3. Combine tasks across all projects
  const allProjectsTasks = useMemo<TimelineTask[]>(() => {
    if (projectId) {
      const project = projects.find((p: { id: string; title: string; createdAt?: string }) => p.id === projectId);
      const projectTitle = project?.title || "";
      return (singleProjectTasks || []).map((t: Omit<TimelineTask, "projectId" | "projectTitle">) => ({
        ...t,
        projectId,
        projectTitle,
      })) as TimelineTask[];
    }

    const list: TimelineTask[] = [];
    taskResults.forEach((r) => {
      const data = r.data as { projectId: string; projectTitle: string; tasks: Omit<TimelineTask, "projectTitle" | "projectId">[] } | undefined;
      if (data) {
        const { projectId: pid, projectTitle, tasks } = data;
        tasks?.forEach((t: Omit<TimelineTask, "projectTitle" | "projectId">) => {
          list.push({
            ...t,
            projectId: pid,
            projectTitle,
          });
        });
      }
    });
    return list;
  }, [projectId, projects, singleProjectTasks, taskResults]);

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

  // Map state tasks to SVAR Gantt tasks format
  const ganttTasks = useMemo(() => {
    return filteredTasks.map((t) => {
      const project = projects.find((p: { id: string; title: string; createdAt?: string }) => p.id === t.projectId);
      
      let projectStart = new Date();
      if (project?.createdAt) {
        const parsed = new Date(project.createdAt);
        if (!isNaN(parsed.getTime())) {
          projectStart = parsed;
        }
      }
      if (projectStart.getFullYear() < 2026) {
        projectStart.setFullYear(2026);
      }

      let start = new Date(t.createdAt);
      if (isNaN(start.getTime()) || start.getTime() < projectStart.getTime()) {
        start = projectStart;
      }

      let end = t.dueDate ? new Date(t.dueDate) : addDays(start, 7);
      if (isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
        end = addDays(start, 1);
      }

      const progress = t.status?.category === "done" ? 100 : t.status?.category === "in_progress" ? 50 : 0;

      // Populate global tasks cache for tooltip lookups
      globalTasksCache.set(String(t.id), {
        title: t.title || "Untitled Task",
        projectTitle: t.projectTitle || "N/A",
        statusName: t.status?.name || "Unknown",
        priority: t.priority || "Medium",
        assigneeName: t.assignee?.name || "Unassigned",
      });

      return {
        id: t.id || "",
        text: t.title || "Untitled Task",
        start,
        end,
        progress,
      };
    });
  }, [filteredTasks, projects]);

  const ganttLinks = useMemo(() => {
    const linksList: { id: string; source: string; target: string; type: string }[] = [];
    filteredTasks.forEach((t) => {
      (t.blockedByDependencies || []).forEach((d) => {
        if (filteredTasks.some((ft) => ft.id === d.blockingTaskId)) {
          linksList.push({
            id: `${d.blockingTaskId}-${t.id}`,
            source: d.blockingTaskId,
            target: t.id,
            type: "e2s",
          });
        }
      });
    });
    return linksList;
  }, [filteredTasks]);

  // Handle zooming / scale units dynamically
  const scales = useMemo(() => {
    if (zoom === "Day") {
      return [
        { unit: "month", step: 1, format: "%F %Y" },
        { unit: "day", step: 1, format: "%j" }
      ];
    }
    if (zoom === "Week") {
      return [
        { unit: "month", step: 1, format: "%F %Y" },
        { unit: "week", step: 1, format: "Week %w" }
      ];
    }
    // Month
    return [
      { unit: "year", step: 1, format: "%Y" },
      { unit: "month", step: 1, format: "%F" }
    ];
  }, [zoom]);

  const columns = useMemo(() => [
    { id: "text", header: "Task name", width: 250 },
    { id: "start", header: "Start date", width: 120, align: "center" as const },
    { id: "end", header: "Due date", width: 120, align: "center" as const },
  ], []);

  const handleToday = () => {
    if (api) {
      api.exec("scroll-chart", { date: new Date() });
    }
  };

  // Scroll to today on initial mount
  useEffect(() => {
    if (api) {
      api.exec("scroll-chart", { date: new Date() });
    }
  }, [api]);

  function highlightTime(date: Date, unit: "day" | "hour") {
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    return unit === "day" && weekend ? "wx-weekend" : "";
  }

  if (isProjectsLoading || isTasksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const GanttTheme = resolvedTheme === "dark" ? WillowDark : Willow;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
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
          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-3 h-9 text-xs font-semibold border border-border rounded-lg bg-background hover:bg-muted/30 cursor-pointer text-muted-foreground hover:text-foreground transition-all"
          >
            Today
          </button>

          {/* Zoom Switcher */}
          <div className="flex items-center border border-border rounded-lg bg-background p-1 h-9 font-semibold text-[11px]">
            {(["Day", "Week", "Month"] as ZoomLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setZoom(level)}
                className={`px-3 py-1 rounded-md capitalize transition-all cursor-pointer ${
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
        {ganttTasks.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-muted-foreground italic">
            No tasks found.
          </div>
        ) : (
          <div className="w-full h-[600px] ve-gantt-container">
            <TooltipProvider delay={150}>
              <GanttTheme>
                <Gantt
                  init={setApi}
                  tasks={ganttTasks}
                  links={ganttLinks}
                  columns={columns}
                  scales={scales}
                  highlightTime={highlightTime}
                  taskTemplate={GanttTaskBarWithTooltip}
                  onSelectTask={(ev) => {
                    if (ev?.id) {
                      onSelectTask(String(ev.id));
                    }
                  }}
                  onUpdateTask={handleUpdateTask}
                />
              </GanttTheme>
            </TooltipProvider>
          </div>
        )}
      </Card>
    </div>
  );
}

