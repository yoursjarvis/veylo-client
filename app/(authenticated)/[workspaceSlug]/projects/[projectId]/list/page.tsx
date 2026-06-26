"use client";

import React, { useState, useMemo } from "react";
import { useProject } from "../layout";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { TaskList } from "@/features/tasks/components/task-list";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Plus, X } from "lucide-react";
import {
  Filters,
  FiltersContent,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters";

export default function ListPage() {
  const {
    projectId,
    statuses,
    selectedProject,
    handleSelectTask,
    epics,
    labels,
    milestones,
    setIsCreateTaskOpen,
  } = useProject();

  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fields = useMemo<FilterFieldConfig[]>(() => {
    const membersList = selectedProject?.members || [];
    return [
      {
        key: "statusId",
        label: "Status",
        type: "select",
        options: (statuses || []).map((st: any) => ({
          value: st.id,
          label: st.name,
        })),
      },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
          { value: "urgent", label: "Urgent" },
        ],
      },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "task", label: "Task" },
          { value: "bug", label: "Bug" },
          { value: "feature", label: "Feature" },
        ],
      },
      {
        key: "epicId",
        label: "Epic",
        type: "select",
        options: [
          { value: "null", label: "No Epic" },
          ...(epics || []).map((ep: any) => ({
            value: ep.id,
            label: ep.title,
          })),
        ],
      },
      {
        key: "milestoneId",
        label: "Milestone",
        type: "select",
        options: [
          { value: "null", label: "No Milestone" },
          ...(milestones || []).map((ms: any) => ({
            value: ms.id,
            label: ms.title,
          })),
        ],
      },
      {
        key: "labelId",
        label: "Label",
        type: "multiselect",
        options: (labels || []).map((lbl: any) => ({
          value: lbl.id,
          label: lbl.name,
        })),
      },
      {
        key: "assigneeId",
        label: "Assignee",
        type: "select",
        options: [
          { value: "null", label: "Unassigned" },
          ...membersList.map((m: any) => ({
            value: m.user.id,
            label: m.user.name,
          })),
        ],
      },
    ];
  }, [statuses, epics, milestones, labels, selectedProject?.members]);

  const serverFilters = useMemo(() => {
    const params: Record<string, string> = {};
    activeFilters.forEach((f) => {
      if (f.field === "epicId" || f.field === "milestoneId" || f.field === "labelId") {
        if (f.operator === "empty") {
          params[f.field] = "null";
        } else if (f.values && f.values.length > 0) {
          if (f.field === "labelId") {
            params.labelId = (f.values as string[]).join(",");
          } else {
            params[f.field] = f.values[0] as string;
          }
        }
      }
    });
    return params;
  }, [activeFilters]);

  const { data: tasks, isLoading } = useProjectTasks(projectId, serverFilters);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task: any) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesAssignee = task.assignee?.name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) {
          return false;
        }
      }

      // 2. Client-side active filters filter
      for (const filter of activeFilters) {
        if (filter.field === "epicId" || filter.field === "milestoneId" || filter.field === "labelId") {
          // Already filtered server-side
          continue;
        }

        const fieldValue = task[filter.field];

        if (filter.operator === "empty") {
          if (fieldValue !== null && fieldValue !== undefined && fieldValue !== "") {
            return false;
          }
        } else if (filter.operator === "not_empty") {
          if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
            return false;
          }
        } else if (filter.values && filter.values.length > 0) {
          const filterValues = filter.values as string[];
          if (filter.field === "assigneeId") {
            const taskAssigneeId = task.assigneeId || task.assignee?.id;
            const targetVal = taskAssigneeId || "null";
            if (!filterValues.includes(targetVal)) {
              return false;
            }
          } else {
            const targetVal = String(fieldValue || "");
            if (!filterValues.includes(targetVal)) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [tasks, activeFilters, searchQuery]);

  return (
    <div className="flex flex-col gap-6 h-full bg-background text-foreground">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-card border border-border p-2 rounded-xl shadow-xs transition-shadow duration-200 focus-within:shadow-md">
          {/* Unified search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks by title, description, assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-0 border-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-border/60" />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Filters
              filters={activeFilters}
              fields={fields}
              onChange={setActiveFilters}
              size="sm"
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-8 text-xs font-semibold border-border hover:bg-accent hover:text-accent-foreground"
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Filters</span>
                  {activeFilters.length > 0 && (
                    <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 text-[10px] font-bold">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              }
            />

            <Button
              onClick={() => setIsCreateTaskOpen(true)}
              size="sm"
              className="gap-1.5 h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95"
            >
              <Plus className="size-3.5" />
              <span>New Task</span>
            </Button>
          </div>
        </div>

        {/* Filter UX Pills & Clear All */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-1 px-1 bg-muted/20 border border-border/40 rounded-lg">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-2 mr-1">
              Active Filters ({activeFilters.length}):
            </span>
            <FiltersContent
              filters={activeFilters}
              fields={fields}
              onChange={setActiveFilters}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilters([])}
              className="h-7 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2.5 rounded-md transition-colors"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          statuses={statuses || []}
          projectMembers={selectedProject?.members || []}
          projectTemplate={selectedProject?.template || "simple"}
          onSelectTask={handleSelectTask}
          projectLabels={labels || []}
        />
      )}
    </div>
  );
}
