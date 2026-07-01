"use client"

import {
  Filters,
  FiltersContent,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TaskList } from "@/features/tasks/components/task-list"
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks"
import {
  FilterHorizontalIcon,
  MultiplicationSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { useProject } from "../layout"

interface StatusOption {
  id: string
  name: string
}

interface EpicOption {
  id: string
  title: string
}

interface MilestoneOption {
  id: string
  title: string
}

interface LabelOption {
  id: string
  name: string
}

interface MemberOption {
  user: {
    id: string
    name: string
  }
}

interface TaskItem {
  id: string
  title: string
  description?: string
  statusId?: string
  priority: string
  type: string
  status: { name: string }
  assignee?: { id?: string; image?: string; name?: string }
  assigneeId?: string
  dueDate?: string
  estimate?: string | number
  labels?: { labelId: string }[]
  [key: string]: unknown
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
  } = useProject()

  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const fields = useMemo<FilterFieldConfig[]>(() => {
    const membersList = selectedProject?.members || []
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
    ]
  }, [statuses, epics, milestones, labels, selectedProject?.members])

  const serverFilters = useMemo(() => {
    const params: Record<string, string> = {}
    if (activeFilters.length > 0) {
      params.filters = JSON.stringify(activeFilters)
    }
    if (searchQuery.trim()) {
      params.search = searchQuery.trim()
    }
    return params
  }, [activeFilters, searchQuery])

  const { data: tasks, isLoading } = useProjectTasks(projectId, serverFilters)

  const filteredTasks = tasks || []

  return (
    <div className="flex h-full flex-col gap-6 bg-background text-foreground">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-4 py-2 sm:flex-row sm:items-center">
          {/* Unified search bar */}
          <div className="relative max-w-md flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-muted/40 py-1.5 pr-8 pl-9 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 hover:bg-muted/65 focus:border-ring focus:bg-background focus:ring-1 focus:ring-ring focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <HugeiconsIcon
                  icon={MultiplicationSignIcon}
                  className="h-3.5 w-3.5"
                />
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
                  className="h-8.5 gap-2 border-border/80 text-xs font-medium hover:bg-muted hover:text-foreground"
                >
                  <HugeiconsIcon
                    icon={FilterHorizontalIcon}
                    className="size-3.5 text-muted-foreground/80"
                  />
                  <span>Filter</span>
                  {activeFilters.length > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
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
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-1 py-1">
            <span className="mr-1 pl-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
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
              className="h-7 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
          tasks={
            filteredTasks as unknown as Parameters<typeof TaskList>[0]["tasks"]
          }
          statuses={
            (statuses || []) as unknown as Parameters<
              typeof TaskList
            >[0]["statuses"]
          }
          projectMembers={selectedProject?.members || []}
          projectTemplate={selectedProject?.template || "simple"}
          onSelectTask={handleSelectTask}
          projectLabels={labels || []}
        />
      )}
    </div>
  )
}
