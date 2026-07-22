/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { axiosInstance } from "@/lib/axios"
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Filter, FilterFieldConfig, Filters } from "@/components/reui/filters"
import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from "@/components/ui/action-bar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Cancel01Icon,
  Delete02Icon,
  FilterHorizontalIcon,
  PlayIcon,
  PlusSignIcon,
  Refresh04Icon,
  Search02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { AssignMembersDialog } from "./components/assign-members-dialog"
import { CreateProjectDialog } from "./components/create-project-dialog"
import { DeleteProjectDialog } from "./components/delete-project-dialog"
import { EditProjectDialog } from "./components/edit-project-dialog"
import { ProjectsTable } from "./components/projects-table"
import { Project, STATUS_OPTIONS, WorkspaceMember } from "./types"

interface BulkActionPayload {
  status?: string
  userIds?: string[]
}

export default function ManageProjectsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const {
    workspaces,
    activeWorkspace,
    isLoading: isWorkspaceLoading,
  } = useWorkspaceContext()

  // Selection states for bulk action
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isBulkMembersOpen, setIsBulkMembersOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isBulkForceDeleteOpen, setIsBulkForceDeleteOpen] = useState(false)
  const [isBulkStartOpen, setIsBulkStartOpen] = useState(false)

  // Bulk actions member selection state
  const [bulkSelectedUserIds, setBulkSelectedUserIds] = useState<string[]>([])
  const [bulkMemberSearch, setBulkMemberSearch] = useState("")

  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Check Permissions
  const { hasPermission } = usePermissions()
  const isOwnerOrAdmin = hasPermission("member:read") // Org wide access check
  const canCreateProject = hasPermission("project:create")
  const canReadProjects = hasPermission("project:read")
  const canUpdateProject = hasPermission("project:update")
  const canDeleteProject = hasPermission("project:delete")
  const canRestoreProject = hasPermission("project:restore")
  const canForceDeleteProject = hasPermission("project:force-delete")
  const canAssignMembers = hasPermission("project-member:invite-member")

  // Load state from URL search params on mount
  useEffect(() => {
    const filtersParam = searchParams.get("filters")
    if (filtersParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(filtersParam))
        if (Array.isArray(parsed)) {
          setActiveFilters((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(parsed)) {
              return prev
            }
            return parsed
          })
        }
      } catch (e) {
        console.error("Failed to parse filters from URL", e)
      }
    } else {
      setActiveFilters((prev) => (prev.length === 0 ? prev : []))
    }

    const searchParam = searchParams.get("search") || ""
    setSearchQuery((prev) => (prev === searchParam ? prev : searchParam))
    setDebouncedSearchQuery((prev) =>
      prev === searchParam ? prev : searchParam
    )

    const sortByParam = searchParams.get("sortBy") || "createdAt"
    setSortBy((prev) => (prev === sortByParam ? prev : sortByParam))

    const sortOrderParam = searchParams.get("sortOrder") || "desc"
    if (sortOrderParam === "asc" || sortOrderParam === "desc") {
      setSortOrder((prev) => (prev === sortOrderParam ? prev : sortOrderParam))
    }
  }, [searchParams])

  // Debounce search query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Sync state to URL when debounced search query, active filters, or sort changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearchQuery.trim()) {
      params.set("search", debouncedSearchQuery)
    }
    if (activeFilters.length > 0) {
      params.set("filters", encodeURIComponent(JSON.stringify(activeFilters)))
    }
    if (sortBy !== "createdAt") {
      params.set("sortBy", sortBy)
    }
    if (sortOrder !== "desc") {
      params.set("sortOrder", sortOrder)
    }
    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    })
  }, [debouncedSearchQuery, activeFilters, sortBy, sortOrder, router])

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
  }

  const handleFiltersChange = (newFilters: Filter[]) => {
    setActiveFilters(newFilters)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  // Fetch all projects across workspaces paginated on server-side
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isProjectsLoading,
  } = useInfiniteQuery({
    queryKey: [
      "manage-all-projects-infinite",
      workspaces?.map((w) => w.id),
      activeWorkspace?.id,
      isOwnerOrAdmin,
      debouncedSearchQuery,
      activeFilters,
      sortBy,
      sortOrder,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!workspaces || workspaces.length === 0)
        return { data: [], nextCursor: undefined }

      // Determine workspaces to query
      const targetWorkspaces =
        !isOwnerOrAdmin && activeWorkspace ? [activeWorkspace] : workspaces

      // Parse filters to match server-side query params
      const serverParams: Record<
        string,
        string | number | boolean | undefined
      > = {
        page: pageParam,
        limit: 15,
        search: debouncedSearchQuery || undefined,
        sortBy,
        sortOrder,
      }

      // Trashed state
      const trashedFilter = activeFilters.find(
        (f) => f.field === "trashedState"
      )
      if (trashedFilter && trashedFilter.values.length > 0) {
        const val = trashedFilter.values[0]
        if (val === "only_trashed") {
          serverParams.onlyDeleted = "true"
          serverParams.includeDeleted = "true"
        } else if (val === "include_trashed") {
          serverParams.includeDeleted = "true"
        }
      }

      // Statuses
      const statusFilter = activeFilters.find((f) => f.field === "status")
      if (statusFilter && statusFilter.values.length > 0) {
        serverParams.status = statusFilter.values.join(",")
      }

      // Workspace filter overrides targetWorkspaces if provided in activeFilters
      const workspaceFilter = activeFilters.find(
        (f) => f.field === "workspaceId"
      )
      let finalWorkspaces = targetWorkspaces
      if (workspaceFilter && workspaceFilter.values.length > 0) {
        finalWorkspaces = targetWorkspaces.filter((w) =>
          workspaceFilter.values.includes(w.id)
        )
      }

      // Member filter
      const memberFilter = activeFilters.find((f) => f.field === "memberId")
      if (memberFilter && memberFilter.values.length > 0) {
        serverParams.memberIds = memberFilter.values.join(",")
      }

      // Created Date range
      const dateFilter = activeFilters.find((f) => f.field === "createdAt")
      if (dateFilter && dateFilter.values.length > 0) {
        const [start, end] = dateFilter.values
        const isValidDateStr = (s: string | unknown) =>
          typeof s === "string" &&
          s.trim() !== "" &&
          !isNaN(new Date(s).getTime())
        if (isValidDateStr(start)) serverParams.startDate = start as string
        if (isValidDateStr(end)) serverParams.endDate = end as string
      }

      // Fetch projects from workspaces in parallel
      const promises = finalWorkspaces.map(async (w) => {
        try {
          const res = await axiosInstance.get(`/workspaces/${w.id}/projects`, {
            params: serverParams,
          })
          const projectsList = res.data.data || []
          return projectsList.map((p: Project) => ({
            ...p,
            workspaceName: w.name,
            workspaceSlug: w.slug,
          }))
        } catch {
          return []
        }
      })

      const results = await Promise.all(promises)
      const flatProjects = results.flat()

      // If we got fewer projects than request limit times workspaces count, there's no next page
      const hasMore = flatProjects.length >= 15 * finalWorkspaces.length

      return {
        data: flatProjects,
        nextCursor: hasMore ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
    enabled:
      !!workspaces &&
      workspaces.length > 0 &&
      (canReadProjects || isOwnerOrAdmin),
    placeholderData: keepPreviousData,
  })

  // Flatten infinite pages
  const visibleProjects = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || []
  }, [data])

  // Fetch organization members to populate member filter option dropdowns
  const { data: orgMembers = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ["org-members-all"],
    queryFn: async () => {
      const res = await axiosInstance.get("/org/members?limit=100")
      return res.data.data || []
    },
    enabled: isOwnerOrAdmin || canReadProjects,
  })

  // Selected projects details for bulk validation
  const selectedProjects = useMemo(() => {
    return visibleProjects.filter((p) => selectedProjectIds.includes(p.id))
  }, [visibleProjects, selectedProjectIds])

  const hasActiveSelected = selectedProjects.some((p) => !p.deletedAt)
  const hasDeletedSelected = selectedProjects.some((p) => p.deletedAt)
  const allDeletedSelected =
    selectedProjects.length > 0 && selectedProjects.every((p) => p.deletedAt)

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async (payload: {
      projectIds: string[]
      action: string
      payload?: BulkActionPayload
    }) => {
      const res = await axiosInstance.post("/projects/bulk", payload)
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["manage-all-projects-infinite"],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setSelectedProjectIds([])
      toast.success(`Bulk action completed successfully`)
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err.response?.data?.message || "Failed to execute bulk action"
      )
    },
  })

  const handleBulkAction = (action: string, payload?: BulkActionPayload) => {
    bulkActionMutation.mutate({
      projectIds: selectedProjectIds,
      action,
      payload,
    })
  }

  // Filters field configurations
  const filterFields = useMemo<FilterFieldConfig[]>(() => {
    const isValidDate = (d: Date | undefined) =>
      d instanceof Date && !isNaN(d.getTime())

    return [
      {
        key: "trashedState",
        label: "Trashed Status",
        type: "select",
        options: [
          { value: "without_trashed", label: "Exclude Trashed" },
          { value: "only_trashed", label: "Only Trashed" },
          { value: "include_trashed", label: "Include Trashed" },
        ],
      },
      {
        key: "status",
        label: "Project Status",
        type: "multiselect",
        options: STATUS_OPTIONS.map((s) => ({
          value: s.value,
          label: s.label,
        })),
      },
      {
        key: "workspaceId",
        label: "Workspace",
        type: "multiselect",
        options: (workspaces || []).map((w) => ({
          value: w.id,
          label: w.name,
        })),
      },
      {
        key: "memberId",
        label: "Added Member",
        type: "multiselect",
        options: (Array.isArray(orgMembers) ? orgMembers : []).map(
          (m: WorkspaceMember) => ({
            value: m.userId,
            label: m.user?.name || m.user?.email || "Unknown Member",
          })
        ),
      },
      {
        key: "createdAt",
        label: "Created Date Range",
        type: "custom",
        customRenderer: ({ values, onChange }) => {
          const startDate = values[0]
            ? new Date(values[0] as string)
            : undefined
          const endDate = values[1] ? new Date(values[1] as string) : undefined

          const showStartDate = isValidDate(startDate)
          const showEndDate = isValidDate(endDate)

          let displayLabel = "Select date range"
          if (showStartDate && startDate && showEndDate && endDate) {
            displayLabel = `${startDate.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "2-digit" })} - ${endDate.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "2-digit" })}`
          } else if (showStartDate && startDate) {
            displayLabel = `From: ${startDate.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "2-digit" })}`
          } else if (showEndDate && endDate) {
            displayLabel = `To: ${endDate.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "2-digit" })}`
          }

          return (
            <Popover>
              <PopoverTrigger
                render={
                  <button className="cursor-pointer rounded px-2 py-0.5 text-xs font-semibold text-foreground transition-colors select-none hover:bg-muted/50">
                    {displayLabel}
                  </button>
                }
              />
              <PopoverContent
                className="z-9999 flex w-auto flex-col gap-2 rounded-lg border border-border bg-popover p-3 shadow-md"
                align="start"
              >
                <div className="flex min-w-50 flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      From
                    </span>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-full justify-start bg-background text-xs font-normal"
                          >
                            {showStartDate && startDate
                              ? startDate.toLocaleDateString()
                              : "Select start date"}
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0" align="start">
                        <ShadcnCalendar
                          mode="single"
                          selected={showStartDate ? startDate : undefined}
                          onSelect={(date) => {
                            onChange([
                              date ? date.toISOString() : "",
                              values[1] || "",
                            ])
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      To
                    </span>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-full justify-start bg-background text-xs font-normal"
                          >
                            {showEndDate && endDate
                              ? endDate.toLocaleDateString()
                              : "Select end date"}
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0" align="start">
                        <ShadcnCalendar
                          mode="single"
                          selected={showEndDate ? endDate : undefined}
                          onSelect={(date) => {
                            onChange([
                              values[0] || "",
                              date ? date.toISOString().split("T")[0] : "",
                            ])
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        },
      },
    ]
  }, [workspaces, orgMembers])

  const handleEditClick = (project: Project) => {
    setSelectedProject(project)
    setIsEditOpen(true)
  }

  const handleMembersClick = (project: Project) => {
    setSelectedProject(project)
    setIsMembersOpen(true)
  }

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project)
    setIsDeleteOpen(true)
  }

  const filteredOrgMembers = useMemo(() => {
    const membersArray = Array.isArray(orgMembers) ? orgMembers : []
    if (!bulkMemberSearch.trim()) return membersArray
    const query = bulkMemberSearch.toLowerCase()
    return membersArray.filter(
      (m) =>
        m.user?.name?.toLowerCase().includes(query) ||
        m.user?.email?.toLowerCase().includes(query)
    )
  }, [orgMembers, bulkMemberSearch])

  if (isWorkspaceLoading || isProjectsLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-6">
        <div className="max-w-9xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Card className="border border-border/50">
            <CardContent className="space-y-4 p-4">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background/50 p-6">
      <div className="max-w-9xl mx-auto space-y-6">
        {/* Header section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Manage Projects
            </h1>
            <p className="text-sm text-muted-foreground">
              Overview and management of all projects across organization
              workspaces.
            </p>
          </div>

          {canCreateProject && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="font-semibold shadow-xs"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
              New Project
            </Button>
          )}
        </div>

        {/* Filters and Search toolbar container */}
        <div className="flex w-full flex-col justify-between gap-4 rounded-xl border bg-muted/30 p-3 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {/* ReUI Multi-filter */}
            <Filters
              fields={filterFields}
              filters={activeFilters}
              onChange={handleFiltersChange}
              size="sm"
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 bg-background text-xs"
                >
                  <HugeiconsIcon
                    icon={FilterHorizontalIcon}
                    className="h-3.5 w-3.5 text-muted-foreground"
                  />
                  Filters
                </Button>
              }
            />
          </div>

          <div className="relative w-full shrink-0 md:max-w-xs">
            <HugeiconsIcon
              icon={Search02Icon}
              className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground"
              strokeWidth={2}
            />
            <Input
              placeholder="Search by title, key..."
              className="h-9 bg-background pl-9 text-xs"
              value={searchQuery}
              type="search"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Virtualized Projects Table */}
        <ProjectsTable
          projects={visibleProjects}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          canCreateProject={canCreateProject}
          canUpdateProject={canUpdateProject}
          canDeleteProject={canDeleteProject}
          canRestoreProject={canRestoreProject}
          canForceDeleteProject={canForceDeleteProject}
          selectedProjectIds={selectedProjectIds}
          onSelectProjectIds={setSelectedProjectIds}
          searchQuery={debouncedSearchQuery}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEditClick={handleEditClick}
          onMembersClick={handleMembersClick}
          onDeleteClick={handleDeleteClick}
        />

        {/* Create Project Dialog */}
        <CreateProjectDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          workspaces={workspaces || []}
          activeWorkspace={activeWorkspace}
        />

        {/* Edit Project Dialog */}
        <EditProjectDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          project={selectedProject}
        />

        {/* Member Assignment Dialog */}
        <AssignMembersDialog
          open={isMembersOpen}
          onOpenChange={setIsMembersOpen}
          project={selectedProject}
        />

        {/* Delete Confirmation Alert Dialog */}
        <DeleteProjectDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          project={selectedProject}
        />

        {/* Bulk Assign Members Dialog */}
        <Dialog open={isBulkMembersOpen} onOpenChange={setIsBulkMembersOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bulk Assign Members</DialogTitle>
              <DialogDescription>
                Assign members to the {selectedProjectIds.length} selected
                projects.
              </DialogDescription>
            </DialogHeader>

            <div className="relative py-2">
              <HugeiconsIcon
                icon={Search02Icon}
                className="absolute top-4 left-3.5 h-4 w-4 text-muted-foreground"
                strokeWidth={2}
              />
              <Input
                placeholder="Search organization members..."
                className="pl-9 text-xs"
                value={bulkMemberSearch}
                onChange={(e) => setBulkMemberSearch(e.target.value)}
              />
            </div>

            <div className="max-h-60 scrollbar-thin space-y-2 overflow-y-auto py-2 pr-1">
              {filteredOrgMembers.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center space-x-3 rounded-lg border p-2 transition-colors hover:bg-muted/30"
                >
                  <Checkbox
                    id={`bulk-member-${member.userId}`}
                    checked={bulkSelectedUserIds.includes(member.userId)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setBulkSelectedUserIds([
                          ...bulkSelectedUserIds,
                          member.userId,
                        ])
                      } else {
                        setBulkSelectedUserIds(
                          bulkSelectedUserIds.filter(
                            (id) => id !== member.userId
                          )
                        )
                      }
                    }}
                  />
                  <label
                    htmlFor={`bulk-member-${member.userId}`}
                    className="flex flex-1 cursor-pointer flex-col"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {member.user?.name || "Unknown Member"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {member.user?.email}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsBulkMembersOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleBulkAction("assign-members", {
                    userIds: bulkSelectedUserIds,
                  })
                  setIsBulkMembersOpen(false)
                  setBulkSelectedUserIds([])
                }}
                disabled={
                  bulkSelectedUserIds.length === 0 ||
                  bulkActionMutation.isPending
                }
              >
                Assign Selected
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Selection Bulk Action Bar ── */}
        <ActionBar
          open={selectedProjectIds.length > 0}
          onOpenChange={(open) => {
            const anyDialogOpen =
              isBulkDeleteOpen ||
              isBulkForceDeleteOpen ||
              isBulkStartOpen ||
              isBulkMembersOpen ||
              isCreateOpen ||
              isEditOpen ||
              isMembersOpen ||
              isDeleteOpen

            if (!open && !anyDialogOpen) {
              setSelectedProjectIds([])
            }
          }}
        >
          <ActionBarGroup>
            <ActionBarSelection>
              {selectedProjectIds.length} selected
              <ActionBarClose>
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="ml-2 cursor-pointer transition-opacity hover:opacity-85"
                  onClick={() => setSelectedProjectIds([])}
                />
              </ActionBarClose>
            </ActionBarSelection>
            <ActionBarSeparator />

            {/* Bulk Start Project Action */}
            {canUpdateProject && hasActiveSelected && (
              <ActionBarItem
                variant="outline"
                onSelect={() => setIsBulkStartOpen(true)}
                disabled={bulkActionMutation.isPending}
              >
                <HugeiconsIcon icon={PlayIcon} className="h-4 w-4" />
                Start
              </ActionBarItem>
            )}

            {/* Bulk Update Status Action */}
            {canUpdateProject && hasActiveSelected && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <ActionBarItem variant="outline">
                      <HugeiconsIcon
                        icon={Refresh04Icon}
                        className="mr-2 h-4 w-4"
                      />
                      Status
                    </ActionBarItem>
                  }
                />
                <DropdownMenuContent align="start">
                  {STATUS_OPTIONS.map((statusOpt) => (
                    <DropdownMenuItem
                      key={statusOpt.value}
                      onClick={() =>
                        handleBulkAction("update-status", {
                          status: statusOpt.value,
                        })
                      }
                      className="text-xs"
                    >
                      {statusOpt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Bulk Assign Members Action */}
            {canAssignMembers && hasActiveSelected && (
              <ActionBarItem
                variant="outline"
                onSelect={() => setIsBulkMembersOpen(true)}
                disabled={bulkActionMutation.isPending}
              >
                <HugeiconsIcon icon={UserAdd01Icon} className="h-4 w-4" />
                Assign Members
              </ActionBarItem>
            )}

            {/* Bulk Soft Delete Action */}
            {canDeleteProject && hasActiveSelected && (
              <ActionBarItem
                variant="destructive"
                onSelect={() => setIsBulkDeleteOpen(true)}
                disabled={bulkActionMutation.isPending}
              >
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                Delete
              </ActionBarItem>
            )}

            {/* Bulk Restore Action */}
            {canRestoreProject && hasDeletedSelected && (
              <ActionBarItem
                variant="outline"
                className="border-green-600/30 text-green-600 hover:bg-green-50 hover:text-green-700!"
                onSelect={() => handleBulkAction("restore")}
                disabled={bulkActionMutation.isPending}
              >
                <HugeiconsIcon icon={Refresh04Icon} className="h-4 w-4" />
                Restore
              </ActionBarItem>
            )}

            {/* Bulk Force Delete Action */}
            {canForceDeleteProject && allDeletedSelected && (
              <ActionBarItem
                variant="destructive"
                onSelect={() => setIsBulkForceDeleteOpen(true)}
                disabled={bulkActionMutation.isPending}
              >
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                Force Delete
              </ActionBarItem>
            )}
          </ActionBarGroup>
        </ActionBar>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <DialogTitle>Delete projects?</DialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete these{" "}
                {selectedProjectIds.length} projects?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleBulkAction("delete")
                  setIsBulkDeleteOpen(false)
                }}
                className="bg-destructive font-semibold hover:bg-destructive/95"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Force Delete Confirmation Dialog */}
        <AlertDialog
          open={isBulkForceDeleteOpen}
          onOpenChange={setIsBulkForceDeleteOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <DialogTitle>Permanently delete projects?</DialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete these{" "}
                {selectedProjectIds.length} projects? This action is
                irreversible and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleBulkAction("force-delete")
                  setIsBulkForceDeleteOpen(false)
                }}
                className="bg-destructive font-semibold hover:bg-destructive/95"
              >
                Permanently Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Start Projects Confirmation Dialog */}
        <AlertDialog open={isBulkStartOpen} onOpenChange={setIsBulkStartOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <DialogTitle>Start projects?</DialogTitle>
              <AlertDialogDescription>
                Are you sure you want to start these {selectedProjectIds.length}{" "}
                projects? This will set their start date to today and status to
                on track.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleBulkAction("start")
                  setIsBulkStartOpen(false)
                }}
                className="bg-primary font-semibold text-primary-foreground hover:bg-primary/95"
              >
                Start Projects
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
