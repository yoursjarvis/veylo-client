"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { axiosInstance } from "@/lib/axios"
import type { TaskUpdateRequest } from "@/types/api-types"
import { Project, Task } from "@/types/models"
import {
  Briefcase01Icon,
  ChartLineData01Icon,
  SignatureIcon,
  TaskDaily02Icon,
  TeamWorkIcon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { IconStack } from "@/components/reui/icon-stack"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { useWorkspaceContext } from "../providers/workspace-provider"

export function Dashboard() {
  const { activeWorkspace } = useWorkspaceContext()
  const workspaceId = activeWorkspace?.id

  // 1. Fetch all projects in this workspace
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const response = await axiosInstance.get(
        `/workspaces/${workspaceId}/projects`
      )
      return response.data.data as Project[]
    },
    enabled: !!workspaceId,
  })

  // 2. Fetch tasks for all projects in parallel
  const taskResults = useQueries({
    queries: projects.map((p: Project) => ({
      queryKey: ["tasks", p.id],
      queryFn: async () => {
        const response = await axiosInstance.get(`/projects/${p.id}/tasks`)
        return {
          projectId: p.id,
          projectTitle: p.title,
          tasks: response.data.data as Task[],
        }
      },
      enabled: !!p.id,
    })),
  })

  const isTasksLoading = taskResults.some((r) => r.isLoading)

  // 3. Aggregate Data
  const { allTasks, userWorkload, projectHealth, totalTasks, completedTasks } =
    useMemo(() => {
      const all: (Task & { projectTitle: string })[] = []
      const workload: Record<string, Record<string, number>> = {} // userId -> { projectId -> count }
      const health: Record<
        string,
        { total: number; done: number; title: string }
      > = {}
      const userNames: Record<string, string> = {}

      let tCount = 0
      let cCount = 0

      taskResults.forEach((r) => {
        const data = r.data
        if (data) {
          health[data.projectId] = {
            total: 0,
            done: 0,
            title: data.projectTitle,
          }

          data.tasks?.forEach((t: Task) => {
            if (t.deletedAt) return

            all.push({ ...t, projectTitle: data.projectTitle })
            tCount++

            health[data.projectId].total++

            if (t.status?.category === "done") {
              health[data.projectId].done++
              cCount++
            }

            if (t.assigneeId && t.status?.category !== "done") {
              const uId = t.assigneeId
              if (!workload[uId]) workload[uId] = {}
              workload[uId][data.projectId] =
                (workload[uId][data.projectId] || 0) + 1
              if (t.assignee?.name) userNames[uId] = t.assignee.name
            }
          })
        }
      })

      return {
        allTasks: all,
        userWorkload: workload,
        projectHealth: health,
        totalTasks: tCount,
        completedTasks: cCount,
        userNames,
      }
    }, [taskResults])

  // Prepare Chart Data
  const healthData = Object.values(projectHealth).map((p) => ({
    name: p.title,
    done: p.done,
    incomplete: p.total - p.done,
  }))

  const queryClient = useQueryClient()
  const approveMutation = useMutation({
    mutationFn: async ({
      taskId,
      statusId,
      customFields,
    }: {
      taskId: string
      statusId?: string
      customFields?: Record<string, unknown>
    }) => {
      const payload: TaskUpdateRequest = {}
      if (statusId) payload.statusId = statusId
      if (customFields) payload.customFields = customFields
      await axiosInstance.patch(`/tasks/${taskId}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast.success("Task status updated successfully")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err.response?.data?.message || "Failed to update approval status"
      )
    },
  })

  const pendingApprovals = useMemo(() => {
    return allTasks.filter((t) => {
      const statusName = t.status?.name.toLowerCase() || ""
      const customFieldApproval =
        t.customFields && typeof t.customFields === "object"
          ? (t.customFields as Record<string, unknown>)["Approval Status"] ===
            "Pending"
          : false
      return statusName.includes("approval") || customFieldApproval
    })
  }, [allTasks])

  if (isProjectsLoading || isTasksLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card text-card-foreground shadow"
            >
              <div className="flex flex-row items-center justify-between p-6 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <div className="p-6 pt-0">
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 rounded-xl border bg-card p-6 text-card-foreground shadow">
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="col-span-3 rounded-xl border bg-card p-6 text-card-foreground shadow">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Workspace Overview
        </h2>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
            <HugeiconsIcon
              icon={Briefcase01Icon}
              className="h-6 w-6 text-primary"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <HugeiconsIcon
              icon={TaskDaily02Icon}
              className="h-6 w-6 text-info"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground">
              Tasks Completed
            </CardTitle>
            <HugeiconsIcon
              icon={ChartLineData01Icon}
              className="h-6 w-6 text-success"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0}
              % completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground">
              Team Members
            </CardTitle>
            <HugeiconsIcon
              icon={UserGroup03Icon}
              className="h-6 w-6 text-warning"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(userWorkload).length} Active
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Health Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Health & Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {healthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={healthData}
                  layout="vertical"
                  margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--border)"
                  />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                    }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="done"
                    name="Completed"
                    stackId="a"
                    fill="var(--color-chart-1)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="incomplete"
                    name="Incomplete"
                    stackId="a"
                    fill="var(--color-chart-2)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No projects found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resource Allocation Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Resource Allocation (Active Tasks)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-auto">
            {Object.keys(userWorkload).length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted/50 text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="rounded-tl-lg px-4 py-3 font-semibold">
                      Assignee
                    </th>
                    {projects.map((p) => (
                      <th
                        key={p.id}
                        className="px-4 py-3 text-center font-semibold whitespace-nowrap"
                      >
                        {p.title}
                      </th>
                    ))}
                    <th className="rounded-tr-lg px-4 py-3 text-center font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(userWorkload).map(([userId, pCounts]) => {
                    const total = Object.values(pCounts).reduce(
                      (a, b) => a + b,
                      0
                    )
                    const name =
                      allTasks.find((t) => t.assigneeId === userId)?.assignee
                        ?.name || "Unknown"
                    return (
                      <tr
                        key={userId}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                          {name}
                        </td>
                        {projects.map((p) => {
                          const count = pCounts[p.id] || 0
                          let intensityClass =
                            "bg-transparent text-muted-foreground"
                          if (count > 0 && count <= 2)
                            intensityClass = "bg-info/20 text-info font-bold"
                          else if (count > 2 && count <= 5)
                            intensityClass = "bg-info/50 text-info font-bold"
                          else if (count > 5)
                            intensityClass =
                              "bg-destructive/80 text-destructive-foreground font-bold"

                          return (
                            <td key={p.id} className="px-4 py-2 text-center">
                              <div
                                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md ${intensityClass}`}
                              >
                                {count > 0 ? count : "-"}
                              </div>
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-center font-bold text-foreground">
                          {total}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <IconStack
                        aria-hidden="true"
                        className="h-24 w-22 text-primary"
                      >
                        <HugeiconsIcon
                          icon={TeamWorkIcon}
                          className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                        />
                      </IconStack>
                    </EmptyMedia>
                    <EmptyTitle>
                      No tasks assigned to any team member!
                    </EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Widget */}
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Approval Queue</CardTitle>
            <p className="text-xs text-muted-foreground">
              Approve or reject tasks requesting stakeholder review.
            </p>
          </div>
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">
            {pendingApprovals.length} pending
          </span>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length > 0 ? (
            <div className="divide-y divide-border/40">
              {pendingApprovals.map((task) => {
                const invoiceAmount =
                  task.customFields && typeof task.customFields === "object"
                    ? (task.customFields as Record<string, unknown>)[
                        "Invoice Amount"
                      ]
                    : null
                return (
                  <div
                    key={task.id}
                    className="flex flex-col justify-between gap-4 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {task.title}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-2xs font-bold text-muted-foreground uppercase">
                          {task.projectTitle}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Requested by{" "}
                        <span className="font-medium text-foreground">
                          {task.creator?.name || "Unknown"}
                        </span>
                        {invoiceAmount ? ` • Amount: $${invoiceAmount}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          const updatedFields =
                            task.customFields &&
                            typeof task.customFields === "object"
                              ? {
                                  ...(task.customFields as Record<
                                    string,
                                    unknown
                                  >),
                                  "Approval Status": "Rejected",
                                }
                              : { "Approval Status": "Rejected" }
                          approveMutation.mutate({
                            taskId: task.id,
                            customFields: updatedFields,
                          })
                        }}
                        disabled={approveMutation.isPending}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs font-semibold"
                        onClick={() => {
                          const updatedFields =
                            task.customFields &&
                            typeof task.customFields === "object"
                              ? {
                                  ...(task.customFields as Record<
                                    string,
                                    unknown
                                  >),
                                  "Approval Status": "Approved",
                                }
                              : { "Approval Status": "Approved" }
                          approveMutation.mutate({
                            taskId: task.id,
                            customFields: updatedFields,
                          })
                        }}
                        disabled={approveMutation.isPending}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground italic">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <IconStack
                      aria-hidden="true"
                      className="h-24 w-22 text-primary"
                    >
                      <HugeiconsIcon
                        icon={SignatureIcon}
                        className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                      />
                    </IconStack>
                  </EmptyMedia>
                  <EmptyTitle>All caught up! No pending approvals.</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
