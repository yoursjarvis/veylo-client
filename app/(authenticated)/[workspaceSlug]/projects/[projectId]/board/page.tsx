"use client";

import React, { useState } from "react";
import { useProject } from "../layout";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Filters, type Filter, type FilterFieldConfig } from "@/components/reui/filters";

export default function BoardPage() {
  const { projectId, statuses, sprints, selectedProject, handleSelectTask, epics, labels, milestones } = useProject();

  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);

  const fields = React.useMemo<FilterFieldConfig[]>(() => {
    return [
      {
        key: "epicId",
        label: "Epic",
        type: "select",
        options: [
          { value: "null", label: "No Epic" },
          ...(epics || []).map((ep: { id: string; title: string }) => ({
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
          ...(milestones || []).map((ms: { id: string; title: string }) => ({
            value: ms.id,
            label: ms.title,
          })),
        ],
      },
      {
        key: "labelId",
        label: "Label",
        type: "multiselect",
        options: (labels || []).map((lbl: { id: string; name: string }) => ({
          value: lbl.id,
          label: lbl.name,
        })),
      },
    ];
  }, [epics, milestones, labels]);

  const queryFilters = React.useMemo(() => {
    const params: Record<string, string> = {};
    activeFilters.forEach((f) => {
      if (f.operator === "empty") {
        params[f.field] = "null";
      } else if (f.values && f.values.length > 0) {
        if (f.field === "labelId") {
          params.labelId = (f.values as string[]).join(",");
        } else {
          params[f.field] = f.values[0] as string;
        }
      }
    });
    return params;
  }, [activeFilters]);

  const { data: tasks, isLoading } = useProjectTasks(projectId, queryFilters);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters:</span>
        <Filters
          filters={activeFilters}
          fields={fields}
          onChange={setActiveFilters}
        />
      </div>

      <TaskBoard
        projectId={projectId}
        tasks={tasks || []}
        statuses={statuses || []}
        sprints={sprints || []}
        projectTemplate={selectedProject?.template || "simple"}
        projectMembers={selectedProject?.members || []}
        onSelectTask={handleSelectTask}
      />
    </div>
  );
}
