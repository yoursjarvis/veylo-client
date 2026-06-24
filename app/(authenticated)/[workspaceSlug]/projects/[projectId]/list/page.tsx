"use client";

import React, { useState } from "react";
import { useProject } from "../layout";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { TaskList } from "@/features/tasks/components/task-list";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export default function ListPage() {
  const { projectId, statuses, selectedProject, handleSelectTask, epics, labels, milestones } = useProject();

  const [epicId, setEpicId] = useState<string>("");
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [labelId, setLabelId] = useState<string>("");

  const filters: Record<string, string> = {};
  if (epicId) filters.epicId = epicId;
  if (milestoneId) filters.milestoneId = milestoneId;
  if (labelId) filters.labelId = labelId;

  const { data: tasks, isLoading } = useProjectTasks(projectId, filters);

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

        {/* Epic Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium">Epic:</span>
          <select
            value={epicId}
            onChange={(e) => setEpicId(e.target.value)}
            className="bg-card border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary h-8"
          >
            <option value="">All Epics</option>
            <option value="null">No Epic</option>
            {epics?.map((ep: { id: string; title: string }) => (
              <option key={ep.id} value={ep.id}>
                {ep.title}
              </option>
            ))}
          </select>
        </div>

        {/* Milestone Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium">Milestone:</span>
          <select
            value={milestoneId}
            onChange={(e) => setMilestoneId(e.target.value)}
            className="bg-card border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary h-8"
          >
            <option value="">All Milestones</option>
            <option value="null">No Milestone</option>
            {milestones?.map((ms: { id: string; title: string }) => (
              <option key={ms.id} value={ms.id}>
                {ms.title}
              </option>
            ))}
          </select>
        </div>

        {/* Label Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium">Label:</span>
          <select
            value={labelId}
            onChange={(e) => setLabelId(e.target.value)}
            className="bg-card border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary h-8"
          >
            <option value="">All Labels</option>
            {labels?.map((lbl: { id: string; name: string }) => (
              <option key={lbl.id} value={lbl.id}>
                {lbl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(epicId || milestoneId || labelId) && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setEpicId("");
              setMilestoneId("");
              setLabelId("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <TaskList
        tasks={tasks || []}
        statuses={statuses || []}
        projectMembers={selectedProject?.members || []}
        projectTemplate={selectedProject?.template || "simple"}
        onSelectTask={handleSelectTask}
      />
    </div>
  );
}
