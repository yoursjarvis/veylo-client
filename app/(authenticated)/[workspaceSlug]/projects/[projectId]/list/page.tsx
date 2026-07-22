"use client"

import {
  Filters,
  FiltersContent,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { TaskList } from "@/features/tasks/components/task-list"
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpDown,
  Calendar,
  Filter as FilterIcon,
  Kanban,
  Layers,
  List,
  Search,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useDebounce } from "use-debounce"
import { useProject } from "../layout"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export default function ListPage() {
  const router = useRouter()
  const {
    projectId,
    statuses,
    selectedProject,
    handleSelectTask,
    epics,
    labels,
    milestones,
    sprints,
    workspaceSlug,
  } = useProject()

  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery] = useDebounce(searchQuery, 400)
  const [groupBy, setGroupBy] = useState<
    | "status"
    | "assignee"
    | "type"
    | "priority"
    | "epics"
    | "milestones"
    | "sprints"
  >("status")
  const [sortBy, setSortBy] = useState<
    "position" | "title" | "dueDate" | "priority" | "createdAt"
  >("position")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

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
          { value: "lowest", label: "Lowest" },
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
          { value: "highest", label: "Highest" },
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
    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim()
    }
    return params
  }, [activeFilters, debouncedSearchQuery])

  const { data: tasks, isLoading } = useProjectTasks(projectId, serverFilters)

  const filteredTasks = tasks || []

  return (
    <div className="flex h-full flex-col gap-6 bg-background text-foreground">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col justify-between gap-3 rounded-t-lg border border-border bg-card px-4 py-2.5 shadow-xs sm:flex-row sm:items-center">
        {/* Left Side: Search and Action Buttons */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full border-border bg-muted/40 pr-8 pl-9 text-xs"
            />
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery("")}
                variant="ghost"
                aria-label="Clear search"
                size="sm"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filters trigger */}
            <Filters
              filters={activeFilters}
              fields={fields}
              onChange={setActiveFilters}
              size="sm"
              trigger={
                <Button variant="outline" size="sm">
                  <FilterIcon className="h-3.5 w-3.5" />
                  <span>Filter</span>
                  {activeFilters.length > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              }
              hidePills
            />

            {/* Group Filter Button */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span className="capitalize">
                      Group:{" "}
                      {groupBy === "epics"
                        ? "Epics"
                        : groupBy === "milestones"
                          ? "Milestones"
                          : groupBy === "sprints"
                            ? "Sprints"
                            : groupBy}
                    </span>
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuRadioGroup
                  value={groupBy}
                  onValueChange={(val) =>
                    setGroupBy(
                      val as
                        | "status"
                        | "assignee"
                        | "type"
                        | "priority"
                        | "epics"
                        | "milestones"
                        | "sprints"
                    )
                  }
                >
                  <DropdownMenuRadioItem value="status">
                    Status
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="assignee">
                    Assignee
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="type">
                    Type
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="priority">
                    Priority
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="epics">
                    Epics
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="milestones">
                    Milestones
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="sprints">
                    Sprints
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span className="capitalize">
                      Sort:{" "}
                      {sortBy === "position"
                        ? "Default"
                        : sortBy === "dueDate"
                          ? "Due Date"
                          : sortBy === "createdAt"
                            ? "Created Date"
                            : sortBy}{" "}
                      ({sortOrder === "asc" ? "Asc" : "Desc"})
                    </span>
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuRadioGroup
                  value={sortBy}
                  onValueChange={(val) =>
                    setSortBy(
                      val as
                        | "position"
                        | "title"
                        | "dueDate"
                        | "priority"
                        | "createdAt"
                    )
                  }
                >
                  <DropdownMenuRadioItem value="position">
                    Default
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title">
                    Title
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dueDate">
                    Due Date
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="priority">
                    Priority
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="createdAt">
                    Created Date
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={sortOrder}
                  onValueChange={(val) => setSortOrder(val as "asc" | "desc")}
                >
                  <DropdownMenuRadioItem value="asc">
                    Ascending
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">
                    Descending
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFilters.length > 0 && (
              <>
                <div className="mx-1 hidden h-5 w-px bg-border sm:block"></div>
                <FiltersContent
                  filters={activeFilters}
                  fields={fields}
                  onChange={setActiveFilters}
                />
                <Button
                  variant="ghost"
                  onClick={() => setActiveFilters([])}
                  className="h-7 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  Clear all
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: View Switcher (List active, Kanban, Calendar) */}
        <div className="flex shrink-0 items-center gap-1 self-end rounded-md bg-muted p-0.5 sm:self-auto">
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/list`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-7 w-7 bg-card p-0 text-foreground shadow-sm hover:text-foreground"
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Link>
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/board`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            )}
            aria-label="Board view"
          >
            <Kanban className="h-4 w-4" />
          </Link>
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/calendar`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            )}
            aria-label="Calendar view"
          >
            <Calendar className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex w-full flex-col space-y-6 rounded-b-lg border border-t-0 border-border bg-card p-6">
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
          projectMembers={(selectedProject?.members || []).map((m) => ({
            role: m.role,
            user: {
              id: m.user?.id || "",
              name: m.user?.name || null,
              image: m.user?.image || null,
              email: m.user?.email || null,
            },
          }))}
          projectTemplate={selectedProject?.template || "simple"}
          onSelectTask={handleSelectTask}
          projectLabels={labels || []}
          groupBy={groupBy}
          epics={epics}
          milestones={milestones}
          sprints={sprints}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      )}
    </div>
  )
}
