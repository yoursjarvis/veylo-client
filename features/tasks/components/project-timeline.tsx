"use client"

import { useTheme } from "@/components/theme-provider"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useProjectTasks,
  useProjectStatuses,
  useProjectSprints,
  useProjectMilestones,
  useDeleteTask,
} from "@/features/tasks/hooks/use-tasks"
import { axiosInstance } from "@/lib/axios"
import { TaskDependency } from "@/types/models"
import {
  Search02Icon,
  ChevronDownIcon,
  CalendarIcon,
  UserIcon,
  CheckmarkSquare03Icon,
  FilterHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { addDays, format } from "date-fns"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useQueryState, parseAsString, parseAsJson } from "nuqs"
import { Filters, Filter, FilterFieldConfig, FiltersContent } from "@/components/reui/filters"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FluidTabs } from "@/components/ui/fluid-tabs"
import { Button } from "@/components/ui/button"
import { GanttChart } from "./gantt-chart/gantt-chart"
import { useTimelineState, TaskGroupType } from "../hooks/use-timeline-state"

interface ProjectTimelineProps {
  workspaceId: string
  projectId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedProject?: any
  onSelectTask: (taskId: string) => void
}

type TimelineTask = {
  id: string
  title: string
  projectId: string
  projectTitle: string
  type: string
  priority: string
  status: { id?: string; name: string; category: string }
  createdAt: string
  startDate?: string | null
  dueDate?: string
  parentTaskId?: string | null
  blockedByDependencies?: TaskDependency[]
  assignee?: { id?: string; name?: string; image?: string }
  deletedAt?: string
  sprint?: { id: string; name: string } | null
  milestone?: { id: string; title: string } | null
}

type ZoomLevel = "Day" | "Week" | "Month" | "Quarter" | "HalfYear" | "Year"

export function ProjectTimeline({
  workspaceId,
  projectId,
  selectedProject,
  onSelectTask,
}: ProjectTimelineProps) {
  const [zoom, setZoom] = useQueryState("zoom", parseAsString.withDefault("Month"))
  const [searchQuery, setSearchQuery] = useQueryState("search", parseAsString.withDefault(""))
  const [activeLayoutUrl, setActiveLayoutUrl] = useQueryState("layout", parseAsString.withDefault("standard"))
  const [activeFilters, setActiveFilters] = useQueryState<Filter[]>(
    "filters",
    parseAsJson<Filter[]>((val) => val as Filter[]).withDefault([])
  )
  const [todayScrollCount, setTodayScrollCount] = useState(0)

  const zoomTabs = useMemo(() => [
    { id: "Day", label: "Day", icon: null },
    { id: "Week", label: "Week", icon: null },
    { id: "Month", label: "Month", icon: null },
    { id: "Quarter", label: "Quarter", icon: null },
    { id: "HalfYear", label: "Half Year", icon: null },
    { id: "Year", label: "Year", icon: null },
  ], [])

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const params = new URLSearchParams(window.location.search)
    if (isMobile && !params.has("zoom")) {
      setZoom("Day")
    }
  }, [setZoom])

  const { data: statuses = [] } = useProjectStatuses(projectId || "")
  const { data: sprints = [] } = useProjectSprints(projectId || "")
  const { data: milestones = [] } = useProjectMilestones(projectId || "")

  const filterFields = useMemo<FilterFieldConfig[]>(() => {
    return [
      {
        key: "status",
        label: "Status",
        type: "multiselect",
        options: statuses.map((s: { id: string; name: string }) => ({
          value: s.id || s.name,
          label: s.name,
        })),
      },
      {
        key: "priority",
        label: "Priority",
        type: "multiselect",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
          { value: "urgent", label: "Urgent" },
        ],
      },
      {
        key: "assignee",
        label: "Assignee",
        type: "multiselect",
        options: (selectedProject?.members || []).map((m: { userId: string; user?: { name: string } }) => ({
          value: m.userId,
          label: m.user?.name || "Unknown User",
        })),
      },
      {
        key: "sprint",
        label: "Sprint",
        type: "multiselect",
        options: sprints.map((s: { id: string; name: string }) => ({
          value: s.id,
          label: s.name,
        })),
      },
      {
        key: "milestone",
        label: "Milestone",
        type: "multiselect",
        options: milestones.map((m: { id: string; title: string }) => ({
          value: m.id,
          label: m.title,
        })),
      },
    ]
  }, [statuses, sprints, milestones, selectedProject])

  const { resolvedTheme } = useTheme()
  const queryClient = useQueryClient()

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      dueDate,
      startDate,
    }: {
      taskId: string
      dueDate: string | null
      startDate: string | null
    }) => {
      const response = await axiosInstance.patch(`/tasks/${taskId}`, {
        dueDate,
        startDate,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] })
      toast.success("Task updated")
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Failed to update task")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const handleUpdateTask = (taskId: string, start: Date, end: Date) => {
    updateTaskMutation.mutate({
      taskId,
      dueDate: end.toISOString(),
      startDate: start.toISOString(),
    })
  }

  // 1. Fetch all projects in this workspace
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const response = await axiosInstance.get(
        `/workspaces/${workspaceId}/projects`
      )
      return response.data.data
    },
    enabled: !!workspaceId,
  })

  // 2. Fetch tasks (either for the selected project, or for all projects in parallel)
  const {
    data: singleProjectTasks = [],
    isLoading: isSingleProjectTasksLoading,
  } = useProjectTasks(projectId || "")

  const taskResults = useQueries({
    queries: (!projectId ? projects : []).map(
      (p: { id: string; title: string }) => ({
        queryKey: ["tasks", p.id],
        queryFn: async () => {
          const response = await axiosInstance.get(`/projects/${p.id}/tasks`)
          return {
            projectId: p.id,
            projectTitle: p.title,
            tasks: response.data.data,
          }
        },
        enabled: !!p.id,
      })
    ),
  })

  const isTasksLoading = projectId
    ? isSingleProjectTasksLoading
    : taskResults.some((r) => r.isLoading)

  // 3. Combine tasks across all projects, flattening subtasks into the list
  const allProjectsTasks = useMemo<TimelineTask[]>(() => {
    // Helper to recursively flatten a task and its subtasks
    const flattenTask = (
      task: Record<string, unknown>,
      projectId: string,
      projectTitle: string
    ): TimelineTask[] => {
      const result: TimelineTask[] = []
      const mapped: TimelineTask = {
        ...(task as unknown as TimelineTask),
        projectId,
        projectTitle,
      }
      result.push(mapped)

      // Flatten nested subtasks into the list
      const subtasks = (task.subtasks || []) as Record<string, unknown>[]
      subtasks.forEach((sub) => {
        result.push(...flattenTask(sub, projectId, projectTitle))
      })

      return result
    }

    if (projectId) {
      const project = projects.find(
        (p: { id: string; title: string; createdAt?: string }) =>
          p.id === projectId
      )
      const projectTitle = project?.title || ""
      const list: TimelineTask[] = []
      ;(singleProjectTasks || []).forEach(
        (t: Record<string, unknown>) => {
          list.push(...flattenTask(t, projectId, projectTitle))
        }
      )
      return list
    }

    const list: TimelineTask[] = []
    taskResults.forEach((r) => {
      const data = r.data as
        | {
            projectId: string
            projectTitle: string
            tasks: Record<string, unknown>[]
          }
        | undefined
      if (data) {
        const { projectId: pid, projectTitle, tasks } = data
        tasks?.forEach(
          (t: Record<string, unknown>) => {
            list.push(...flattenTask(t, pid, projectTitle))
          }
        )
      }
    })
    return list
  }, [projectId, projects, singleProjectTasks, taskResults])

  // Filter tasks by search query and active filters
  const filteredTasks = useMemo(() => {
    let result = allProjectsTasks

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.projectTitle.toLowerCase().includes(query)
      )
    }

    // Apply Filters array
    if (activeFilters && activeFilters.length > 0) {
      activeFilters.forEach((filter) => {
        const { field, values } = filter
        if (!values || values.length === 0) return

        if (field === "status") {
          result = result.filter((t) => {
            const val = t.status?.id || t.status?.name
            return values.includes(val)
          })
        } else if (field === "priority") {
          result = result.filter((t) => values.includes(t.priority))
        } else if (field === "assignee") {
          result = result.filter((t) => t.assignee?.id && values.includes(t.assignee.id))
        } else if (field === "sprint") {
          result = result.filter((t) => t.sprint?.id && values.includes(t.sprint.id))
        } else if (field === "milestone") {
          result = result.filter((t) => t.milestone?.id && values.includes(t.milestone.id))
        }
      })
    }

    return result
  }, [allProjectsTasks, searchQuery, activeFilters])



  const {
    activeLayout,
    setActiveLayout,
    expandedNodes,
    toggleExpand,
    selectedTaskIds,
    toggleSelectTask,
    clearSelection,
    getVisibleRows,
  } = useTimelineState()

  const deleteTaskMutation = useDeleteTask(projectId || "")

  const handleDeleteTasks = async (taskIds: string[]) => {
    try {
      await Promise.all(taskIds.map((id) => deleteTaskMutation.mutateAsync(id)))
      clearSelection()
    } catch (error) {
      console.error("Failed to delete tasks:", error)
    }
  }

  const handleDuplicateTasks = (taskIds: string[]) => {
    toast.info("Bulk duplication is not implemented yet")
    clearSelection()
  }

  // Sync state layout with URL
  useEffect(() => {
    if (activeLayoutUrl) {
      setActiveLayout(activeLayoutUrl as TaskGroupType)
    }
  }, [activeLayoutUrl, setActiveLayout])

  // Sync URL layout with state
  const handleLayoutChange = (newLayout: string) => {
    setActiveLayoutUrl(newLayout)
    setActiveLayout(newLayout as TaskGroupType)
  }

  const visibleRows = useMemo(() => {
    return getVisibleRows(filteredTasks)
  }, [getVisibleRows, filteredTasks])

  const handleToday = () => {
    setTodayScrollCount((prev) => prev + 1)
  }

  if (isProjectsLoading || isTasksLoading) {
    return (
      <div className="flex h-full w-full flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="min-h-125 w-full flex-1 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-3 shadow-xs md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative w-full max-w-xs shrink-0">
              <HugeiconsIcon
                icon={Search02Icon}
                className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground"
              />
              <Input
                placeholder="Search roadmap..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full border-border bg-background pl-9 text-xs placeholder:text-muted-foreground/60"
              />
            </div>
            {/* Veylo Reusable Filters */}
            <Filters
              filters={activeFilters || []}
              fields={filterFields}
              onChange={(newFilters) => setActiveFilters(newFilters)}
              size="sm"
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 border-border text-xs font-medium hover:bg-muted hover:text-foreground"
                >
                  <HugeiconsIcon
                    icon={FilterHorizontalIcon}
                    className="size-3.5 text-muted-foreground/80"
                  />
                  <span>Filter</span>
                  {(activeFilters || []).length > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground">
                      {(activeFilters || []).length}
                    </span>
                  )}
                </Button>
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
          {/* Today Button */}
          <button
            onClick={handleToday}
            className="h-9 cursor-pointer rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted/30 hover:text-foreground"
          >
            Today
          </button>

          {/* Layout Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted/30 hover:text-foreground"
                />
              }
            >
              <span>Layout: {activeLayout.charAt(0).toUpperCase() + activeLayout.slice(1)}</span>
              <HugeiconsIcon icon={ChevronDownIcon} className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
              {[
                { value: "standard", label: "Standard Hierarchy", icon: CheckmarkSquare03Icon },
                { value: "assignee", label: "Assignee View", icon: UserIcon },
                { value: "sprint", label: "Sprint View", icon: CalendarIcon },
                { value: "milestone", label: "Milestone View", icon: CalendarIcon },
                { value: "status", label: "Status View", icon: CheckmarkSquare03Icon },
                { value: "priority", label: "Priority View", icon: CheckmarkSquare03Icon },
              ].map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => handleLayoutChange(item.value)}
                  className={`flex items-center gap-2 cursor-pointer text-xs ${
                    activeLayout === item.value
                      ? "font-bold text-foreground bg-muted/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HugeiconsIcon icon={item.icon} className="h-4 w-4" />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Zoom Switcher */}
          <div className="overflow-x-auto whitespace-nowrap scrollbar-none max-w-full shrink-0">
            <FluidTabs
              tabs={zoomTabs}
              active={zoom || "Month"}
              onChange={(id) => setZoom(id as ZoomLevel)}
            />
          </div>
        </div>
      </div>

      {/* Filter UX Pills & Clear All */}
      {(activeFilters || []).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-1 py-1">
          <span className="mr-1 pl-2 text-2xs font-bold tracking-wider text-muted-foreground uppercase">
            Active Filters ({(activeFilters || []).length}):
          </span>
          <FiltersContent
            filters={activeFilters || []}
            fields={filterFields}
            onChange={(newFilters) => setActiveFilters(newFilters)}
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

      {/* Custom Virtual Gantt Board */}
      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-xs h-150">
        <GanttChart
          tasks={filteredTasks}
          visibleRows={visibleRows}
          activeLayout={activeLayout}
          zoom={zoom as "Day" | "Week" | "Month"}
          expandedNodes={expandedNodes}
          selectedTaskIds={selectedTaskIds}
          onToggleExpand={toggleExpand}
          onToggleSelectTask={toggleSelectTask}
          onUpdateTask={handleUpdateTask}
          onSelectTask={onSelectTask}
          onDeleteTasks={handleDeleteTasks}
          onDuplicateTasks={handleDuplicateTasks}
          onClearSelection={clearSelection}
          todayScrollCount={todayScrollCount}
        />
      </Card>
    </div>
  )
}
