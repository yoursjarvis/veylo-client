"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status"
import {
  AlertDiamondIcon,
  AnalysisTextLinkIcon,
  ChartBarBigIcon,
  CheckmarkCircle01Icon,
  Clock03Icon,
  TaskDaily01Icon,
  TeamWorkIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

interface TaskReportsProps {
  tasks: {
    deletedAt?: string | null
    assigneeId?: string | null
    sprintId?: string | null
    status?: { category: string; name: string } | null
    estimate?: number
    createdAt?: string
    updatedAt?: string
    dueDate?: string
    assignee?: { id: string; name: string } | null
  }[]
  sprints: {
    id: string
    status: string
    name: string
    startDate?: string | null
    endDate?: string | null
  }[]
  projectMembers: {
    user: { id: string; name: string }
  }[]
  projectTemplate: string
}

export function TaskReports({
  tasks,
  sprints,
  projectMembers,
  projectTemplate,
}: TaskReportsProps) {
  // Filter out deleted tasks
  const activeTasks = tasks.filter((t) => !t.deletedAt)

  // 1. Calculate General Metrics
  const totalTasks = activeTasks.length
  const completedTasks = activeTasks.filter(
    (t) => t.status?.category === "done"
  ).length
  const incompleteTasks = totalTasks - completedTasks
  const unassignedTasks = activeTasks.filter((t) => !t.assigneeId).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdueTasks = activeTasks.filter((t) => {
    if (t.status?.category === "done") return false
    if (!t.dueDate) return false
    const dDate = new Date(t.dueDate)
    return dDate < today
  }).length

  // 2. Data for Donut Chart (Total tasks by completion status)
  const donutData = [
    {
      name: "completed",
      value: completedTasks,
      fill: "var(--color-completed)",
    },
    {
      name: "incomplete",
      value: incompleteTasks,
      fill: "var(--color-incomplete)",
    },
  ].filter((item) => item.value > 0)

  const donutConfig = {
    completed: {
      label: "Completed",
      color: "var(--chart-1)",
    },
    incomplete: {
      label: "Incomplete",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  // 3. Data for Bar Chart 1 (Total incomplete tasks by status / section)
  const tasksByStatus: Record<string, number> = {}
  activeTasks.forEach((t) => {
    if (t.status?.category !== "done") {
      const statusName = t.status?.name || "Incomplete"
      tasksByStatus[statusName] = (tasksByStatus[statusName] || 0) + 1
    }
  })
  const barChartStatusData = Object.entries(tasksByStatus).map(
    ([name, count]) => ({
      name,
      count,
    })
  )

  const barChartStatusConfig = {
    count: {
      label: "Tasks",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  // 4. Data for Bar Chart 2 (Total upcoming tasks by assignee)
  const tasksByAssignee: Record<string, number> = {}
  activeTasks.forEach((t) => {
    if (t.status?.category !== "done") {
      const assigneeName = t.assignee?.name || "Unassigned"
      tasksByAssignee[assigneeName] = (tasksByAssignee[assigneeName] || 0) + 1
    }
  })
  const barChartAssigneeData = Object.entries(tasksByAssignee).map(
    ([name, count]) => ({
      name,
      count,
    })
  )

  const assigneeBarConfig = barChartAssigneeData.reduce((acc, entry, idx) => {
    acc[entry.name] = {
      label: entry.name,
      color: `var(--chart-${(idx % 5) + 1})`,
    }
    return acc
  }, {} as ChartConfig)

  const barChartAssigneeDataWithFill = barChartAssigneeData.map((entry) => ({
    ...entry,
    fill: `var(--color-${entry.name})`,
  }))

  // 5. Data for Cumulative Timeline Area Chart (Last 10 days growth)
  const last10Days = Array.from({ length: 10 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (9 - i))
    return d
  })
  const timelineData = last10Days.map((date) => {
    const formattedDate = format(date, "MM/dd")
    const totalUpToDay = activeTasks.filter(
      (t) => new Date(t.createdAt || "") <= date
    ).length
    const completedUpToDay = activeTasks.filter(
      (t) =>
        t.status?.category === "done" && new Date(t.createdAt || "") <= date
    ).length

    return {
      date: formattedDate,
      Total: totalUpToDay,
      Completed: completedUpToDay,
    }
  })

  const timelineConfig = {
    Total: {
      label: "Total Tasks",
      color: "var(--chart-2)",
    },
    Completed: {
      label: "Completed Tasks",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  // 6. Calculate Workload Data (Team Workload Distribution)
  const memberWorkloadMap: Record<string, { name: string; count: number }> = {}
  projectMembers.forEach((m) => {
    memberWorkloadMap[m.user.id] = { name: m.user.name, count: 0 }
  })

  let unassignedCount = 0
  activeTasks.forEach((t) => {
    if (t.assigneeId && memberWorkloadMap[t.assigneeId]) {
      memberWorkloadMap[t.assigneeId].count += 1
    } else {
      unassignedCount += 1
    }
  })

  const workloadData = Object.values(memberWorkloadMap).filter(
    (item) => item.count > 0
  )
  if (unassignedCount > 0) {
    workloadData.push({ name: "Unassigned", count: unassignedCount })
  }

  const teamConfig = workloadData.reduce((acc, member, idx) => {
    acc[member.name] = {
      label: member.name,
      color: `var(--chart-${(idx % 5) + 1})`,
    }
    return acc
  }, {} as ChartConfig)

  const teamPieData = workloadData.map((item) => ({
    ...item,
    fill: `var(--color-${item.name})`,
  }))

  // 7. Calculate Sprint Velocity Data (Scrum only)
  const completedSprints = sprints.filter((s) => s.status === "completed")
  const velocityData = completedSprints.map((sprint) => {
    const sprintTasks = activeTasks.filter((t) => t.sprintId === sprint.id)

    const completedPoints = sprintTasks
      .filter((t) => t.status?.category === "done")
      .reduce((acc, t) => acc + (t.estimate || 0), 0)

    const totalPlannedPoints = sprintTasks.reduce(
      (acc, t) => acc + (t.estimate || 0),
      0
    )

    return {
      name: sprint.name,
      totalPlanned: totalPlannedPoints,
      completed: completedPoints,
    }
  })

  const velocityConfig = {
    totalPlanned: {
      label: "Total Planned Points",
      color: "var(--chart-2)",
    },
    completed: {
      label: "Completed Points",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  // 8. Calculate Active Sprint Burndown Data
  const activeSprint = sprints.find((s) => s.status === "active")
  const burndownData: { date: string; remaining: number; ideal: number }[] = []
  if (activeSprint && activeSprint.startDate && activeSprint.endDate) {
    const sprintTasks = activeTasks.filter(
      (t) => t.sprintId === activeSprint.id
    )
    const totalSprintPoints = sprintTasks.reduce(
      (acc, t) => acc + (t.estimate || 1),
      0
    )

    const start = new Date(activeSprint.startDate)
    const end = new Date(activeSprint.endDate)
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    )

    let currentRemaining = totalSprintPoints
    for (let i = 0; i <= duration; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)

      const completedOnDay = sprintTasks
        .filter((t) => t.status?.category === "done" && t.updatedAt)
        .filter((t) => {
          const ud = new Date(t.updatedAt!)
          return (
            ud.getFullYear() === d.getFullYear() &&
            ud.getMonth() === d.getMonth() &&
            ud.getDate() === d.getDate()
          )
        })
        .reduce((acc, t) => acc + (t.estimate || 1), 0)

      if (d <= new Date()) {
        currentRemaining -= completedOnDay
        burndownData.push({
          date: format(d, "MMM d"),
          remaining: Math.max(0, currentRemaining),
          ideal: Math.max(
            0,
            totalSprintPoints - (totalSprintPoints / duration) * i
          ),
        })
      } else {
        burndownData.push({
          date: format(d, "MMM d"),
          remaining: 0,
          ideal: Math.max(
            0,
            totalSprintPoints - (totalSprintPoints / duration) * i
          ),
        })
      }
    }
  }

  const burndownConfig = {
    remaining: {
      label: "Actual Remaining",
      color: "var(--chart-1)",
    },
    ideal: {
      label: "Ideal Remaining",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-8 overflow-y-auto pr-2 pb-10">
      {/* 5 Stats Cards Row */}
      <div className="mt-px ml-px grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Project Tasks */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Total Tasks
              </span>
              <span className="text-3xl font-extrabold text-foreground">
                {totalTasks}
              </span>
            </div>
            <Status variant="default" className="rounded-xl p-2.5">
              <HugeiconsIcon icon={TaskDaily01Icon} className="h-5 w-5" />
            </Status>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Completed Tasks
              </span>
              <span className="text-3xl font-extrabold text-foreground">
                {completedTasks}
              </span>
            </div>
            <Status variant="success" className="rounded-xl p-2.5">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-5 w-5" />
            </Status>
          </CardContent>
        </Card>

        {/* Incomplete */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Incomplete Tasks
              </span>
              <span className="text-3xl font-extrabold text-foreground">
                {incompleteTasks}
              </span>
            </div>
            <Status variant="info" className="rounded-xl p-2.5">
              <HugeiconsIcon icon={Clock03Icon} className="h-5 w-5" />
            </Status>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Overdue Tasks
              </span>
              <span className="text-3xl font-extrabold text-foreground">
                {overdueTasks}
              </span>
            </div>
            <Status variant="destructive" className="rounded-xl p-2.5">
              <HugeiconsIcon icon={AlertDiamondIcon} className="h-5 w-5" />
            </Status>
          </CardContent>
        </Card>

        {/* Unassigned */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Unassigned Tasks
              </span>
              <span className="text-3xl font-extrabold text-foreground">
                {unassignedTasks}
              </span>
            </div>
            <Status variant="warning" className="rounded-xl p-2.5">
              <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5" />
            </Status>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid of Charts & Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="ml-px space-y-6">
          {/* Tasks by Completion Status (Donut Chart) */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 border-b p-4">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                className="h-4.5 w-4.5 text-muted-foreground"
              />
              <CardTitle className="text-xs font-bold tracking-wider uppercase">
                Tasks by Completion Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex h-72 flex-col items-center justify-center p-6">
              {donutData.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  No tasks found.
                </div>
              ) : (
                <div className="relative flex h-full w-full items-center justify-center">
                  <ChartContainer
                    config={donutConfig}
                    className="h-full w-full"
                  >
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <ChartLegend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{
                          fontSize: "10px",
                          color: "var(--muted-foreground)",
                        }}
                      />
                    </PieChart>
                  </ChartContainer>

                  {/* Absolute Center Total Count */}
                  <div className="pointer-events-none absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-foreground">
                      {totalTasks}
                    </span>
                    <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                      Tasks
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Completion Over Time (Area Chart) */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 border-b p-4">
              <HugeiconsIcon
                icon={AnalysisTextLinkIcon}
                className="h-4.5 w-4.5 text-muted-foreground"
              />
              <CardTitle className="text-xs font-bold tracking-wider uppercase">
                Task Completion Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {totalTasks === 0 ? (
                <div className="flex h-60 items-center justify-center text-xs text-muted-foreground italic">
                  No history details to report.
                </div>
              ) : (
                <ChartContainer config={timelineConfig} className="h-60 w-full">
                  <AreaChart
                    data={timelineData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorTotal"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-Total)"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-Total)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorCompleted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-Completed)"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-Completed)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend
                      wrapperStyle={{
                        fontSize: "10px",
                        color: "var(--muted-foreground)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Total"
                      stroke="var(--color-Total)"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Completed"
                      stroke="var(--color-Completed)"
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Team Workload Distribution (Pie Chart) */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 border-b p-4">
              <HugeiconsIcon
                icon={TeamWorkIcon}
                className="h-4.5 w-4.5 text-muted-foreground"
              />
              <CardTitle className="text-xs font-bold tracking-wider uppercase">
                Team Workload Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-75 flex-col items-center justify-center p-6">
              {workloadData.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No tasks assigned</EmptyTitle>
                    <EmptyDescription>
                      Assign tasks to team members to see workload breakdown.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ChartContainer config={teamConfig} className="h-62.5 w-full">
                  <PieChart>
                    <Pie
                      data={teamPieData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{
                        fontSize: "11px",
                        color: "var(--muted-foreground)",
                      }}
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Incomplete Tasks by Section (Bar Chart) */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 border-b p-4">
              <HugeiconsIcon
                icon={ChartBarBigIcon}
                className="h-4.5 w-4.5 text-muted-foreground"
              />
              <CardTitle className="text-xs font-bold tracking-wider uppercase">
                Total Incomplete Tasks by Section
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {barChartStatusData.length === 0 ? (
                <div className="flex h-60 items-center justify-center text-xs text-muted-foreground italic">
                  No incomplete tasks found.
                </div>
              ) : (
                <ChartContainer
                  config={barChartStatusConfig}
                  className="h-60 w-full"
                >
                  <BarChart
                    data={barChartStatusData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Sprint Velocity Chart (Scrum only) OR Stage Breakdown (Non-scrum) */}
          {projectTemplate === "scrum" ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 border-b p-4">
                  <HugeiconsIcon
                    icon={ChartBarBigIcon}
                    className="h-4.5 w-4.5 text-muted-foreground"
                  />
                  <CardTitle className="text-xs font-bold tracking-wider uppercase">
                    Sprint Velocity Chart
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-75 flex-col justify-center p-6">
                  {velocityData.length === 0 ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>No completed sprints</EmptyTitle>
                        <EmptyDescription>
                          Complete your first work cycle/sprint to unlock
                          velocity reporting metrics.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <ChartContainer
                      config={velocityConfig}
                      className="h-62.5 w-full"
                    >
                      <BarChart
                        data={velocityData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="name"
                          stroke="var(--muted-foreground)"
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          fontSize={10}
                          tickLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend
                          wrapperStyle={{
                            fontSize: "11px",
                            color: "var(--muted-foreground)",
                          }}
                        />
                        <Bar
                          dataKey="totalPlanned"
                          fill="var(--color-totalPlanned)"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="completed"
                          fill="var(--color-completed)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Sprint Burndown Chart (Scrum only) */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 border-b p-4">
                  <HugeiconsIcon
                    icon={AnalysisTextLinkIcon}
                    className="h-4.5 w-4.5 text-muted-foreground"
                  />
                  <CardTitle className="text-xs font-bold tracking-wider uppercase">
                    Active Sprint Burndown
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-75 flex-col justify-center p-6">
                  {!activeSprint ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>No active sprint</EmptyTitle>
                        <EmptyDescription>
                          Start a sprint to track burndown progress.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : burndownData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                      Insufficient data for burndown.
                    </div>
                  ) : (
                    <ChartContainer
                      config={burndownConfig}
                      className="h-62.5 w-full"
                    >
                      <AreaChart
                        data={burndownData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="date"
                          stroke="var(--muted-foreground)"
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          fontSize={10}
                          tickLine={false}
                        />
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--border)"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend
                          wrapperStyle={{
                            fontSize: "11px",
                            color: "var(--muted-foreground)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="ideal"
                          stroke="var(--color-ideal)"
                          strokeDasharray="5 5"
                          fill="transparent"
                          strokeWidth={2}
                        />
                        <Area
                          type="stepAfter"
                          dataKey="remaining"
                          stroke="var(--color-remaining)"
                          fillOpacity={0.2}
                          fill="var(--color-remaining)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex min-h-75 flex-col justify-center p-6">
              <h4 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Task Stage Breakdown
              </h4>
              <div className="space-y-4">
                {["backlog", "todo", "in_progress", "done"].map((cat) => {
                  const catTasks = activeTasks.filter(
                    (t) => t.status?.category === cat
                  )
                  const percentage =
                    activeTasks.length > 0
                      ? (catTasks.length / activeTasks.length) * 100
                      : 0

                  // Use Status components
                  const getStatusVariant = (category: string) => {
                    switch (category) {
                      case "done":
                        return "success"
                      case "in_progress":
                        return "info"
                      case "todo":
                        return "warning"
                      default:
                        return "default"
                    }
                  }

                  const getProgressColorClass = (category: string) => {
                    switch (category) {
                      case "done":
                        return "bg-chart-1"
                      case "in_progress":
                        return "bg-chart-2"
                      case "todo":
                        return "bg-chart-3"
                      default:
                        return "bg-muted-foreground"
                    }
                  }

                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Status variant={getStatusVariant(cat)}>
                          <StatusIndicator />
                          <StatusLabel className="capitalize">
                            {cat.replace("_", " ")}
                          </StatusLabel>
                        </Status>
                        <span className="font-mono text-muted-foreground">
                          {catTasks.length} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getProgressColorClass(cat)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Incomplete Tasks by Assignee (Bar Chart) */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 border-b p-4">
              <HugeiconsIcon
                icon={UserGroupIcon}
                className="h-4.5 w-4.5 text-muted-foreground"
              />
              <CardTitle className="text-xs font-bold tracking-wider uppercase">
                Total Incomplete Tasks by Assignee
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {barChartAssigneeData.length === 0 ? (
                <div className="flex h-60 items-center justify-center text-xs text-muted-foreground italic">
                  No active assignments.
                </div>
              ) : (
                <ChartContainer
                  config={assigneeBarConfig}
                  className="h-60 w-full"
                >
                  <BarChart
                    data={barChartAssigneeDataWithFill}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                      {barChartAssigneeDataWithFill.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
