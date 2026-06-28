"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { TaskDependency } from "@/types/models";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Search } from "lucide-react";
import { addDays, format } from "date-fns";
import Gantt from "frappe-gantt";
interface ProjectTimelineProps {
  workspaceId: string;
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
  onSelectTask,
}: ProjectTimelineProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("Month");
  const [searchQuery, setSearchQuery] = useState("");
  const ganttContainerRef = useRef<HTMLDivElement | null>(null);
  const ganttInstance = useRef<Gantt | null>(null);
  const hasInitialScrolled = useRef<boolean>(false);

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
      const data = r.data as { projectId: string; projectTitle: string; tasks: Omit<TimelineTask, "projectTitle" | "projectId">[] } | undefined;
      if (data) {
        const { projectId, projectTitle, tasks } = data;
        tasks?.forEach((t: Omit<TimelineTask, "projectTitle" | "projectId">) => {
          list.push({
            ...t,
            projectId,
            projectTitle,
          });
        });
      }
    });
    return list.filter((t) => !t.deletedAt);
  }, [taskResults]);

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
      const project = projects.find((p: any) => p.id === t.projectId);
      let projectStart = project?.createdAt ? new Date(project.createdAt) : new Date();
      if (projectStart.getFullYear() < 2026) {
        projectStart.setFullYear(2026);
      }

      let start = new Date(t.createdAt);
      if (isNaN(start.getTime()) || start < projectStart) {
        start = projectStart;
      }

      let end = t.dueDate ? new Date(t.dueDate) : addDays(start, 7);
      if (isNaN(end.getTime()) || end < start) {
        end = addDays(start, 7);
      }

      const progress = t.status.category === "done" ? 100 : t.status.category === "in_progress" ? 50 : 0;
      const deps = t.blockedByDependencies?.map((d) => d.blockingTaskId).join(",") || "";

      return {
        id: t.id,
        name: t.title,
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
        progress,
        dependencies: deps,
      };
    });
  }, [filteredTasks, projects]);

  const handleToday = () => {
    const container = ganttContainerRef.current?.querySelector(".gantt-container");
    const todayLine = ganttContainerRef.current?.querySelector(".gantt .today-highlight");
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
      let firstInit = false;
      if (ganttInstance.current) {
        // Update view mode first, then trigger refresh
        ganttInstance.current.options.view_mode = zoom;
        ganttInstance.current.refresh(ganttTasks);
      } else {
        ganttInstance.current = new Gantt(ganttContainerRef.current, ganttTasks, {
          view_mode: zoom,
          today_button: false,
          scroll_to: "", // Disable auto-scroll to keep viewport stable
          popup_on: "click",
          on_click: (task: any) => {
            onSelectTask(task.id);
          },
        });
        firstInit = true;
      }

      // Override the label position dynamically using the prototype of the created bars
      const ganttInstanceAny = ganttInstance.current as any;
      if (ganttInstanceAny && ganttInstanceAny.bars && ganttInstanceAny.bars.length > 0) {
        const barProto = Object.getPrototypeOf(ganttInstanceAny.bars[0]);
        if (barProto && !barProto._overridden) {
          barProto._overridden = true;
          barProto.update_label_position = function () {
            const bar = this.$bar;
            const label = this.group.querySelector(".bar-label");
            if (!label) return;

            const padding = 10;
            const barWidth = bar.getWidth();
            const maxTextWidth = barWidth - padding * 2;

            if (this.task._originalName === undefined) {
              this.task._originalName = this.task.name || "";
            }

            const text = this.task._originalName;
            label.textContent = text;
            let labelWidth = label.getBBox().width;

            if (labelWidth > maxTextWidth) {
              let low = 0;
              let high = text.length;
              let bestFit = "";

              while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const truncated = text.substring(0, mid) + "...";
                label.textContent = truncated;
                if (label.getBBox().width <= maxTextWidth) {
                  bestFit = truncated;
                  low = mid + 1;
                } else {
                  high = mid - 1;
                }
              }
              label.textContent = bestFit || "...";
            }

            const finalLabelWidth = label.getBBox().width;
            label.setAttribute("x", bar.getX() + barWidth / 2 - finalLabelWidth / 2);
            label.setAttribute("y", bar.getY() + this.height / 2);
            label.style.fill = "#ffffff";
            label.style.pointerEvents = "none";
          };
        }
        
        // Force refresh labels to apply our custom centering and truncation
        if (firstInit) {
          ganttInstanceAny.bars.forEach((bar: any) => bar.update_label_position());
        }
      }

      // Initial scroll to today only once when Gantt is mounted
      if (!hasInitialScrolled.current) {
        setTimeout(() => {
          handleToday();
          hasInitialScrolled.current = true;
        }, 150);
      }
    } catch (err) {
      console.error("Error updating Frappe Gantt:", err);
    }
  }, [ganttTasks, zoom, onSelectTask]);

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
