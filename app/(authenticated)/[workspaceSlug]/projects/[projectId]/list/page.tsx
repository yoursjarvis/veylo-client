"use client";

import React, { useState, useMemo } from "react";
import { useProject } from "../layout";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { TaskList } from "@/features/tasks/components/task-list";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Filters,
  FiltersContent,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters";

interface StatusOption {
  id: string;
  name: string;
}

interface EpicOption {
  id: string;
  title: string;
}

interface MilestoneOption {
  id: string;
  title: string;
}

interface LabelOption {
  id: string;
  name: string;
}

interface MemberOption {
  user: {
    id: string;
    name: string;
  };
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  statusId?: string;
  priority: string;
  type: string;
  status: { name: string };
  assignee?: { id?: string; image?: string; name?: string };
  assigneeId?: string;
  dueDate?: string;
  estimate?: string | number;
  labels?: { labelId: string }[];
  [key: string]: unknown;
}

export default function ListPage() {
  const {
    projectId,
    statuses,
    selectedProject,
    handleSelectTask,
    epics,
    labels,
    milestones,
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
        options: ((statuses || []) as StatusOption[]).map((st) => ({
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
          ...((epics || []) as EpicOption[]).map((ep) => ({
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
          ...((milestones || []) as MilestoneOption[]).map((ms) => ({
            value: ms.id,
            label: ms.title,
          })),
        ],
      },
      {
        key: "labelId",
        label: "Label",
        type: "multiselect",
        options: ((labels || []) as LabelOption[]).map((lbl) => ({
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
          ...((membersList || []) as MemberOption[]).map((m) => ({
            value: m.user.id,
            label: m.user.name,
          })),
        ],
      },
    ];
  }, [statuses, epics, milestones, labels, selectedProject?.members]);

  const serverFilters = useMemo(() => {
    const params: Record<string, string> = {};
    if (activeFilters.length > 0) {
      params.filters = JSON.stringify(activeFilters);
    }
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    return params;
  }, [activeFilters, searchQuery]);

  const { data: tasks, isLoading } = useProjectTasks(projectId, serverFilters);

  const filteredTasks = tasks || [];

  return (
    <div className="flex flex-col gap-6 h-full bg-background text-foreground">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          {/* Unified search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/60 focus:border-ring rounded-lg pl-9 pr-8 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-hidden focus:ring-1 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons (Filters only) */}
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
                  className="gap-2 h-8.5 text-xs font-medium border-border/80 hover:bg-muted hover:text-foreground"
                >
                  <SlidersHorizontal className="size-3.5 text-muted-foreground/80" />
                  <span>Filter</span>
                  {activeFilters.length > 0 && (
                    <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 text-[10px] font-bold">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              }
            />
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
          projectId={projectId as string}
          tasks={filteredTasks as unknown as Parameters<typeof TaskList>[0]["tasks"]}
          statuses={(statuses || []) as unknown as Parameters<typeof TaskList>[0]["statuses"]}
          projectMembers={selectedProject?.members || []}
          projectTemplate={selectedProject?.template || "simple"}
          onSelectTask={handleSelectTask}
          projectLabels={labels || []}
        />
      )}
    </div>
  );
}
