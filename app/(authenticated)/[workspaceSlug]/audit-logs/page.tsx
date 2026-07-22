"use client"

import React, { useState, useRef, useEffect } from "react"
import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Search,
  Download,
  Filter,
  RotateCcw,
  Calendar as CalendarIcon,
  Info,
  Laptop,
  Globe,
  Database,
  CheckSquare,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { axiosInstance } from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MultiSearchableSelect } from "@/components/ui/multi-searchable-select"
import { cn } from "@/lib/utils"
import {
  useQueryState,
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
} from "nuqs"

interface WorkspaceMember {
  userId: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  entityName: string | null
  description: string
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    name: string
    email: string
    image?: string | null
  }
}

interface PaginatedAuditLogs {
  data: AuditLogEntry[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const AVAILABLE_ACTIONS = [
  { value: "USER_SIGN_IN", label: "User Sign In" },
  { value: "CREATE_INVITATION", label: "Create Invitation" },
  { value: "CANCEL_INVITATION", label: "Cancel Invitation" },
  { value: "CREATE_PROJECT", label: "Create Project" },
  { value: "UPDATE_PROJECT", label: "Update Project" },
  { value: "DELETE_PROJECT", label: "Delete Project" },
  { value: "RESTORE_PROJECT", label: "Restore Project" },
  { value: "FORCE_DELETE_PROJECT", label: "Force Delete Project" },
  { value: "CREATE_WORKSPACE", label: "Create Workspace" },
  { value: "UPDATE_WORKSPACE", label: "Update Workspace" },
  { value: "DELETE_WORKSPACE", label: "Delete Workspace" },
  { value: "RESTORE_WORKSPACE", label: "Restore Workspace" },
  { value: "FORCE_DELETE_WORKSPACE", label: "Force Delete Workspace" },
  { value: "CREATE_ROLE", label: "Create Role" },
  { value: "UPDATE_ROLE", label: "Update Role Settings" },
  { value: "DELETE_ROLE", label: "Delete Role" },
  { value: "CREATE_TASK", label: "Create Task" },
  { value: "UPDATE_TASK", label: "Update Task" },
  { value: "DELETE_TASK", label: "Delete Task" },
  { value: "RESTORE_TASK", label: "Restore Task" },
  { value: "FORCE_DELETE_TASK", label: "Force Delete Task" },
  { value: "CREATE_SPRINT", label: "Create Sprint" },
  { value: "UPDATE_SPRINT", label: "Update Sprint" },
  { value: "DELETE_SPRINT", label: "Delete Sprint" },
  { value: "RESTORE_SPRINT", label: "Restore Sprint" },
  { value: "FORCE_DELETE_SPRINT", label: "Force Delete Sprint" },
  { value: "CREATE_EPIC", label: "Create Epic" },
  { value: "UPDATE_EPIC", label: "Update Epic" },
  { value: "DELETE_EPIC", label: "Delete Epic" },
  { value: "RESTORE_EPIC", label: "Restore Epic" },
  { value: "FORCE_DELETE_EPIC", label: "Force Delete Epic" },
  { value: "CREATE_LABEL", label: "Create Label" },
  { value: "UPDATE_LABEL", label: "Update Label" },
  { value: "DELETE_LABEL", label: "Delete Label" },
  { value: "RESTORE_LABEL", label: "Restore Label" },
  { value: "FORCE_DELETE_LABEL", label: "Force Delete Label" },
  { value: "CREATE_COMMENT", label: "Add Comment" },
  { value: "UPDATE_COMMENT", label: "Update Comment" },
  { value: "DELETE_COMMENT", label: "Delete Comment" },
  { value: "CREATE_CUSTOM_FIELD", label: "Create Custom Field" },
  { value: "UPDATE_CUSTOM_FIELD", label: "Update Custom Field" },
  { value: "DELETE_CUSTOM_FIELD", label: "Delete Custom Field" },
  { value: "CREATE_TASK_STATUS", label: "Create Task Status" },
  { value: "UPDATE_TASK_STATUS", label: "Update Task Status" },
  { value: "DELETE_TASK_STATUS", label: "Delete Task Status" },
  { value: "CREATE_AUTOMATION", label: "Create Automation" },
  { value: "UPDATE_AUTOMATION", label: "Update Automation" },
  { value: "DELETE_AUTOMATION", label: "Delete Automation" },
  { value: "CREATE_VAULT", label: "Create Vault" },
  { value: "UPDATE_VAULT", label: "Update Vault" },
  { value: "DELETE_VAULT", label: "Delete Vault" },
  { value: "CREATE_VAULT_SERVICE", label: "Create Vault Service" },
  { value: "UPDATE_VAULT_SERVICE", label: "Update Vault Service" },
  { value: "DELETE_VAULT_SERVICE", label: "Delete Vault Service" },
  { value: "CREATE_VAULT_ITEM", label: "Create Vault Item" },
  { value: "UPDATE_VAULT_ITEM", label: "Update Vault Item" },
  { value: "DELETE_VAULT_ITEM", label: "Delete Vault Item" },
]

export default function AuditLogsPage() {
  const { activeWorkspace, isLoading: isWorkspaceLoading } =
    useWorkspaceContext()

  // Filters State using nuqs for shareable URL query parameters
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const [selectedMembers, setSelectedMembers] = useQueryState(
    "members",
    parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const [selectedActions, setSelectedActions] = useQueryState(
    "actions",
    parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const [startDateStr, setStartDateStr] = useQueryState(
    "startDate",
    parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const [endDateStr, setEndDateStr] = useQueryState(
    "endDate",
    parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const [, setPage] = useQueryState(
    "page",
    parseAsInteger
      .withDefault(1)
      .withOptions({ clearOnDefault: true, shallow: true })
  )

  const startDate = startDateStr ? new Date(startDateStr) : undefined
  const endDate = endDateStr ? new Date(endDateStr) : undefined

  const setStartDate = (date: Date | undefined) => {
    setStartDateStr(date ? format(date, "yyyy-MM-dd") : "")
  }

  const setEndDate = (date: Date | undefined) => {
    setEndDateStr(date ? format(date, "yyyy-MM-dd") : "")
  }

  const [limit] = useState(15)

  // Advanced Filters toggle
  const [showFilters, setShowFilters] = useState(false)

  // Modal State for JSON Metadata View
  const [selectedMetadata, setSelectedMetadata] = useState<Record<
    string,
    unknown
  > | null>(null)

  // Fetch Workspace Members for filter list
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

  // Fetch Audit Logs with filters (using Infinite Query for virtual scrolling)
  const {
    data: logsData,
    isLoading: isLogsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedAuditLogs>({
    queryKey: [
      "audit-logs",
      activeWorkspace?.id,
      search,
      selectedMembers,
      selectedActions,
      startDateStr,
      endDateStr,
      limit,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!activeWorkspace?.id) {
        return {
          data: [],
          meta: { total: 0, page: 1, limit: 15, totalPages: 0 },
        }
      }

      const params = new URLSearchParams()
      params.append("page", String(pageParam))
      params.append("limit", String(limit))

      if (search) params.append("search", search)
      if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"))
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"))

      selectedMembers.forEach((id) => params.append("memberIds", id))
      selectedActions.forEach((action) => params.append("actions", action))

      const res = await axiosInstance.get(
        `/workspaces/${activeWorkspace.id}/audit-logs?${params.toString()}`
      )
      return res.data.data
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.meta.page + 1
      return nextPage <= lastPage.meta.totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    enabled: !!activeWorkspace?.id,
  })

  const parentRef = useRef<HTMLDivElement>(null)

  const allRows = logsData ? logsData.pages.flatMap((page) => page.data) : []

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // estimated row height
    overscan: 5,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  useEffect(() => {
    const [lastItem] = [...virtualRows].reverse()
    if (!lastItem) return

    if (
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    virtualRows,
  ])

  // Export Mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace?.id) return
      await axiosInstance.post(
        `/workspaces/${activeWorkspace.id}/audit-logs/export`,
        {
          search: search || undefined,
          startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          memberIds: selectedMembers.length ? selectedMembers : undefined,
          actions: selectedActions.length ? selectedActions : undefined,
        }
      )
    },
    onSuccess: () => {
      toast.success(
        "Export started in the background. You will receive an email and in-app notification when the CSV file is ready.",
        { duration: 6000 }
      )
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to start export."
      toast.error(errorMsg)
    },
  })

  // Clear all filters
  const handleResetFilters = () => {
    setSearch("")
    setSelectedMembers([])
    setSelectedActions([])
    setStartDateStr("")
    setEndDateStr("")
    setPage(1)
  }

  if (isWorkspaceLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!activeWorkspace) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background p-6">
        <Info className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          No Workspace Selected
        </h2>
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          Select a workspace from the sidebar or settings to view its ledger.
        </p>
      </div>
    )
  }

  const getActionBadgeVariant = (
    action: string
  ): "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" => {
    if (action.startsWith("CREATE")) return "default"
    if (
      action.startsWith("DELETE") ||
      action.startsWith("FORCE") ||
      action.startsWith("REMOVE")
    )
      return "destructive"
    if (action.startsWith("RESTORE")) return "secondary"
    if (action.includes("ROLE")) return "outline"
    return "default"
  }

  const formatBrowser = (userAgent: string | null) => {
    if (!userAgent) return "Unknown Browser"
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "Safari"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Edge")) return "Edge"
    return "Web Browser"
  }

  const memberOptions = members.map((m) => ({
    value: m.userId,
    label: `${m.user.name} (${m.user.email})`,
  }))

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Workspace Audit Logs
            </h1>
            <p className="text-sm text-muted-foreground">
              Immutable ledger of administrative and configuration events for{" "}
              <strong className="text-foreground">
                {activeWorkspace.name}
              </strong>
              .
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              size="sm"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="flex items-center gap-2 font-semibold shadow-sm"
            >
              <Download className="h-4 w-4" />
              {exportMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {(showFilters ||
          search ||
          selectedMembers.length > 0 ||
          selectedActions.length > 0 ||
          startDate ||
          endDate) && (
          <Card className="border border-border/80 bg-card shadow-sm transition-all duration-200">
            <CardHeader className="border-b border-border/50 bg-muted/20 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Filter className="h-4 w-4 text-primary" /> Filter Options
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="flex h-8 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Clear All Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Search Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Search Ledger
                  </label>
                  <div className="relative">
                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search descriptions, entities..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      className="h-10 border-input bg-background pl-9 focus-visible:ring-1"
                    />
                  </div>
                </div>

                {/* Date Picker Start */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "relative h-10 w-full rounded-lg border border-input bg-transparent pr-8 pl-3 text-left font-normal outline-hidden transition-colors hover:bg-muted/10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="pointer-events-none absolute top-2.5 right-3 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent
                      className="z-50 w-auto border border-border bg-card p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date)
                          setPage(1)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date Picker End */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    End Date
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "relative h-10 w-full rounded-lg border border-input bg-transparent pr-8 pl-3 text-left font-normal outline-hidden transition-colors hover:bg-muted/10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate ? (
                        format(endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="pointer-events-none absolute top-2.5 right-3 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent
                      className="z-50 w-auto border border-border bg-card p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date)
                          setPage(1)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Members Selection & Action Selection */}
              <div className="grid grid-cols-1 gap-6 border-t border-border/50 pt-4 md:grid-cols-2">
                {/* Members Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Filter by Members
                  </label>
                  <MultiSearchableSelect
                    value={selectedMembers}
                    onValueChange={(val) => {
                      setSelectedMembers(val)
                      setPage(1)
                    }}
                    options={memberOptions}
                    placeholder="Select workspace members..."
                    searchPlaceholder="Search members..."
                  />
                </div>

                {/* Actions Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Filter by Actions
                  </label>
                  <MultiSearchableSelect
                    value={selectedActions}
                    onValueChange={(val) => {
                      setSelectedActions(val)
                      setPage(1)
                    }}
                    options={AVAILABLE_ACTIONS}
                    placeholder="Select actions..."
                    searchPlaceholder="Search actions..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ledger Table Section */}
        <Card className="overflow-hidden border border-border/80 bg-card shadow-sm">
          <CardContent className="p-0">
            {isLogsLoading ? (
              <div className="w-full overflow-x-auto">
                <div className="flex min-w-[1100px] flex-col">
                  {/* Skeleton Header */}
                  <div className="grid grid-cols-[180px_200px_160px_180px_1fr_160px_80px] items-center border-b border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-muted-foreground">
                    <div>Timestamp</div>
                    <div>Actor</div>
                    <div>Action</div>
                    <div>Entity</div>
                    <div>Description</div>
                    <div>Origin IP</div>
                    <div className="text-center">Data</div>
                  </div>
                  {/* Skeleton Rows */}
                  <div className="flex flex-col divide-y divide-border/40">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="grid min-h-[64px] grid-cols-[180px_200px_160px_180px_1fr_160px_80px] items-center px-4 py-4"
                      >
                        {/* Timestamp */}
                        <div className="pr-2">
                          <Skeleton className="h-4 w-28" />
                        </div>
                        {/* Actor */}
                        <div className="flex items-center gap-2 pr-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-2 w-28" />
                          </div>
                        </div>
                        {/* Action */}
                        <div className="pr-2">
                          <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                        {/* Entity */}
                        <div className="space-y-1 pr-2">
                          <Skeleton className="h-2 w-12" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        {/* Description */}
                        <div className="pr-2">
                          <Skeleton className="h-4 w-full max-w-[200px]" />
                        </div>
                        {/* Origin IP */}
                        <div className="space-y-1 pr-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-2 w-20" />
                        </div>
                        {/* Data */}
                        <div className="flex justify-center">
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : !allRows.length ? (
              <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                <Info className="mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">
                  No Logs Found
                </h3>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Try adjusting search parameters or selection filters to
                  display ledger data.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="flex min-w-[1100px] flex-col">
                  {/* Header */}
                  <div className="grid grid-cols-[180px_200px_160px_180px_1fr_160px_80px] items-center border-b border-border bg-muted/30 px-4 py-3 text-sm font-semibold text-muted-foreground">
                    <div>Timestamp</div>
                    <div>Actor</div>
                    <div>Action</div>
                    <div>Entity</div>
                    <div>Description</div>
                    <div>Origin IP</div>
                    <div className="text-center">Data</div>
                  </div>

                  {/* Scrollable Container */}
                  <div
                    ref={parentRef}
                    className="relative max-h-[600px] w-full overflow-y-auto"
                  >
                    <div
                      style={{ height: `${totalSize}px`, position: "relative" }}
                      className="w-full"
                    >
                      {virtualRows.map((virtualRow) => {
                        const isLoaderRow =
                          virtualRow.index > allRows.length - 1
                        const log = allRows[virtualRow.index]

                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="grid min-h-[64px] grid-cols-[180px_200px_160px_180px_1fr_160px_80px] items-center border-b border-border/40 px-4 py-3 transition-colors hover:bg-muted/10"
                          >
                            {isLoaderRow ? (
                              isFetchingNextPage ? (
                                <>
                                  <div className="pr-2">
                                    <Skeleton className="h-4 w-28" />
                                  </div>
                                  <div className="flex items-center gap-2 pr-2">
                                    <Skeleton className="h-6 w-6 rounded-full" />
                                    <div className="flex-1 space-y-1">
                                      <Skeleton className="h-3 w-20" />
                                      <Skeleton className="h-2 w-28" />
                                    </div>
                                  </div>
                                  <div className="pr-2">
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                  </div>
                                  <div className="space-y-1 pr-2">
                                    <Skeleton className="h-2 w-12" />
                                    <Skeleton className="h-3 w-16" />
                                  </div>
                                  <div className="pr-2">
                                    <Skeleton className="h-4 w-full max-w-[200px]" />
                                  </div>
                                  <div className="space-y-1 pr-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-2 w-20" />
                                  </div>
                                  <div className="flex justify-center">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                  </div>
                                </>
                              ) : (
                                <div className="col-span-7 w-full py-4 text-center text-sm text-muted-foreground">
                                  No more logs to load
                                </div>
                              )
                            ) : (
                              <>
                                <div className="pr-2 font-mono text-xs text-muted-foreground">
                                  {format(
                                    new Date(log.createdAt),
                                    "yyyy-MM-dd hh:mm a"
                                  )}
                                </div>
                                <div className="pr-2">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <Avatar className="h-6 w-6 shrink-0 border border-border">
                                      <AvatarImage src={log.user.image || ""} />
                                      <AvatarFallback className="bg-muted text-2xs font-bold text-foreground">
                                        {log.user.name.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex min-w-0 flex-col">
                                      <span className="truncate text-sm font-medium text-foreground">
                                        {log.user.name}
                                      </span>
                                      <span className="truncate text-2xs text-muted-foreground">
                                        {log.user.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="pr-2">
                                  <Badge
                                    variant={getActionBadgeVariant(log.action)}
                                    className="px-2 py-0.5 text-2xs"
                                  >
                                    {log.action}
                                  </Badge>
                                </div>
                                <div className="pr-2">
                                  <div className="flex min-w-0 flex-col">
                                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                      {log.entityType}
                                    </span>
                                    <span className="max-w-[150px] truncate font-mono text-xs font-medium text-foreground">
                                      {log.entityName || log.entityId || "N/A"}
                                    </span>
                                  </div>
                                </div>
                                <div className="max-w-xs pr-2 text-sm font-medium break-words text-foreground">
                                  {log.description}
                                </div>
                                <div className="pr-2">
                                  <div className="flex flex-col space-y-0.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-3 w-3 shrink-0" />
                                      {log.ipAddress || "Unknown"}
                                    </span>
                                    <span className="flex items-center gap-1 text-2xs font-medium">
                                      <Laptop className="h-3 w-3 shrink-0" />
                                      {formatBrowser(log.userAgent)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-center">
                                  {log.metadata ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        setSelectedMetadata(log.metadata)
                                      }
                                      className="h-8 w-8 text-primary hover:bg-muted hover:text-primary-foreground"
                                    >
                                      <Database className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <span className="font-mono text-xs text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* JSON Metadata View Dialog */}
      <Dialog
        open={selectedMetadata !== null}
        onOpenChange={() => setSelectedMetadata(null)}
      >
        <DialogContent className="max-w-md border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <CheckSquare className="h-5 w-5 text-primary" /> Event Payload
              Metadata
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct state attributes captured when the action was logged.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-x-auto rounded-lg border border-border/50 bg-muted p-4">
            <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {JSON.stringify(selectedMetadata, null, 2)}
            </pre>
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setSelectedMetadata(null)}>
              Close View
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
