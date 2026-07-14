"use client"

import {
  Add01Icon,
  Alert02Icon,
  ArrowLeftIcon,
  Briefcase02Icon,
  CalendarIcon,
  Cancel01Icon,
  ChartAverageIcon,
  ChartBarLineIcon,
  CheckmarkSquare02Icon,
  Delete02Icon,
  Edit02Icon,
  Loading03Icon,
  MoreHorizontalCircle01Icon,
  SearchIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs"
import React, { useState } from "react"
import { toast } from "sonner"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MultiSearchableSelect } from "@/components/ui/multi-searchable-select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { usePermissions } from "@/hooks/use-permissions"
import { axiosInstance } from "@/lib/axios"
import { useForm } from "@tanstack/react-form"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { IconStack } from "@/components/reui/icon-stack"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import {
  useCreatePortfolio,
  useDeletePortfolio,
  useForceDeletePortfolio,
  usePortfolioDetails,
  useRestorePortfolio,
  useUpdatePortfolio,
  useWorkspacePortfolios,
} from "../hooks/use-portfolios"

type WorkspaceMember = {
  userId: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

type ProjectItem = {
  id: string
  title: string
  projectKey: string
  icon?: string | null
}

interface PortfolioDashboardProps {
  portfolioId?: string
}

export function PortfolioDashboard({
  portfolioId,
}: PortfolioDashboardProps = {}) {
  const { activeWorkspace } = useWorkspaceContext()
  const { hasPermission } = usePermissions()
  const router = useRouter()
  const params = useParams()
  const workspaceSlug = params?.workspaceSlug as string

  // URL Query states
  const [selectedPortfolioId, setSelectedPortfolioId] = useQueryState(
    "portfolio",
    parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const activePortfolioId = portfolioId || selectedPortfolioId

  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const [showTrashed, setShowTrashed] = useQueryState(
    "trashed",
    parseAsBoolean
      .withDefault(false)
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString
      .withDefault("all")
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const [priorityFilter, setPriorityFilter] = useQueryState(
    "priority",
    parseAsString
      .withDefault("all")
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  // Dialog & Mutation States
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  // Track which portfolio is being edited in the dialog (separate from the detail view)
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(
    null
  )

  const handleSelectPortfolio = (id: string) => {
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}/portfolio/${id}`)
    } else {
      setSearchQuery("")
      setSelectedPortfolioId(id)
    }
  }

  const handleBack = () => {
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}/portfolio`)
    } else {
      setSearchQuery("")
      setSelectedPortfolioId("")
    }
  }

  // Fetch workspace portfolios
  const { data: portfolios = [], isLoading: portfoliosLoading } =
    useWorkspacePortfolios(activeWorkspace?.id || "", {
      withTrashed: showTrashed,
      onlyTrashed: showTrashed,
    })

  // Fetch selected portfolio details (for the detail view page)
  const { data: portfolioDetails, isLoading: detailsLoading } =
    usePortfolioDetails(activePortfolioId || "")

  // Fetch the portfolio being edited in the dialog (separate from detail view)
  const { data: editingPortfolioDetails } = usePortfolioDetails(
    editingPortfolioId || ""
  )

  // Fetch workspace members for project assignment
  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ["workspace-members", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return []
      const res = await axiosInstance.get(
        `/workspaces/${activeWorkspace.id}/members`
      )
      return res.data.data
    },
    enabled: !!activeWorkspace?.id,
  })

  // Fetch workspace projects for portfolios link
  const { data: workspaceProjects = [] } = useQuery<ProjectItem[]>({
    queryKey: ["projects", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return []
      const res = await axiosInstance.get(
        `/workspaces/${activeWorkspace.id}/projects`
      )
      return res.data.data
    },
    enabled: !!activeWorkspace?.id,
  })

  // Mutations
  const createPortfolioMutation = useCreatePortfolio(activeWorkspace?.id || "")
  const updatePortfolioMutation = useUpdatePortfolio(activeWorkspace?.id || "")
  const deletePortfolioMutation = useDeletePortfolio(activeWorkspace?.id || "")
  const restorePortfolioMutation = useRestorePortfolio(
    activeWorkspace?.id || ""
  )
  const forceDeletePortfolioMutation = useForceDeletePortfolio(
    activeWorkspace?.id || ""
  )

  // React Form for creating portfolio
  const createForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      projectIds: [] as string[],
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) return
      await createPortfolioMutation.mutateAsync({
        name: value.name.trim(),
        description: value.description.trim() || null,
        projectIds: value.projectIds,
      })
      setCreateDialogOpen(false)
      createForm.reset()
    },
  })

  // React Form for editing portfolio
  const editForm = useForm({
    defaultValues: {
      name: editingPortfolioDetails?.name || "",
      description: editingPortfolioDetails?.description || "",
      projectIds:
        editingPortfolioDetails?.projects.map((p) => p.id) || ([] as string[]),
    },
    onSubmit: async ({ value }) => {
      if (!editingPortfolioId || !value.name.trim()) return
      await updatePortfolioMutation.mutateAsync({
        id: editingPortfolioId,
        data: {
          name: value.name.trim(),
          description: value.description.trim() || null,
          projectIds: value.projectIds,
        },
      })
      setEditDialogOpen(false)
      setEditingPortfolioId(null)
    },
  })

  // Initialize edit form values when editing portfolio details load
  React.useEffect(() => {
    if (editingPortfolioDetails) {
      editForm.setFieldValue("name", editingPortfolioDetails.name || "")
      editForm.setFieldValue(
        "description",
        editingPortfolioDetails.description || ""
      )
      editForm.setFieldValue(
        "projectIds",
        editingPortfolioDetails.projects.map((p) => p.id) || []
      )
    }
  }, [editingPortfolioDetails, editForm])

  // Project inline updates
  const handleUpdateProjectField = async (
    projectId: string,
    fields: Record<string, unknown>
  ) => {
    try {
      await axiosInstance.patch(`/projects/${projectId}`, fields)
      toast.success("Project updated successfully")
      // Refetch portfolio details
      if (activePortfolioId) {
        updatePortfolioMutation.mutate({
          id: activePortfolioId,
          data: {}, // trigger queries invalidate
        })
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(
        error.response?.data?.message || "Failed to update project fields"
      )
    }
  }

  // Remove project from portfolio
  const handleRemoveProjectFromPortfolio = async (projectId: string) => {
    if (!portfolioDetails) return
    const currentProjectIds = portfolioDetails.projects.map((p) => p.id)
    const nextProjectIds = currentProjectIds.filter((id) => id !== projectId)
    await updatePortfolioMutation.mutateAsync({
      id: portfolioDetails.id,
      data: { projectIds: nextProjectIds },
    })
  }

  // Add project to portfolio
  const handleAddProjectToPortfolio = async (projectId: string) => {
    if (!portfolioDetails) return
    const currentProjectIds = portfolioDetails.projects.map((p) => p.id)
    if (currentProjectIds.includes(projectId)) return
    await updatePortfolioMutation.mutateAsync({
      id: portfolioDetails.id,
      data: { projectIds: [...currentProjectIds, projectId] },
    })
    setAddProjectOpen(false)
  }

  // Get project options that are NOT already in the portfolio
  const availableProjectsToAdd = workspaceProjects.filter(
    (wp) => !portfolioDetails?.projects.some((pp) => pp.id === wp.id)
  )

  // Filtering logics
  const filteredPortfolios = portfolios.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredProjects = portfolioDetails
    ? portfolioDetails.projects.filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.projectKey.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus =
          statusFilter === "all" || p.status === statusFilter
        const matchesPriority =
          priorityFilter === "all" || p.priority === priorityFilter
        return matchesSearch && matchesStatus && matchesPriority
      })
    : []

  // Dynamic Charting data
  const healthData = portfolioDetails
    ? portfolioDetails.projects.map((proj) => ({
        name: proj.title,
        completed: proj.completedTasks,
        delayed: proj.delayedTasks,
        remaining: Math.max(
          0,
          proj.totalTasks - proj.completedTasks - proj.delayedTasks
        ),
      }))
    : []

  const burndownData = [
    { day: "Mon", remaining: 100, ideal: 100 },
    { day: "Tue", remaining: 90, ideal: 85 },
    { day: "Wed", remaining: 80, ideal: 70 },
    { day: "Thu", remaining: 75, ideal: 55 },
    { day: "Fri", remaining: 55, ideal: 40 },
    { day: "Sat", remaining: 45, ideal: 25 },
    { day: "Sun", remaining: 35, ideal: 10 },
  ]

  // Render Status Badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_track":
        return (
          <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
            On Track
          </Badge>
        )
      case "at_risk":
        return (
          <Badge className="border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
            At Risk
          </Badge>
        )
      case "off_track":
        return (
          <Badge className="border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20">
            Off Track
          </Badge>
        )
      case "on_hold":
        return (
          <Badge className="border border-slate-500/20 bg-slate-500/10 text-slate-500 hover:bg-slate-500/20">
            On Hold
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Render Priority Badge helper
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-rose-500/15 text-rose-500 hover:bg-rose-500/25">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge className="bg-sky-500/15 text-sky-600 hover:bg-sky-500/25">
            Low
          </Badge>
        )
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  // Render Owner initials
  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Detail View */}
      {activePortfolioId && portfolioDetails ? (
        <div className="animate-in space-y-6 duration-200 fade-in">
          {/* Breadcrumbs and Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={() => {
                  handleBack()
                }}
              >
                <HugeiconsIcon icon={ArrowLeftIcon} className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {portfolioDetails.name}
                  </h2>
                  {portfolioDetails.deletedAt && (
                    <Badge variant="destructive">Archived / Deleted</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {portfolioDetails.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Add Project to Portfolio dropdown */}
              {hasPermission("portfolio:update") &&
                !portfolioDetails.deletedAt && (
                  <Popover
                    open={addProjectOpen}
                    onOpenChange={setAddProjectOpen}
                  >
                    <PopoverTrigger
                      nativeButton={false}
                      render={(triggerProps) => (
                        <Button
                          className="flex h-9 items-center gap-1.5"
                          {...triggerProps}
                        >
                          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
                          Add Project
                        </Button>
                      )}
                    />
                    <PopoverContent
                      align="end"
                      className="w-80 border border-border bg-card p-0"
                    >
                      <div className="border-b border-border/80 p-3">
                        <h4 className="text-sm font-semibold">
                          Add project to portfolio
                        </h4>
                      </div>
                      {availableProjectsToAdd.length === 0 ? (
                        <p className="p-4 text-center text-xs text-muted-foreground">
                          All workspace projects are already in this portfolio.
                        </p>
                      ) : (
                        <div className="max-h-60 space-y-0.5 overflow-y-auto p-1.5">
                          {availableProjectsToAdd.map((proj) => (
                            <button
                              key={proj.id}
                              className="flex w-full items-center gap-2.5 rounded-md p-2 text-left text-sm transition-colors hover:bg-muted"
                              onClick={() =>
                                handleAddProjectToPortfolio(proj.id)
                              }
                            >
                              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                                {proj.icon || proj.projectKey.slice(0, 2)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {proj.title}
                                </p>
                                <p className="text-2xs text-muted-foreground uppercase">
                                  {proj.projectKey}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                )}

              {/* Portfolio Config Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  nativeButton={false}
                  render={(triggerProps) => (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      {...triggerProps}
                    >
                      <HugeiconsIcon
                        icon={MoreHorizontalCircle01Icon}
                        className="h-4 w-4"
                      />
                    </Button>
                  )}
                />
                <DropdownMenuContent
                  align="end"
                  className="w-48 border border-border bg-card"
                >
                  {portfolioDetails.deletedAt ? (
                    <>
                      {hasPermission("portfolio:restore") && (
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2"
                          onClick={() => {
                            restorePortfolioMutation.mutate(portfolioDetails.id)
                          }}
                        >
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            className="h-4 w-4 text-emerald-500"
                          />
                          Restore Portfolio
                        </DropdownMenuItem>
                      )}
                      {hasPermission("portfolio:force-delete") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to permanently delete this portfolio? This action is irreversible."
                                )
                              ) {
                                forceDeletePortfolioMutation.mutate(
                                  portfolioDetails.id
                                )
                                handleBack()
                              }
                            }}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              className="h-4 w-4"
                            />
                            Delete Permanently
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {hasPermission("portfolio:update") && (
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2"
                          onClick={() => {
                            setEditingPortfolioId(activePortfolioId || null)
                            setEditDialogOpen(true)
                          }}
                        >
                          <HugeiconsIcon
                            icon={Edit02Icon}
                            className="h-4 w-4"
                          />
                          Edit Settings
                        </DropdownMenuItem>
                      )}
                      {hasPermission("portfolio:delete") && (
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to archive/delete this portfolio?"
                              )
                            ) {
                              deletePortfolioMutation.mutate(
                                portfolioDetails.id
                              )
                              handleBack()
                            }
                          }}
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            className="h-4 w-4"
                          />
                          Delete Portfolio
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Aggregate KPI Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-border/80 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Projects Count
                </CardTitle>
                <HugeiconsIcon
                  icon={Briefcase02Icon}
                  className="h-4 w-4 text-muted-foreground"
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {portfolioDetails.projects.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Linked initiatives
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Tasks
                </CardTitle>
                <HugeiconsIcon
                  icon={CheckmarkSquare02Icon}
                  className="h-4 w-4 text-muted-foreground"
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {portfolioDetails.projects.reduce(
                    (acc, curr) => acc + curr.completedTasks,
                    0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all initiatives
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  At Risk / Delayed
                </CardTitle>
                <HugeiconsIcon
                  icon={Alert02Icon}
                  className="h-4 w-4 text-rose-500"
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-500">
                  {portfolioDetails.projects.reduce(
                    (acc, curr) => acc + curr.delayedTasks,
                    0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Progress
                </CardTitle>
                <HugeiconsIcon
                  icon={ChartBarLineIcon}
                  className="h-4 w-4 text-muted-foreground"
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {portfolioDetails.projects.length > 0
                    ? Math.round(
                        portfolioDetails.projects.reduce(
                          (acc, curr) => acc + curr.progress,
                          0
                        ) / portfolioDetails.projects.length
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Completion average rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtering and search panel */}
          <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-sm flex-1">
              <HugeiconsIcon
                icon={SearchIcon}
                className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground"
              />
              <Input
                placeholder="Search projects inside portfolio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 border-input bg-background/50 pl-9 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val)}
                >
                  <SelectTrigger className="h-9 w-32 border-input bg-background/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="border border-border bg-card">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="off_track">Off Track</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Priority:</span>
                <Select
                  value={priorityFilter}
                  onValueChange={(val) => setPriorityFilter(val)}
                >
                  <SelectTrigger className="h-9 w-32 border-input bg-background/50">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="border border-border bg-card">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border/80 hover:bg-transparent">
                  <TableHead className="py-3 font-semibold text-foreground">
                    Project
                  </TableHead>
                  <TableHead className="w-40 py-3 font-semibold text-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-56 py-3 font-semibold text-foreground">
                    Progress
                  </TableHead>
                  <TableHead className="w-32 py-3 font-semibold text-foreground">
                    Priority
                  </TableHead>
                  <TableHead className="w-48 py-3 font-semibold text-foreground">
                    Timeline
                  </TableHead>
                  <TableHead className="w-48 py-3 font-semibold text-foreground">
                    Project Owner
                  </TableHead>
                  <TableHead className="w-16 py-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No projects match the filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((proj) => (
                    <TableRow
                      key={proj.id}
                      className="border-b border-border/40 transition-colors hover:bg-muted/10"
                    >
                      {/* Project Title */}
                      <TableCell className="py-3 font-medium">
                        <a
                          href={`/${workspaceSlug}/projects/${proj.id}`}
                          className="group flex items-center gap-2.5 hover:underline"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                            {proj.icon || proj.projectKey.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm leading-none font-semibold text-foreground">
                              {proj.title}
                            </p>
                            <p className="mt-0.5 text-2xs tracking-wide text-muted-foreground uppercase">
                              {proj.projectKey}
                            </p>
                          </div>
                        </a>
                      </TableCell>

                      {/* Status Dropdown/Badge */}
                      <TableCell className="py-3">
                        {hasPermission("portfolio:update") ? (
                          <Select
                            value={proj.status}
                            onValueChange={(val) =>
                              handleUpdateProjectField(proj.id, { status: val })
                            }
                          >
                            <SelectTrigger className="h-8 w-auto rounded border-none p-0 px-1 transition-colors hover:bg-muted/30 focus:ring-0">
                              <SelectValue>
                                {getStatusBadge(proj.status)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="border border-border bg-card">
                              <SelectItem value="on_track">On Track</SelectItem>
                              <SelectItem value="at_risk">At Risk</SelectItem>
                              <SelectItem value="off_track">
                                Off Track
                              </SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getStatusBadge(proj.status)
                        )}
                      </TableCell>

                      {/* Progress Bar */}
                      <TableCell className="py-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>{proj.progress}% complete</span>
                            <span>
                              {proj.completedTasks}/{proj.totalTasks} tasks
                            </span>
                          </div>
                          <Progress
                            value={proj.progress}
                            className="h-1.5 overflow-hidden rounded-full bg-muted [&>div]:bg-emerald-500"
                          />
                        </div>
                      </TableCell>

                      {/* Priority Dropdown/Badge */}
                      <TableCell className="py-3">
                        {hasPermission("portfolio:update") ? (
                          <Select
                            value={proj.priority}
                            onValueChange={(val) =>
                              handleUpdateProjectField(proj.id, {
                                priority: val,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-auto rounded border-none p-0 px-1 transition-colors hover:bg-muted/30 focus:ring-0">
                              <SelectValue>
                                {getPriorityBadge(proj.priority)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="border border-border bg-card">
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getPriorityBadge(proj.priority)
                        )}
                      </TableCell>

                      {/* Timeline / Dates Picker */}
                      <TableCell className="py-3 text-sm text-foreground">
                        {hasPermission("portfolio:update") ? (
                          <Popover>
                            <PopoverTrigger
                              nativeButton={false}
                              render={(triggerProps) => (
                                <button
                                  className="flex items-center gap-1.5 rounded border border-dashed border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30"
                                  {...triggerProps}
                                >
                                  <HugeiconsIcon
                                    icon={CalendarIcon}
                                    className="h-3 w-3"
                                  />
                                  {proj.startDate || proj.endDate ? (
                                    <span className="text-foreground">
                                      {proj.startDate
                                        ? format(
                                            new Date(proj.startDate),
                                            "MMM d"
                                          )
                                        : "?"}{" "}
                                      -{" "}
                                      {proj.endDate
                                        ? format(
                                            new Date(proj.endDate),
                                            "MMM d, yyyy"
                                          )
                                        : "?"}
                                    </span>
                                  ) : (
                                    <span>Set Dates</span>
                                  )}
                                </button>
                              )}
                            />
                            <PopoverContent
                              align="start"
                              className="w-auto space-y-3 border border-border bg-card p-4"
                            >
                              <div className="flex gap-2">
                                <div className="space-y-1">
                                  <span className="text-2xs font-bold text-muted-foreground uppercase">
                                    Start Date
                                  </span>
                                  <Input
                                    type="date"
                                    defaultValue={
                                      proj.startDate
                                        ? proj.startDate.split("T")[0]
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleUpdateProjectField(proj.id, {
                                        startDate: e.target.value || null,
                                      })
                                    }
                                    className="h-8 border-input bg-background/50 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-2xs font-bold text-muted-foreground uppercase">
                                    End Date
                                  </span>
                                  <Input
                                    type="date"
                                    defaultValue={
                                      proj.endDate
                                        ? proj.endDate.split("T")[0]
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleUpdateProjectField(proj.id, {
                                        endDate: e.target.value || null,
                                      })
                                    }
                                    className="h-8 border-input bg-background/50 text-xs"
                                  />
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : proj.startDate || proj.endDate ? (
                          <span>
                            {proj.startDate
                              ? format(new Date(proj.startDate), "MMM d")
                              : "?"}{" "}
                            -{" "}
                            {proj.endDate
                              ? format(new Date(proj.endDate), "MMM d, yyyy")
                              : "?"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Not scheduled
                          </span>
                        )}
                      </TableCell>

                      {/* Owner Dropdown */}
                      <TableCell className="py-3">
                        {hasPermission("portfolio:update") ? (
                          <Select
                            value={proj.owner?.id || "unassigned"}
                            onValueChange={(val) =>
                              handleUpdateProjectField(proj.id, {
                                ownerId: val === "unassigned" ? null : val,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-full justify-start rounded border-none p-0 px-1 transition-colors hover:bg-muted/30 focus:ring-0">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 border border-border">
                                    {proj.owner?.image ? (
                                      <AvatarImage
                                        src={proj.owner.image}
                                        alt={proj.owner.name}
                                      />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/5 text-2xs font-bold text-primary">
                                      {getInitials(proj.owner?.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="max-w-[100px] truncate text-xs font-medium text-foreground">
                                    {proj.owner?.name || "Unassigned"}
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-60 border border-border bg-card">
                              <SelectItem value="unassigned">
                                Unassigned
                              </SelectItem>
                              {members.map((member) => (
                                <SelectItem
                                  key={member.userId}
                                  value={member.userId}
                                >
                                  {member.user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-border">
                              {proj.owner?.image ? (
                                <AvatarImage
                                  src={proj.owner.image}
                                  alt={proj.owner.name}
                                />
                              ) : null}
                              <AvatarFallback className="bg-primary/5 text-2xs font-bold text-primary">
                                {getInitials(proj.owner?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs font-medium text-foreground">
                              {proj.owner?.name || "Unassigned"}
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Remove Actions */}
                      <TableCell className="py-3">
                        {hasPermission("portfolio:update") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                            onClick={() =>
                              handleRemoveProjectFromPortfolio(proj.id)
                            }
                            title="Remove project from portfolio"
                          >
                            <HugeiconsIcon
                              icon={Cancel01Icon}
                              className="h-3.5 w-3.5"
                            />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Charts section */}
          {portfolioDetails.projects.length > 0 && (
            <div className="grid gap-6 pt-4 md:grid-cols-2">
              {/* Health Chart */}
              <Card className="border border-border/80 bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Initiatives Tasks Completion
                  </CardTitle>
                  <CardDescription>
                    Visual health progress stack of your portfolio projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={healthData}
                        layout="vertical"
                        margin={{ top: 0, right: 0, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="var(--border)"
                          strokeOpacity={0.2}
                        />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: "var(--muted-foreground)",
                          }}
                          width={100}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--muted)" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "var(--shadow-md)",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="completed"
                          name="Completed Tasks"
                          stackId="a"
                          fill="var(--color-chart-2)"
                          radius={[0, 0, 0, 0]}
                          barSize={20}
                        />
                        <Bar
                          dataKey="remaining"
                          name="In Progress"
                          stackId="a"
                          fill="var(--color-chart-3)"
                          radius={[0, 0, 0, 0]}
                          barSize={20}
                        />
                        <Bar
                          dataKey="delayed"
                          name="Delayed / At Risk"
                          stackId="a"
                          fill="var(--color-chart-1)"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Burndown Chart */}
              <Card className="border border-border/80 bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Burn-down Progress
                  </CardTitle>
                  <CardDescription>
                    Aggregate remaining workload vs ideal progress guidelines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={burndownData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--border)"
                          strokeOpacity={0.2}
                        />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "var(--shadow-md)",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="remaining"
                          name="Actual Remaining"
                          stroke="var(--color-chart-3)"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="ideal"
                          name="Ideal Guideline"
                          stroke="var(--color-chart-2)"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* Portfolios List View */
        <div className="animate-in space-y-6 duration-200 fade-in">
          {/* Header section */}
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                Portfolio Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitor status, progress, owner, and timeline across multiple
                workspace projects in a single place.
              </p>
            </div>
            {filteredPortfolios.length !== 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Filter:</span>
                  <Select
                    value={showTrashed ? "trashed" : "active"}
                    onValueChange={(val) => setShowTrashed(val === "trashed")}
                  >
                    <SelectTrigger className="h-9 w-32 border-input bg-card shadow-sm">
                      <SelectValue placeholder="Show active" />
                    </SelectTrigger>
                    <SelectContent className="border border-border bg-card">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trashed">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasPermission("portfolio:create") && !showTrashed && (
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="flex h-9 items-center gap-1.5 font-semibold"
                  >
                    <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
                    New Portfolio
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm">
            <HugeiconsIcon
              icon={SearchIcon}
              className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground"
            />
            <Input
              placeholder="Search portfolios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 border-input bg-card pl-9 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Portfolios Table */}
          {portfoliosLoading ? (
            <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="py-3 font-semibold text-foreground">
                      Portfolio Name
                    </TableHead>
                    <TableHead className="w-32 py-3 font-semibold text-foreground">
                      Projects
                    </TableHead>
                    <TableHead className="w-56 py-3 font-semibold text-foreground">
                      Progress
                    </TableHead>
                    <TableHead className="w-48 py-3 font-semibold text-foreground">
                      Status Summary
                    </TableHead>
                    <TableHead className="w-48 py-3 font-semibold text-foreground">
                      Owner
                    </TableHead>
                    <TableHead className="w-16 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow
                      key={i}
                      className="animate-pulse border-b border-border/40"
                    >
                      <TableCell className="py-4">
                        <div className="mb-2 h-4 w-2/3 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="h-4 w-12 rounded bg-muted" />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="h-3 w-full rounded bg-muted" />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="h-4 w-20 rounded bg-muted" />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="h-6 w-6 rounded-full bg-muted" />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="h-6 w-6 rounded-md bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredPortfolios.length === 0 ? (
            <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center shadow-none">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <IconStack
                      aria-hidden="true"
                      className="h-24 w-22 text-primary"
                    >
                      <HugeiconsIcon
                        icon={ChartAverageIcon}
                        className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                      />
                    </IconStack>
                  </EmptyMedia>
                  <EmptyTitle>
                    {showTrashed
                      ? "No archived portfolios"
                      : "Ready to organize your projects?"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {showTrashed
                      ? "There are no archived/deleted portfolios in this workspace."
                      : "Portfolios help you monitor status, progress, owner, and timeline across multiple workspace projects in a single place."}
                  </EmptyDescription>
                </EmptyHeader>
                {!showTrashed && hasPermission("portfolio:create") && (
                  <EmptyDescription>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <HugeiconsIcon
                        icon={Add01Icon}
                        className="mr-2 h-4 w-4"
                      />
                      Create Your First Portfolio
                    </Button>
                  </EmptyDescription>
                )}
              </Empty>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="py-3 font-semibold text-foreground">
                      Portfolio Name
                    </TableHead>
                    <TableHead className="w-32 py-3 font-semibold text-foreground">
                      Projects
                    </TableHead>
                    <TableHead className="w-56 py-3 font-semibold text-foreground">
                      Progress
                    </TableHead>
                    <TableHead className="w-48 py-3 font-semibold text-foreground">
                      Status Summary
                    </TableHead>
                    <TableHead className="w-48 py-3 font-semibold text-foreground">
                      Owner
                    </TableHead>
                    <TableHead className="w-16 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPortfolios.map((port) => {
                    const projectsCount = port.projects?.length || 0
                    const averageProgress =
                      projectsCount > 0
                        ? Math.round(
                            port.projects.reduce(
                              (acc, curr) => acc + curr.progress,
                              0
                            ) / projectsCount
                          )
                        : 0

                    const onTrackCount =
                      port.projects?.filter((p) => p.status === "on_track")
                        .length || 0
                    const atRiskCount =
                      port.projects?.filter((p) => p.status === "at_risk")
                        .length || 0
                    const offTrackCount =
                      port.projects?.filter((p) => p.status === "off_track")
                        .length || 0
                    const onHoldCount =
                      port.projects?.filter((p) => p.status === "on_hold")
                        .length || 0

                    return (
                      <TableRow
                        key={port.id}
                        className="group cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/10"
                        onClick={() => {
                          handleSelectPortfolio(port.id)
                        }}
                      >
                        {/* Name and Description */}
                        <TableCell className="py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm leading-none font-semibold text-foreground transition-all group-hover:text-primary group-hover:underline">
                                {port.name}
                              </span>
                              {port.deletedAt && (
                                <Badge
                                  variant="destructive"
                                  className="h-5 px-1.5 py-0 text-2xs"
                                >
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                              {port.description || "No description provided."}
                            </p>
                          </div>
                        </TableCell>

                        {/* Projects Count */}
                        <TableCell className="py-4 text-sm font-medium text-foreground">
                          {projectsCount} projects
                        </TableCell>

                        {/* Average Progress */}
                        <TableCell className="py-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                              <span>{averageProgress}% progress</span>
                            </div>
                            <Progress
                              value={averageProgress}
                              className="h-1.5 overflow-hidden rounded-full bg-muted [&>div]:bg-primary"
                            />
                          </div>
                        </TableCell>

                        {/* Status Summary */}
                        <TableCell className="py-4">
                          <div className="flex gap-2.5">
                            <div
                              className="flex items-center gap-1 text-xs font-bold text-emerald-500"
                              title={`${onTrackCount} projects on track`}
                            >
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                              {onTrackCount}
                            </div>
                            <div
                              className="flex items-center gap-1 text-xs font-bold text-amber-500"
                              title={`${atRiskCount} projects at risk`}
                            >
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                              {atRiskCount}
                            </div>
                            <div
                              className="flex items-center gap-1 text-xs font-bold text-rose-500"
                              title={`${offTrackCount} projects off track`}
                            >
                              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                              {offTrackCount}
                            </div>
                            {onHoldCount > 0 && (
                              <div
                                className="flex items-center gap-1 text-xs font-bold text-slate-400"
                                title={`${onHoldCount} projects on hold`}
                              >
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                                {onHoldCount}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Portfolio Owner */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-border">
                              {port.owner?.image ? (
                                <AvatarImage
                                  src={port.owner.image}
                                  alt={port.owner.name}
                                />
                              ) : null}
                              <AvatarFallback className="bg-primary/5 text-2xs font-bold text-primary">
                                {getInitials(port.owner?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="max-w-[130px] truncate text-xs font-semibold text-foreground">
                              {port.owner?.name || "Unassigned"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions Dropdown */}
                        <TableCell
                          className="py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              nativeButton={false}
                              render={(triggerProps) => (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 rounded-md text-muted-foreground hover:bg-muted"
                                  {...triggerProps}
                                >
                                  <HugeiconsIcon
                                    icon={MoreHorizontalCircle01Icon}
                                    className="h-4 w-4"
                                  />
                                </Button>
                              )}
                            />
                            <DropdownMenuContent
                              align="end"
                              className="w-48 border border-border bg-card"
                            >
                              {port.deletedAt ? (
                                <>
                                  {hasPermission("portfolio:restore") && (
                                    <DropdownMenuItem
                                      className="flex cursor-pointer items-center gap-2"
                                      onClick={() =>
                                        restorePortfolioMutation.mutate(port.id)
                                      }
                                    >
                                      <HugeiconsIcon
                                        icon={Tick02Icon}
                                        className="h-4 w-4 text-emerald-500"
                                      />
                                      Restore Portfolio
                                    </DropdownMenuItem>
                                  )}
                                  {hasPermission("portfolio:force-delete") && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                                        onClick={() => {
                                          if (
                                            confirm(
                                              "Are you sure you want to permanently delete this portfolio? This action is irreversible."
                                            )
                                          ) {
                                            forceDeletePortfolioMutation.mutate(
                                              port.id
                                            )
                                          }
                                        }}
                                      >
                                        <HugeiconsIcon
                                          icon={Delete02Icon}
                                          className="h-4 w-4"
                                        />
                                        Delete Permanently
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  {hasPermission("portfolio:update") && (
                                    <DropdownMenuItem
                                      className="flex cursor-pointer items-center gap-2"
                                      onClick={() => {
                                        setEditingPortfolioId(port.id)
                                        setEditDialogOpen(true)
                                      }}
                                    >
                                      <HugeiconsIcon
                                        icon={Edit02Icon}
                                        className="h-4 w-4"
                                      />
                                      Edit Settings
                                    </DropdownMenuItem>
                                  )}
                                  {hasPermission("portfolio:delete") && (
                                    <DropdownMenuItem
                                      className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            "Are you sure you want to archive/delete this portfolio?"
                                          )
                                        ) {
                                          deletePortfolioMutation.mutate(
                                            port.id
                                          )
                                        }
                                      }}
                                    >
                                      <HugeiconsIcon
                                        icon={Delete02Icon}
                                        className="h-4 w-4"
                                      />
                                      Delete Portfolio
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md border border-border bg-card">
          <DialogHeader>
            <DialogTitle>Create New Portfolio</DialogTitle>
            <DialogDescription>
              Group projects together to track status, timelines, progress, and
              ownership in real-time.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              createForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <createForm.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Portfolio name is required" : undefined,
              }}
            >
              {(field) => {
                const hasError =
                  field.state.meta.isTouched && !!field.state.meta.errors.length
                return (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
                      Portfolio Name
                    </label>
                    <Input
                      placeholder="e.g. Q3 Strategic Roadmaps"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {hasError && (
                      <p className="mt-1 text-2xs font-semibold text-destructive">
                        {String(field.state.meta.errors[0])}
                      </p>
                    )}
                  </div>
                )
              }}
            </createForm.Field>

            <createForm.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
                    Description
                  </label>
                  <Textarea
                    placeholder="Provide a brief summary of what this portfolio covers."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[80px] border-input bg-background/50 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              )}
            </createForm.Field>

            <createForm.Field name="projectIds">
              {(field) => {
                const options = workspaceProjects.map((p) => ({
                  value: p.id,
                  label: `${p.title} (${p.projectKey})`,
                }))
                return (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
                      Link Projects
                    </label>
                    <MultiSearchableSelect
                      options={options}
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val)}
                      placeholder="Select projects to group..."
                      searchPlaceholder="Search projects..."
                    />
                  </div>
                )
              }}
            </createForm.Field>

            <DialogFooter className="border-t border-border/50 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="h-9 border-input"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPortfolioMutation.isPending}
                className="h-9 font-semibold"
              >
                {createPortfolioMutation.isPending && (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="mr-1.5 h-4 w-4 animate-spin"
                  />
                )}
                Create Portfolio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingPortfolioId(null)
        }}
      >
        <DialogContent className="max-w-md border border-border bg-card">
          <DialogHeader>
            <DialogTitle>Edit Portfolio Settings</DialogTitle>
            <DialogDescription>
              Update portfolio name, description, and project links.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              editForm.handleSubmit()
            }}
            className="space-y-4"
          >
            <editForm.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Portfolio name is required" : undefined,
              }}
            >
              {(field) => {
                const hasError =
                  field.state.meta.isTouched && !!field.state.meta.errors.length
                return (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
                      Portfolio Name
                    </label>
                    <Input
                      placeholder="e.g. Q3 Strategic Roadmaps"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {hasError && (
                      <p className="mt-1 text-2xs font-semibold text-destructive">
                        {String(field.state.meta.errors[0])}
                      </p>
                    )}
                  </div>
                )
              }}
            </editForm.Field>

            <editForm.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
                    Description
                  </label>
                  <Textarea
                    placeholder="Provide a brief summary of what this portfolio covers."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[80px] border-input bg-background/50 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              )}
            </editForm.Field>

            <editForm.Field name="projectIds">
              {(field) => {
                const options = workspaceProjects.map((p) => ({
                  value: p.id,
                  label: `${p.title} (${p.projectKey})`,
                }))
                return (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
                      Linked Projects
                    </label>
                    <MultiSearchableSelect
                      options={options}
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val)}
                      placeholder="Select projects to group..."
                      searchPlaceholder="Search projects..."
                    />
                  </div>
                )
              }}
            </editForm.Field>

            <DialogFooter className="border-t border-border/50 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="h-9 border-input"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatePortfolioMutation.isPending}
                className="h-9 font-semibold"
              >
                {updatePortfolioMutation.isPending && (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="mr-1.5 h-4 w-4 animate-spin"
                  />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
