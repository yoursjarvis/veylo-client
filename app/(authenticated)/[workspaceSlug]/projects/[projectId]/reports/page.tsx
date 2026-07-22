"use client"

import React from "react"
import { useProject } from "../layout"
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks"
import { TaskReports } from "@/features/tasks/components/task-reports"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsPage() {
  const { projectId, sprints, selectedProject } = useProject()
  const { data: tasks, isLoading } = useProjectTasks(projectId)

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="min-h-[500px] w-full flex-1 rounded-lg" />
      </div>
    )
  }

  return (
    <TaskReports
      tasks={tasks || []}
      sprints={sprints || []}
      projectMembers={
        (selectedProject?.members || []).filter(
          (m) => m.user
        ) as (import("@/types/models").ProjectMember & {
          user: { id: string; name: string }
        })[]
      }
      projectTemplate={selectedProject?.template || "simple"}
    />
  )
}
