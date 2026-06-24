"use client";

import React from "react";
import { useProject } from "../layout";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { TaskBacklog } from "@/features/tasks/components/task-backlog";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";

export default function BacklogPage() {
  const { projectId, sprints, statuses, selectedProject, handleSelectTask } = useProject();
  const { data: tasks, isLoading } = useProjectTasks(projectId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (selectedProject?.template !== "scrum") {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-slate-800 rounded-xl mt-10">
        <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
        <h3 className="font-bold text-lg">Backlog Disabled</h3>
        <p className="text-sm mt-1 text-center max-w-sm">
          The backlog planner is only available for Scrum template projects.
        </p>
      </div>
    );
  }

  return (
    <TaskBacklog
      projectId={projectId}
      tasks={tasks || []}
      sprints={sprints || []}
      statuses={statuses || []}
      projectMembers={selectedProject?.members || []}
      onSelectTask={handleSelectTask}
    />
  );
}
