"use client";

import React from "react";
import { useProject } from "../layout";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { TaskReports } from "@/features/tasks/components/task-reports";
import { Spinner } from "@/components/ui/spinner";

export default function ReportsPage() {
  const { projectId, sprints, selectedProject } = useProject();
  const { data: tasks, isLoading } = useProjectTasks(projectId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <TaskReports
      tasks={tasks || []}
      sprints={sprints || []}
      projectMembers={(selectedProject?.members || []).filter(m => m.user) as (import("@/types/models").ProjectMember & { user: { id: string; name: string } })[]}
      projectTemplate={selectedProject?.template || "simple"}
    />
  );
}
