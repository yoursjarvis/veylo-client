"use client"

import { useVirtualizer } from "@tanstack/react-virtual"
import { format } from "date-fns"
import { formatDateTime } from "@/lib/datetime-formatter"
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useDebounce } from "use-debounce"

import { Badge } from "@/components/reui/badge"
import {
  Filters,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters"
import { IconStack } from "@/components/reui/icon-stack"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useKpiAccessibleProjects,
  useKpiAllProjects,
  useKpiLeaderboard,
  useKpiTransactionsInfinite,
  useKpiUserStats,
} from "@/features/kpi/hooks"
import type { KpiLeaderboardEntry, KpiTransaction } from "@/features/kpi/types"
import * as TanStackTable from "@tanstack/react-table"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
} from "@tanstack/react-table"

import { usePermissions } from "@/hooks/use-permissions"
import { useWorkspaces } from "@/hooks/use-workspaces"
import { cn } from "@/lib/utils"
import {
  Award01Icon,
  Building04Icon,
  Calendar01Icon,
  DatabaseIcon,
  FilterIcon,
  Link01Icon,
  ReceiptTextIcon,
  Search01Icon,
  SecurityLockIcon,
  Time02Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useState } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"

const LEADERBOARD_ROW_HEIGHT = 72
const TRANSACTION_ROW_HEIGHT = 88

export default function KpiPage() {
  const { activeWorkspace } = useWorkspaces()
  const workspaceId = activeWorkspace?.id ?? ""

  const [activeTab, setActiveTab] = useState<"leaderboard" | "transactions">(
    "leaderboard"
  )

  // ---------------------------------------------------------------------------
  // nuqs — URL-driven filters (server-side)
  // ---------------------------------------------------------------------------
  const [userNameQuery, setUserNameQuery] = useQueryState(
    "search",
    parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true, shallow: false })
  )

  const [projectFilterIds, setProjectFilterIds] = useQueryState(
    "projects",
    parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({ clearOnDefault: true, shallow: false })
  )

  const [startDateStr, setStartDateStr] = useQueryState(
    "startDate",
    parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true, shallow: false })
  )

  const [endDateStr, setEndDateStr] = useQueryState(
    "endDate",
    parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true, shallow: false })
  )

  // Debounce search to avoid excessive API calls while typing
  const [debouncedSearch] = useDebounce(userNameQuery, 350)

  // ---------------------------------------------------------------------------
  // Data fetching — always fetch user stats first to determine role
  // ---------------------------------------------------------------------------
  const { hasPermission, isLoading: isPermissionsLoading } = usePermissions()
  const canViewAdminKpi = hasPermission("kpi:view-admin")
  const canViewMemberKpi = hasPermission("kpi:view-member")

  const [viewMode, setViewMode] = useState<"admin" | "member">("member")

  useEffect(() => {
    if (canViewAdminKpi && !canViewMemberKpi) {
      setViewMode("admin")
    } else if (canViewMemberKpi && !canViewAdminKpi) {
      setViewMode("member")
    } else if (canViewAdminKpi && canViewMemberKpi && !viewMode) {
      setViewMode("admin")
    }
  }, [canViewAdminKpi, canViewMemberKpi, viewMode])

  const { data: statsData, isLoading: isStatsLoading } =
    useKpiUserStats(workspaceId)

  const isAdminOrOwner = viewMode === "admin"

  const { data: accessibleProjects = [], isLoading: isProjectsLoading } =
    useKpiAccessibleProjects(workspaceId)

  // Only admins get all projects — conditionally fetched
  const { data: allProjects = [], isLoading: isAllProjectsLoading } =
    useKpiAllProjects(workspaceId, isAdminOrOwner)

  // Use appropriate project list based on role
  const projectList = isAdminOrOwner ? allProjects : accessibleProjects
  const isProjectListLoading = isAdminOrOwner
    ? isAllProjectsLoading
    : isProjectsLoading

  const leaderboardFilters = useMemo(
    () => ({
      projectIds: projectFilterIds,
      startDate: startDateStr || undefined,
      endDate: endDateStr || undefined,
    }),
    [projectFilterIds, startDateStr, endDateStr]
  )

  // For members, scope transactions to their own userId only
  const transactionFilters = useMemo(
    () => ({
      userId: isAdminOrOwner ? undefined : statsData?.userId,
      projectIds: projectFilterIds,
      startDate: startDateStr || undefined,
      endDate: endDateStr || undefined,
    }),
    [
      isAdminOrOwner,
      statsData?.userId,
      projectFilterIds,
      startDateStr,
      endDateStr,
    ]
  )

  const { data: leaderboardData, isLoading: isLeaderboardLoading } =
    useKpiLeaderboard(workspaceId, leaderboardFilters)

  const {
    data: transactionPages,
    isLoading: isTransactionsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useKpiTransactionsInfinite(workspaceId, transactionFilters)

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const filteredLeaderboard = useMemo(() => {
    const list = leaderboardData?.leaderboard ?? []
    if (!debouncedSearch) return list
    const query = debouncedSearch.toLowerCase()
    return list.filter((entry) => entry.user.name.toLowerCase().includes(query))
  }, [leaderboardData, debouncedSearch])

  const allTransactions = useMemo(
    () => transactionPages?.pages.flatMap((page) => page.transactions) ?? [],
    [transactionPages]
  )

  const chartData = useMemo(
    () =>
      statsData?.weeklyPoints.map((pts, idx) => ({
        week: `Wk ${idx + 1}`,
        points: pts,
      })) ?? [],
    [statsData]
  )

  // Org-wide aggregate stats for admin header
  const orgTotalPoints = useMemo(() => {
    return (leaderboardData?.leaderboard ?? []).reduce(
      (sum, e) => sum + e.totalPoints,
      0
    )
  }, [leaderboardData])

  const topPerformer = useMemo(() => {
    const list = leaderboardData?.leaderboard ?? []
    return list.length > 0 ? list[0] : null
  }, [leaderboardData])

  // ---------------------------------------------------------------------------
  // Filters component config
  // ---------------------------------------------------------------------------
  const filterFields = useMemo<FilterFieldConfig[]>(() => {
    if (isProjectListLoading) return []
    return [
      {
        key: "projects",
        label: "Projects",
        type: "multiselect",
        options: projectList.map((p) => ({
          value: p.id,
          label: p.title,
        })),
      },
      {
        key: "dateRange",
        label: "Date Range",
        type: "multiselect",
        options: [
          { value: "today", label: "Today" },
          { value: "last7", label: "Last 7 days" },
          { value: "last30", label: "Last 30 days" },
          { value: "last90", label: "Last 90 days" },
        ],
        customValueRenderer: () => {
          if (startDateStr && endDateStr) {
            return `${format(new Date(startDateStr), "MMM d")} – ${format(new Date(endDateStr), "MMM d, yyyy")}`
          }
          if (startDateStr)
            return `From ${format(new Date(startDateStr), "MMM d, yyyy")}`
          if (endDateStr)
            return `To ${format(new Date(endDateStr), "MMM d, yyyy")}`
          return "Date Range"
        },
      },
    ]
  }, [projectList, isProjectListLoading, startDateStr, endDateStr])

  // Sync the Filters component state with nuqs
  const filtersValue = useMemo<Filter[]>(() => {
    const active: Filter[] = []
    if (projectFilterIds.length > 0) {
      active.push({
        id: "projects-filter",
        field: "projects",
        operator: "is_any_of",
        values: projectFilterIds,
      })
    }
    return active
  }, [projectFilterIds])

  const handleFiltersChange = useCallback(
    (newFilters: Filter[]) => {
      const projectFilter = newFilters.find((f) => f.field === "projects")
      setProjectFilterIds(
        projectFilter ? (projectFilter.values as string[]) : []
      )

      const dateRangeFilter = newFilters.find((f) => f.field === "dateRange")
      if (dateRangeFilter?.values[0]) {
        const preset = dateRangeFilter.values[0] as string
        const now = new Date()
        const start = new Date()
        switch (preset) {
          case "today":
            start.setHours(0, 0, 0, 0)
            break
          case "last7":
            start.setDate(now.getDate() - 7)
            break
          case "last30":
            start.setDate(now.getDate() - 30)
            break
          case "last90":
            start.setDate(now.getDate() - 90)
            break
        }
        setStartDateStr(format(start, "yyyy-MM-dd"))
        setEndDateStr(format(now, "yyyy-MM-dd"))
      } else {
        setStartDateStr("")
        setEndDateStr("")
      }
    },
    [setProjectFilterIds, setStartDateStr, setEndDateStr]
  )

  // ---------------------------------------------------------------------------
  // Virtual scroll — Leaderboard
  // ---------------------------------------------------------------------------
  const leaderboardParentRef = useRef<HTMLDivElement>(null)

  const { useReactTable: useTable } = { ...TanStackTable }

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<KpiLeaderboardEntry>()
    return [
      columnHelper.display({
        id: "rank",
        header: "Rank",
        size: 80,
        cell: (info) => {
          const rankNum = info.row.index + 1
          return (
            <div className="flex justify-center">
              <span
                className={cn(
                  "w-6 text-center text-sm font-bold",
                  rankNum === 1 && "text-lg text-amber-500",
                  rankNum === 2 && "text-base text-slate-400",
                  rankNum === 3 && "text-amber-700",
                  rankNum > 3 && "text-muted-foreground"
                )}
              >
                {rankNum === 1
                  ? "🥇"
                  : rankNum === 2
                    ? "🥈"
                    : rankNum === 3
                      ? "🥉"
                      : rankNum}
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor("user", {
        header: "Member",
        size: 300,
        cell: (info) => {
          const user = info.getValue()
          const isCurrentUser = user.id === statsData?.userId
          return (
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image ?? ""} />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  {user.name}
                  {isCurrentUser && (
                    <Badge
                      variant="secondary"
                      className="text-3xs h-4 scale-90 px-1"
                    >
                      You
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor("totalPoints", {
        header: "Points",
        size: 150,
        cell: (info) => (
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-foreground">
              {info.getValue()}
            </span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        ),
      }),
    ]
  }, [statsData?.userId])

  const leaderboardTable = useTable({
    data: filteredLeaderboard,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const leaderboardRows = leaderboardTable.getRowModel().rows

  const leaderboardVirtualizer = useVirtualizer({
    count: leaderboardRows.length,
    getScrollElement: () => leaderboardParentRef.current,
    estimateSize: () => LEADERBOARD_ROW_HEIGHT,
    overscan: 5,
  })

  // ---------------------------------------------------------------------------
  // Virtual scroll — Transactions with infinite loading
  // ---------------------------------------------------------------------------
  const transactionsParentRef = useRef<HTMLDivElement>(null)

  const txColumns = useMemo(() => {
    const columnHelper = createColumnHelper<KpiTransaction>()
    return [
      columnHelper.accessor("user", {
        header: "Transaction Details",
        size: 400,
        cell: (info) => {
          const tx = info.row.original
          return (
            <div className="flex items-start gap-3">
              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarImage src={tx.user.image ?? ""} />
                <AvatarFallback>
                  {tx.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {tx.user.name}
                </span>
                <p className="text-xs leading-normal text-muted-foreground">
                  {tx.reason}
                </p>
                {tx.task && (
                  <span className="flex text-xs font-medium text-primary/80">
                    <HugeiconsIcon icon={Link01Icon} size={18} />{" "}
                    {tx.task.taskKey} – {tx.task.title}
                  </span>
                )}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor("points", {
        header: "Points & Time",
        size: 150,
        cell: (info) => {
          const tx = info.row.original
          return (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-bold",
                  tx.points >= 0
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {tx.points >= 0 ? `+${tx.points}` : tx.points}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <HugeiconsIcon icon={Calendar01Icon} size={18} />
                {formatDateTime(tx.createdAt)}
              </span>
            </div>
          )
        },
      }),
    ]
  }, [])

  const transactionTable = useTable({
    data: allTransactions,
    columns: txColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const transactionRows = transactionTable.getRowModel().rows

  const transactionVirtualizer = useVirtualizer({
    count: hasNextPage ? transactionRows.length + 1 : transactionRows.length,
    getScrollElement: () => transactionsParentRef.current,
    estimateSize: () => TRANSACTION_ROW_HEIGHT,
    overscan: 5,
  })

  const virtualTransactionRows = transactionVirtualizer.getVirtualItems()

  useEffect(() => {
    const [lastItem] = [...virtualTransactionRows].reverse()
    if (!lastItem) return
    if (
      lastItem.index >= allTransactions.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allTransactions.length,
    isFetchingNextPage,
    virtualTransactionRows,
  ])

  // ---------------------------------------------------------------------------
  // Early returns
  // ---------------------------------------------------------------------------
  if (!activeWorkspace || isPermissionsLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!canViewAdminKpi && !canViewMemberKpi) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <HugeiconsIcon icon={SecurityLockIcon} size={32} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Access Denied
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          You do not have permission to view KPIs in this workspace.
        </p>
      </div>
    )
  }

  if (!activeWorkspace.kpiEnabled) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <HugeiconsIcon icon={Award01Icon} size={32} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          KPI Points Disabled
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Gamification &amp; KPI Points are currently disabled for this
          workspace. You can enable them in your workspace settings.
        </p>
      </div>
    )
  }

  const hasActiveFilters =
    !!userNameQuery || projectFilterIds.length > 0 || !!startDateStr

  // ---------------------------------------------------------------------------
  // Render — Admin/Owner view vs Member view
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-8xl mx-auto space-y-8 p-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header — role-aware title                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center">
        <div>
          {isStatsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : isAdminOrOwner ? (
            <>
              <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
                <HugeiconsIcon
                  icon={Building04Icon}
                  size={28}
                  className="text-primary"
                />
                Organization KPI Overview
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitor all team members&apos; performance, leaderboards, and
                point transactions across the workspace.
              </p>
            </>
          ) : (
            <>
              <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
                🏆 My KPI Performance
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your points, rank, and progress across your assigned
                projects.
              </p>
            </>
          )}
        </div>

        {/* Role badge / toggle */}
        {!isStatsLoading && (
          <div className="flex shrink-0 items-center gap-2">
            {canViewAdminKpi && canViewMemberKpi ? (
              <div className="flex items-center rounded-md border border-border bg-muted/30 p-1">
                <Button
                  variant={isAdminOrOwner ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setViewMode("admin")}
                >
                  <HugeiconsIcon
                    icon={Building04Icon}
                    size={12}
                    className="mr-1.5"
                  />
                  Admin View
                </Button>
                <Button
                  variant={!isAdminOrOwner ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setViewMode("member")}
                >
                  <HugeiconsIcon
                    icon={UserMultipleIcon}
                    size={12}
                    className="mr-1.5"
                  />
                  Member View
                </Button>
              </div>
            ) : (
              <Badge
                variant={isAdminOrOwner ? "default" : "secondary"}
                className="h-7 gap-1.5 px-3 text-xs font-semibold"
              >
                <HugeiconsIcon
                  icon={isAdminOrOwner ? Building04Icon : UserMultipleIcon}
                  size={12}
                />
                {isAdminOrOwner ? "Admin View" : "Member View"}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats Cards                                                         */}
      {/* ------------------------------------------------------------------ */}
      {isAdminOrOwner ? (
        /* Admin: org-wide summary cards */
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total Org Points */}
          <Card className="relative overflow-hidden border-primary/20 bg-linear-to-br from-primary/10 via-background to-background">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <HugeiconsIcon
                  icon={Award01Icon}
                  size={14}
                  className="text-primary"
                />
                Total Org Points
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isLeaderboardLoading ? (
                <div className="space-y-3 py-1">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-foreground">
                      {orgTotalPoints.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      points
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                    <HugeiconsIcon icon={UserMultipleIcon} size={12} />
                    Across {leaderboardData?.leaderboard.length ?? 0} members
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Members */}
          <Card className="relative overflow-hidden border-indigo-500/20 bg-linear-to-br from-indigo-500/10 via-background to-background hover:border-indigo-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <HugeiconsIcon
                  icon={UserMultipleIcon}
                  size={14}
                  className="text-indigo-500"
                />
                Active Members
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isLeaderboardLoading ? (
                <div className="space-y-3 py-1">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">
                      {leaderboardData?.leaderboard.length ?? 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      members
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                    With KPI activity in workspace
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Top Performer */}
          <Card className="relative overflow-hidden border-amber-500/20 bg-linear-to-br from-amber-500/10 via-background to-background hover:border-amber-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <HugeiconsIcon
                  icon={Award01Icon}
                  size={14}
                  className="text-amber-500"
                />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isLeaderboardLoading ? (
                <div className="space-y-3 py-1">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : topPerformer ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-amber-500/30">
                      <AvatarImage src={topPerformer.user.image ?? ""} />
                      <AvatarFallback>
                        {topPerformer.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {topPerformer.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {topPerformer.totalPoints.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    🥇 Leading the leaderboard
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Member: personal stats cards */
        <div className="grid gap-6 md:grid-cols-3">
          {/* Rank */}
          <Card className="relative overflow-hidden border-primary/20 bg-linear-to-br from-primary/10 via-background to-background">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <HugeiconsIcon
                  icon={Award01Icon}
                  size={14}
                  className="text-primary"
                />
                Your Standing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isStatsLoading ? (
                <div className="space-y-3 py-1">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-foreground">
                      #{statsData?.rank ?? "–"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      in workspace
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                    <HugeiconsIcon icon={Award01Icon} size={12} />
                    Out of {leaderboardData?.leaderboard.length ?? 0} members
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Points */}
          <Card className="relative overflow-hidden border-indigo-500/20 bg-linear-to-br from-indigo-500/10 via-background to-background hover:border-indigo-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <HugeiconsIcon
                  icon={Award01Icon}
                  size={14}
                  className="text-indigo-500"
                />
                Total KPI Score
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isStatsLoading ? (
                <div className="space-y-3 py-1">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-indigo-500">
                      {statsData?.totalPoints ?? 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      points earned
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                    Keep resolving tasks to maintain rank!
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Weekly Trend */}
          <Card className="relative overflow-hidden border-amber-500/20 bg-linear-to-br from-amber-500/10 via-background to-background hover:border-amber-500/40 md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <HugeiconsIcon icon={Time02Icon} size={14} />
                Recent Progress (Points)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex h-25 items-end overflow-hidden p-0">
              {isStatsLoading ? (
                <div className="w-full px-4 pb-2">
                  <Skeleton className="h-18.75 w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorPoints"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f59e0b"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f59e0b"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 text-xs font-semibold shadow-sm">
                              {payload[0].value} pts
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="points"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPoints)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Filters bar                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        {/* Search — admins search all users, members search leaderboard only */}
        {(isAdminOrOwner || activeTab === "leaderboard") && (
          <div className="relative min-w-50 flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={14}
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="kpi-search-user"
              placeholder={
                isAdminOrOwner
                  ? "Search by member name…"
                  : "Search leaderboard…"
              }
              value={userNameQuery}
              onChange={(e) => setUserNameQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        )}

        {/* Project + Date Range via Filters component */}
        <Filters
          filters={filtersValue}
          fields={filterFields}
          onChange={handleFiltersChange}
          size="sm"
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              aria-label="Add filter"
            >
              <HugeiconsIcon icon={FilterIcon} size={14} />
              Filters
              {(projectFilterIds.length > 0 || !!startDateStr) && (
                <Badge
                  variant="secondary"
                  className="h-4 rounded-full px-1.5 text-xs"
                >
                  {projectFilterIds.length + (startDateStr ? 1 : 0)}
                </Badge>
              )}
            </Button>
          }
        />

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setUserNameQuery("")
              setProjectFilterIds([])
              setStartDateStr("")
              setEndDateStr("")
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main Grid                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Tabs */}
          <div className="flex border-b border-border/40">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={cn(
                "border-b-2 px-4 pb-3 text-sm font-semibold transition-all",
                activeTab === "leaderboard"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {isAdminOrOwner ? "Team Leaderboard" : "Leaderboard"}
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={cn(
                "border-b-2 px-4 pb-3 text-sm font-semibold transition-all",
                activeTab === "transactions"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {isAdminOrOwner ? "All Transactions" : "My Transactions"}
            </button>
          </div>

          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" ? (
            <Card className="py-0">
              <CardContent className="p-0">
                {isLeaderboardLoading ? (
                  <div className="space-y-4 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-5 w-5 rounded" />
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-12" />
                      </div>
                    ))}
                  </div>
                ) : filteredLeaderboard.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No points awarded for the current filters.
                  </div>
                ) : (
                  // Virtualized leaderboard table
                  <div
                    ref={leaderboardParentRef}
                    className="max-h-130 overflow-auto"
                  >
                    <Table className="min-w-125 table-fixed">
                      <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                        {leaderboardTable
                          .getHeaderGroups()
                          .map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <TableHead
                                  key={header.id}
                                  style={{ width: header.getSize() }}
                                  className={cn(
                                    "h-10 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase",
                                    header.id === "rank" ? "text-center" : ""
                                  )}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </TableHead>
                              ))}
                            </TableRow>
                          ))}
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const virtualItems =
                            leaderboardVirtualizer.getVirtualItems()
                          const paddingTop =
                            virtualItems.length > 0
                              ? virtualItems[0]?.start || 0
                              : 0
                          const paddingBottom =
                            virtualItems.length > 0
                              ? leaderboardVirtualizer.getTotalSize() -
                                (virtualItems[virtualItems.length - 1]?.end ||
                                  0)
                              : 0

                          return (
                            <>
                              {paddingTop > 0 && (
                                <TableRow>
                                  <TableCell
                                    style={{ height: `${paddingTop}px` }}
                                    colSpan={columns.length}
                                    className="border-0 p-0"
                                  />
                                </TableRow>
                              )}
                              {virtualItems.map((virtualRow) => {
                                const row = leaderboardRows[virtualRow.index]
                                const isCurrentUser =
                                  row.original.user.id === statsData?.userId
                                return (
                                  <TableRow
                                    key={row.id}
                                    data-index={virtualRow.index}
                                    ref={leaderboardVirtualizer.measureElement}
                                    className={cn(
                                      isCurrentUser &&
                                        "bg-primary/5 hover:bg-primary/10"
                                    )}
                                    style={{
                                      height: `${LEADERBOARD_ROW_HEIGHT}px`,
                                    }}
                                  >
                                    {row.getVisibleCells().map((cell) => (
                                      <TableCell
                                        key={cell.id}
                                        className="px-4 py-2"
                                      >
                                        {flexRender(
                                          cell.column.columnDef.cell,
                                          cell.getContext()
                                        )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                )
                              })}
                              {paddingBottom > 0 && (
                                <TableRow>
                                  <TableCell
                                    style={{ height: `${paddingBottom}px` }}
                                    colSpan={columns.length}
                                    className="border-0 p-0"
                                  />
                                </TableRow>
                              )}
                            </>
                          )
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Transactions Tab — infinite scroll + virtual */
            <Card className="py-0">
              <CardContent className="p-0">
                {isTransactionsLoading ? (
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-100">
                            <Skeleton className="h-4 w-32" />
                          </TableHead>
                          <TableHead className="w-37.5">
                            <Skeleton className="ml-auto h-4 w-20" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-1">
                                  <Skeleton className="h-4 w-24" />
                                  <Skeleton className="h-3 w-48" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-end gap-1">
                                <Skeleton className="h-5 w-10 rounded" />
                                <Skeleton className="h-3 w-20" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : allTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center border-dashed p-12 text-center">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia>
                          <IconStack
                            aria-hidden="true"
                            className="h-24 w-22 text-primary"
                          >
                            <HugeiconsIcon
                              icon={ReceiptTextIcon}
                              className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                            />
                          </IconStack>
                        </EmptyMedia>
                        <EmptyTitle>No transactions recorded.</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </div>
                ) : (
                  <div
                    ref={transactionsParentRef}
                    className="max-h-140 overflow-auto"
                  >
                    <Table className="min-w-125 table-fixed">
                      <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                        {transactionTable
                          .getHeaderGroups()
                          .map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <TableHead
                                  key={header.id}
                                  style={{ width: header.getSize() }}
                                  className={cn(
                                    "h-10 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase",
                                    header.id === "points" ? "text-right" : ""
                                  )}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </TableHead>
                              ))}
                            </TableRow>
                          ))}
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const virtualItems =
                            transactionVirtualizer.getVirtualItems()
                          const paddingTop =
                            virtualItems.length > 0
                              ? virtualItems[0]?.start || 0
                              : 0
                          const paddingBottom =
                            virtualItems.length > 0
                              ? transactionVirtualizer.getTotalSize() -
                                (virtualItems[virtualItems.length - 1]?.end ||
                                  0)
                              : 0

                          return (
                            <>
                              {paddingTop > 0 && (
                                <TableRow>
                                  <TableCell
                                    style={{ height: `${paddingTop}px` }}
                                    colSpan={txColumns.length}
                                    className="border-0 p-0"
                                  />
                                </TableRow>
                              )}
                              {virtualItems.map((virtualRow) => {
                                const isLoaderRow =
                                  virtualRow.index >= transactionRows.length

                                if (isLoaderRow) {
                                  return (
                                    <TableRow
                                      key={virtualRow.key}
                                      data-index={virtualRow.index}
                                      ref={
                                        transactionVirtualizer.measureElement
                                      }
                                      style={{
                                        height: `${TRANSACTION_ROW_HEIGHT}px`,
                                      }}
                                    >
                                      <TableCell>
                                        <div className="flex items-start gap-3">
                                          <Skeleton className="h-8 w-8 rounded-full" />
                                          <div className="space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-48" />
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col items-end gap-1">
                                          <Skeleton className="h-5 w-10 rounded" />
                                          <Skeleton className="h-3 w-20" />
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                }

                                const row = transactionRows[virtualRow.index]
                                return (
                                  <TableRow
                                    key={row.id}
                                    data-index={virtualRow.index}
                                    ref={transactionVirtualizer.measureElement}
                                    style={{
                                      height: `${TRANSACTION_ROW_HEIGHT}px`,
                                    }}
                                  >
                                    {row.getVisibleCells().map((cell) => (
                                      <TableCell
                                        key={cell.id}
                                        className="px-4 py-2"
                                      >
                                        {flexRender(
                                          cell.column.columnDef.cell,
                                          cell.getContext()
                                        )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                )
                              })}
                              {paddingBottom > 0 && (
                                <TableRow>
                                  <TableCell
                                    style={{ height: `${paddingBottom}px` }}
                                    colSpan={txColumns.length}
                                    className="border-0 p-0"
                                  />
                                </TableRow>
                              )}
                            </>
                          )
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side Panel: Rules */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <HugeiconsIcon icon={DatabaseIcon} size={16} />
                Point System Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    Task Completion
                  </p>
                  <p className="mt-0.5 font-medium">
                    When a task is moved to &quot;Done&quot;, its estimated
                    points are awarded to the assignee.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    Reopening Deduction
                  </p>
                  <p className="mt-0.5">
                    Moving a completed task back to in-progress or todo reverses
                    the points.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    Reassignment Transfer
                  </p>
                  <p className="mt-0.5">
                    Changing the assignee of a completed task transfers all
                    awarded points to the new owner.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin-only: Quick insight card */}
          {isAdminOrOwner && !isLeaderboardLoading && (
            <Card className="">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <HugeiconsIcon icon={Award01Icon} size={20} strokeWidth={2} />
                  Quick Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">
                    Total Members
                  </span>
                  <span className="font-bold text-foreground">
                    {leaderboardData?.leaderboard.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">
                    Total Points
                  </span>
                  <span className="font-bold text-foreground">
                    {orgTotalPoints.toLocaleString()}
                  </span>
                </div>
                {topPerformer && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground">
                      Leader
                    </span>
                    <span className="font-bold text-foreground">
                      {topPerformer.user.name.split(" ")[0]}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">
                    Projects
                  </span>
                  <span className="font-bold text-foreground">
                    {allProjects.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
