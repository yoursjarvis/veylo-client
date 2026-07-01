"use client"

import {
  Filters,
  FiltersContent,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TaskBoard } from "@/features/tasks/components/task-board"
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks"
import { FilterHorizontalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import React, { useState } from "react"
import { useProject } from "../layout"

export default function BoardPage() {
  const {
    projectId,
    statuses,
    sprints,
    selectedProject,
    handleSelectTask,
    epics,
    labels,
    milestones,
  } = useProject()

  const [activeFilters, setActiveFilters] = useState<Filter[]>([])

  const fields = React.useMemo<FilterFieldConfig[]>(() => {
    return [
      {
        key: "search",
        label: "Search",
        type: "text",
      },
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
      {
        key: "assignee",
        label: "Assignee",
        type: "select",
        options: [
          { value: "null", label: "Unassigned" },
          ...(selectedProject?.members || []).map((m: any) => ({
            value: m.userId,
            label: m.user?.name || m.user?.email || "Unknown User",
          })),
        ],
      },
      {
        key: "statusId",
        label: "Status",
        type: "select",
        options: (statuses || []).map((s: any) => ({
          value: s.id,
          label: s.name,
        })),
      },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: [
          { value: "urgent", label: "Urgent" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
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
    ]
  }, [epics, milestones, labels, selectedProject, statuses])

  const queryFilters = React.useMemo(() => {
    if (activeFilters.length === 0) return {}
    return { filters: JSON.stringify(activeFilters) }
  }, [activeFilters])

  const { data: tasks, isLoading } = useProjectTasks(projectId, queryFilters)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  const filterTrigger = (
    <Button variant="outline" size="lg" className="gap-2 text-xs font-medium">
      <HugeiconsIcon icon={FilterHorizontalIcon} className="h-5 w-5" />
      Filter
    </Button>
  )

  return (
    <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-col gap-4 overflow-hidden">
      {/* Filter bar - only visible when filters are active */}
      <div className="flex flex-wrap items-center gap-2">
        <Filters
          filters={activeFilters}
          fields={fields}
          onChange={setActiveFilters}
          size="sm"
          trigger={filterTrigger}
        />
      </div>

      {/* Active filter pills row */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <FiltersContent
            filters={activeFilters}
            fields={fields}
            onChange={setActiveFilters}
          />
        </div>
      )}

      <TaskBoard
        projectId={projectId}
        tasks={tasks || []}
        statuses={statuses || []}
        sprints={(sprints || []).map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
          goal: s.goal || undefined,
          startDate: s.startDate || undefined,
          endDate: s.endDate || undefined,
        }))}
        projectTemplate={selectedProject?.template || "simple"}
        projectMembers={(selectedProject?.members || []).map((m) => ({
          id: m.id,
          projectId: m.projectId,
          userId: m.userId,
          role: m.role,
          user: {
            id: m.user?.id || "",
            name: m.user?.name || "",
            email: m.user?.email || "",
            image: m.user?.image || null,
          },
        }))}
        onSelectTask={handleSelectTask}
      />
    </div>
  )
}
