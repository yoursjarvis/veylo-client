"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs"
import { format } from "date-fns"
import { useDebounce } from "use-debounce"

import {
  useKpiAccessibleProjects,
  useKpiLeaderboard,
  useKpiTransactionsInfinite,
  useKpiUserStats,
} from "@/features/kpi/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/reui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconStack } from "@/components/reui/icon-stack"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Filters,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters"
import { Button } from "@/components/ui/button"
import { useWorkspaces } from "@/hooks/use-workspaces"
import { cn } from "@/lib/utils"
import {
  Award01Icon,
  Calendar01Icon,
  DatabaseIcon,
  FilterIcon,
  ReceiptTextIcon,
  Search01Icon,
  Time02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"
import { useParams } from "next/navigation"
import { useState } from "react"

const LEADERBOARD_ROW_HEIGHT = 72
const TRANSACTION_ROW_HEIGHT = 88

export default function KpiPage() {
  const params = useParams()
  const workspaceSlug = params?.workspaceSlug as string
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
  // Data fetching
  // ---------------------------------------------------------------------------
  const { data: accessibleProjects = [], isLoading: isProjectsLoading } =
    useKpiAccessibleProjects(workspaceId)

  const leaderboardFilters = useMemo(
    () => ({
      projectIds: projectFilterIds,
      startDate: startDateStr || undefined,
      endDate: endDateStr || undefined,
    }),
    [projectFilterIds, startDateStr, endDateStr]
  )

  const transactionFilters = useMemo(
    () => ({
      userId: debouncedSearch
        ? undefined // searching by name happens on leaderboard side; transactions use userId
        : undefined,
      projectIds: projectFilterIds,
      startDate: startDateStr || undefined,
      endDate: endDateStr || undefined,
    }),
    [debouncedSearch, projectFilterIds, startDateStr, endDateStr]
  )

  const { data: leaderboardData, isLoading: isLeaderboardLoading } =
    useKpiLeaderboard(workspaceId, leaderboardFilters)

  const { data: statsData, isLoading: isStatsLoading } =
    useKpiUserStats(workspaceId)

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
    return list.filter((entry) =>
      entry.user.name.toLowerCase().includes(query)
    )
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

  // ---------------------------------------------------------------------------
  // Filters component config (projects + date range only — search is separate)
  // ---------------------------------------------------------------------------
  const filterFields = useMemo<FilterFieldConfig[]>(() => {
    if (isProjectsLoading) return []
    return [
      {
        key: "projects",
        label: "Projects",
        type: "multiselect",
        options: accessibleProjects.map((p) => ({
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
  }, [accessibleProjects, isProjectsLoading, startDateStr, endDateStr])

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

  const leaderboardVirtualizer = useVirtualizer({
    count: filteredLeaderboard.length,
    getScrollElement: () => leaderboardParentRef.current,
    estimateSize: () => LEADERBOARD_ROW_HEIGHT,
    overscan: 5,
  })

  // ---------------------------------------------------------------------------
  // Virtual scroll — Transactions with infinite loading
  // ---------------------------------------------------------------------------
  const transactionsParentRef = useRef<HTMLDivElement>(null)

  const transactionVirtualizer = useVirtualizer({
    count: hasNextPage ? allTransactions.length + 1 : allTransactions.length,
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
  if (!activeWorkspace) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner className="size-8" />
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

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
            🏆 Gamification &amp; KPIs
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor point tallies, earn stars, and view team productivity
            leaderboard.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Rank */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <HugeiconsIcon icon={Award01Icon} size={14} className="text-primary" />
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
        <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-background">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <HugeiconsIcon icon={Award01Icon} size={14} className="text-amber-500" />
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
                  <span className="text-5xl font-black text-amber-500">
                    {statsData?.totalPoints ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    points earned
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                  Keep resolving tasks to maintain rank!
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <HugeiconsIcon icon={Time02Icon} size={14} />
              Recent Progress (Points)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-[100px] items-end overflow-hidden p-0">
            {isStatsLoading ? (
              <div className="w-full px-4 pb-2">
                <Skeleton className="h-[75px] w-full" />
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
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
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

      {/* Filters — below stats cards */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        {/* Username Search */}
        <div className="relative min-w-[200px] flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="kpi-search-user"
            placeholder="Search by user name…"
            value={userNameQuery}
            onChange={(e) => setUserNameQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

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

      {/* Main Grid */}
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
              Leaderboard
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
              Transaction Log
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
                  // Virtualized leaderboard list
                  <div
                    ref={leaderboardParentRef}
                    className="max-h-[520px] overflow-auto"
                  >
                    <div
                      style={{
                        height: `${leaderboardVirtualizer.getTotalSize()}px`,
                        position: "relative",
                      }}
                    >
                      {leaderboardVirtualizer
                        .getVirtualItems()
                        .map((virtualRow) => {
                          const entry = filteredLeaderboard[virtualRow.index]
                          const isCurrentUser =
                            entry.user.id === statsData?.userId
                          const rankNum = virtualRow.index + 1

                          return (
                            <div
                              key={virtualRow.key}
                              data-index={virtualRow.index}
                              ref={leaderboardVirtualizer.measureElement}
                              className={cn(
                                "absolute left-0 top-0 w-full flex items-center justify-between border-b border-border/40 px-4 transition-all",
                                isCurrentUser && "bg-primary/5 font-semibold"
                              )}
                              style={{
                                transform: `translateY(${virtualRow.start}px)`,
                                height: `${LEADERBOARD_ROW_HEIGHT}px`,
                              }}
                            >
                              <div className="flex items-center gap-4">
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
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={entry.user.image ?? ""} />
                                  <AvatarFallback>
                                    {entry.user.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="flex items-center gap-1.5 text-sm text-foreground">
                                    {entry.user.name}
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
                                    {entry.user.email}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-base font-bold text-foreground">
                                  {entry.totalPoints}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  pts
                                </span>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Transactions Tab — infinite scroll + virtual */
            <Card className="py-0">
              <CardContent className="p-0">
                {isTransactionsLoading ? (
                  <div className="space-y-4 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-48" />
                            <Skeleton className="h-3 w-64" />
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Skeleton className="h-5 w-10 rounded" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
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
                    className="max-h-[560px] overflow-auto"
                  >
                    <div
                      style={{
                        height: `${transactionVirtualizer.getTotalSize()}px`,
                        position: "relative",
                      }}
                    >
                      {virtualTransactionRows.map((virtualRow) => {
                        const isLoaderRow =
                          virtualRow.index >= allTransactions.length
                        const tx = allTransactions[virtualRow.index]

                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={transactionVirtualizer.measureElement}
                            className="absolute left-0 top-0 w-full border-b border-border/40 px-4"
                            style={{
                              transform: `translateY(${virtualRow.start}px)`,
                              height: `${TRANSACTION_ROW_HEIGHT}px`,
                            }}
                          >
                            {isLoaderRow ? (
                              <div className="flex h-full items-center justify-center">
                                <Spinner className="size-5" />
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                                    <AvatarImage
                                      src={tx.user.image ?? ""}
                                    />
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
                                      <span className="text-xs font-medium text-primary/80">
                                        🔗 {tx.task.taskKey} –{" "}
                                        {tx.task.title}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                  <span
                                    className={cn(
                                      "rounded px-2 py-0.5 text-xs font-bold",
                                      tx.points >= 0
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-destructive/10 text-destructive"
                                    )}
                                  >
                                    {tx.points >= 0
                                      ? `+${tx.points}`
                                      : tx.points}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <HugeiconsIcon
                                      icon={Calendar01Icon}
                                      size={10}
                                    />
                                    {format(
                                      new Date(tx.createdAt),
                                      "MMM d, h:mm a"
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
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
            <CardContent className="space-y-4 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    Task Completion
                  </p>
                  <p className="mt-0.5">
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
        </div>
      </div>
    </div>
  )
}
