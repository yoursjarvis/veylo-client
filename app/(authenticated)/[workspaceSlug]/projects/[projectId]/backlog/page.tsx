"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { TaskBacklog } from "@/features/tasks/components/task-backlog"
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useProject } from "../layout"

export default function BacklogPage() {
  const { projectId, sprints, statuses, selectedProject, handleSelectTask } =
    useProject()
  const { data: tasks, isLoading } = useProjectTasks(projectId)

  if (isLoading) {
    return (
      <div className="flex w-full flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="rounded-md border border-border">
          <div className="flex gap-4 border-b border-border p-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 border-b border-border p-4 last:border-0"
            >
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (
    selectedProject?.template !== "software-scrum" &&
    selectedProject?.template !== "scrum"
  ) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-border p-8">
        <HugeiconsIcon
          icon={AlertCircleIcon}
          className="mb-3 h-10 w-10 text-warning"
        />
        <h3 className="text-lg font-bold">Backlog Disabled</h3>
        <p className="mt-1 max-w-sm text-center text-sm">
          The backlog planner is only available for Scrum template projects.
        </p>
      </div>
    )
  }

  return (
    <TaskBacklog
      projectId={projectId}
      tasks={tasks || []}
      sprints={
        sprints?.map((s) => ({
          ...s,
          goal: s.goal ?? undefined,
          startDate: s.startDate ?? undefined,
          endDate: s.endDate ?? undefined,
        })) || []
      }
      statuses={statuses || []}
      projectMembers={selectedProject?.members || []}
      onSelectTask={handleSelectTask}
    />
  )
}
