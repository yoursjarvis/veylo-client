"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { TaskDependency } from "@/types/models";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Search } from "lucide-react";
import { addDays, format } from "date-fns";
import Gantt from "frappe-gantt";
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

export function ProjectTimeline({
  workspaceId,
  projectId,
  onSelectTask,
}: ProjectTimelineProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("Month");
  const [searchQuery, setSearchQuery] = useState("");
  const ganttContainerRef = useRef<HTMLDivElement | null>(null);
  const ganttInstance = useRef<Gantt | null>(null);
  const hasInitialScrolled = useRef<boolean>(false);
  const prevZoomRef = useRef<ZoomLevel>(zoom);

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
      const project = projects.find((p: any) => p.id == projectId);
      const projectTitle = project?.title || "";
      return (singleProjectTasks || []).map((t: any) => ({
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

  // Map state tasks to Frappe Gantt tasks format
  const ganttTasks = useMemo(() => {
    return filteredTasks.map((t) => {
      const project = projects.find((p: any) => p.id == t.projectId);
      
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
        end = addDays(start, 1); // Ensure at least 1 day duration so the task bar is visible
      }

      const progress = t.status?.category === "done" ? 100 : t.status?.category === "in_progress" ? 50 : 0;
      const deps = (t.blockedByDependencies || [])
        .map((d: any) => d.blockingTaskId)
        .filter((depId: string) => filteredTasks.some((ft) => ft.id === depId))
        .join(",");

      return {
        id: t.id || "",
        name: t.title || "Untitled Task",
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
        progress,
        dependencies: deps,
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
  }, [filteredTasks, projects]);

  // Diagnostic logs to help identify why the timeline might be empty
  console.log("TIMELINE DIAGNOSTIC LOGS:", {
    workspaceId,
    projectId,
    projectsLoaded: projects.length,
    tasksLoaded: singleProjectTasks.length,
    filteredTasksLoaded: filteredTasks.length,
    isProjectsLoading,
    isTasksLoading,
    ganttTasksSample: JSON.stringify(ganttTasks?.slice(0, 3))
  });

  const handleToday = () => {
    const container = ganttContainerRef.current?.querySelector(".gantt-container");
    const todayLine = ganttContainerRef.current?.querySelector(".current-highlight");
    if (container) {
      if (todayLine) {
        const containerRect = container.getBoundingClientRect();
        const todayRect = todayLine.getBoundingClientRect();
        const scrollLeft = container.scrollLeft + todayRect.left - containerRect.left - (containerRect.width / 2);
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      } else {
        container.scrollTo({ left: container.scrollWidth / 2 - container.clientWidth / 2, behavior: "smooth" });
      }
    }
  };

  // Sync and handle Gantt instance lifecycle
  useEffect(() => {
    if (!ganttContainerRef.current || ganttTasks.length === 0) {
      if (ganttInstance.current) {
        ganttContainerRef.current!.innerHTML = "";
        ganttInstance.current = null;
      }
      return;
    }

    try {
      const container = ganttContainerRef.current!;
      
      // Save scroll position of the previous gantt-container (if it existed)
      const prevGanttContainer = container.querySelector(".gantt-container");
      const savedScrollLeft = prevGanttContainer ? prevGanttContainer.scrollLeft : 0;
      const zoomChanged = prevZoomRef.current !== zoom;
      prevZoomRef.current = zoom;

      // Clear previous HTML to prevent duplicates
      container.innerHTML = "";

      ganttInstance.current = new Gantt(container, ganttTasks, {
        view_mode: zoom,
        today_button: false,
        scroll_to: "today", // Auto-scroll to today to keep viewport aligned with current tasks
        popup_on: "hover",
        on_click: (task: any) => {
          onSelectTask(task.id);
        },
        custom_popup_html: (task: any) => {
          try {
            const originalTask = filteredTasks.find((t) => t.id === task.id);
            if (!originalTask) return "";

            const startFormatted = format(new Date(task.start), "MMM dd, yyyy");
            const endFormatted = format(new Date(task.end), "MMM dd, yyyy");

            const assigneeName = originalTask.assignee?.name || "Unassigned";
            const priority = originalTask.priority || "Medium";
            const status = originalTask.status?.name || "Unknown";
            const progress = task.progress || 0;

            return `
              <div class="p-3 bg-card border border-border rounded-xl shadow-lg min-w-[200px] text-xs space-y-2 pointer-events-none text-foreground bg-white dark:bg-slate-950 backdrop-blur-md">
                <div class="font-bold text-sm border-b border-border/50 pb-1.5">${task.name}</div>
                <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <span class="font-semibold text-foreground/80">Project:</span>
                  <span class="truncate">${originalTask.projectTitle}</span>

                  <span class="font-semibold text-foreground/80">Dates:</span>
                  <span>${startFormatted} - ${endFormatted}</span>

                  <span class="font-semibold text-foreground/80">Status:</span>
                  <span>${status}</span>

                  <span class="font-semibold text-foreground/80">Priority:</span>
                  <span class="capitalize">${priority}</span>

                  <span class="font-semibold text-foreground/80">Assignee:</span>
                  <span>${assigneeName}</span>

                  <span class="font-semibold text-foreground/80">Progress:</span>
                  <span>${progress}%</span>
                </div>
              </div>
            `;
          } catch (err) {
            console.error("Error in custom_popup_html:", err);
            return "";
          }
        },
      } as any);

      console.log("Gantt initialized. Container HTML length:", container.innerHTML.length);

      // Scroll handling
      if (zoomChanged || !hasInitialScrolled.current) {
        setTimeout(() => {
          handleToday();
          hasInitialScrolled.current = true;
        }, 150);
      } else if (savedScrollLeft > 0) {
        // Restore scroll position on data updates
        const nextGanttContainer = container.querySelector(".gantt-container");
        if (nextGanttContainer) {
          requestAnimationFrame(() => {
            nextGanttContainer.scrollLeft = savedScrollLeft;
          });
        }
      }
    } catch (err) {
      console.error("Error updating Frappe Gantt:", err);
    }
  }, [ganttTasks, zoom, onSelectTask, filteredTasks]);

  // Clean up instance on unmount
  useEffect(() => {
    return () => {
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }
    };
  }, []);

  if (isProjectsLoading || isTasksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

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
      <Card className="bg-card border border-border rounded-xl p-4 overflow-x-auto shadow-xs">
        {ganttTasks.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-muted-foreground italic">
            No tasks found.
          </div>
        ) : (
          <div className="min-w-[800px] overflow-x-auto">
            {/* Wrapper div instead of SVG element for stable DOM lifecycle with Frappe Gantt */}
            <div ref={ganttContainerRef} className="w-full h-full min-h-[400px]" />
          </div>
        )}
      </Card>
    </div>
  );
}
