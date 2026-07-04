"use client";

import React from "react";
import { useProject } from "../layout";
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks";
import { TaskBacklog } from "@/features/tasks/components/task-backlog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default function BacklogPage() {
  const { projectId, sprints, statuses, selectedProject, handleSelectTask } = useProject();
  const { data: tasks, isLoading } = useProjectTasks(projectId);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6 p-6 w-full">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="rounded-md border border-border">
          <div className="border-b border-border p-4 flex gap-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4 border-b border-border last:border-0">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedProject?.template !== "software-scrum" && selectedProject?.template !== "scrum") {
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
      sprints={(sprints || []).map(s => ({ id: s.id, name: s.name, status: s.status, goal: s.goal || undefined, startDate: s.startDate || undefined, endDate: s.endDate || undefined }))}
      statuses={statuses || []}
      projectMembers={(selectedProject?.members || []).map(m => ({ id: m.id, projectId: m.projectId, userId: m.userId, role: m.role, user: { id: m.user?.id || "", name: m.user?.name || "", email: m.user?.email || "", image: m.user?.image || null } }))}
      onSelectTask={handleSelectTask}
    />
  );
}
