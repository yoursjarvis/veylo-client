"use client"

import React, { useMemo } from "react"
import { useQuery, useQueries } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { useWorkspaceContext } from "../providers/workspace-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Users, LayoutDashboard, Briefcase, TrendingUp } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { TooltipProps } from "recharts"
import { Task, Project } from "@/types/models"
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status"

export function Dashboard() {
  const { activeWorkspace } = useWorkspaceContext()
  const workspaceId = activeWorkspace?.id

  // 1. Fetch all projects in this workspace
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/projects`)
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
  const { allTasks, userWorkload, projectHealth, totalTasks, completedTasks } = useMemo(() => {
    let all: (Task & { projectTitle: string })[] = []
    const workload: Record<string, Record<string, number>> = {} // userId -> { projectId -> count }
    const health: Record<string, { total: number; done: number; title: string }> = {}
    const userNames: Record<string, string> = {}

    let tCount = 0
    let cCount = 0

    taskResults.forEach((r) => {
      const data = r.data
      if (data) {
        health[data.projectId] = { total: 0, done: 0, title: data.projectTitle }

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
            workload[uId][data.projectId] = (workload[uId][data.projectId] || 0) + 1
            if (t.assignee?.name) userNames[uId] = t.assignee.name
          }
        })
      }
    })

    return { allTasks: all, userWorkload: workload, projectHealth: health, totalTasks: tCount, completedTasks: cCount, userNames }
  }, [taskResults])

  // Prepare Chart Data
  const healthData = Object.values(projectHealth).map(p => ({
    name: p.title,
    done: p.done,
    incomplete: p.total - p.done,
  }))

  const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#84cc16"]

  if (isProjectsLoading || isTasksLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Workspace Overview</h2>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(userWorkload).length} Active</div>
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
                <BarChart data={healthData} layout="vertical" margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend />
                  <Bar dataKey="done" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="incomplete" name="Incomplete" stackId="a" fill="var(--muted)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No projects found.</div>
            )}
          </CardContent>
        </Card>

        {/* Resource Allocation Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resource Allocation (Active Tasks)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto h-[300px]">
             {Object.keys(userWorkload).length > 0 ? (
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                   <tr>
                     <th className="px-4 py-3 font-semibold rounded-tl-lg">Assignee</th>
                     {projects.map(p => (
                       <th key={p.id} className="px-4 py-3 font-semibold text-center whitespace-nowrap">{p.title}</th>
                     ))}
                     <th className="px-4 py-3 font-semibold text-center rounded-tr-lg">Total</th>
                   </tr>
                 </thead>
                 <tbody>
                   {Object.entries(userWorkload).map(([userId, pCounts]) => {
                     const total = Object.values(pCounts).reduce((a, b) => a + b, 0)
                     const name = allTasks.find(t => t.assigneeId === userId)?.assignee?.name || "Unknown"
                     return (
                       <tr key={userId} className="border-b border-border/50 hover:bg-muted/20">
                         <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{name}</td>
                         {projects.map(p => {
                           const count = pCounts[p.id] || 0
                           let intensityClass = "bg-transparent text-muted-foreground"
                           if (count > 0 && count <= 2) intensityClass = "bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold"
                           else if (count > 2 && count <= 5) intensityClass = "bg-blue-500/50 text-blue-800 dark:text-blue-200 font-bold"
                           else if (count > 5) intensityClass = "bg-red-500/80 text-white font-bold"
                           
                           return (
                             <td key={p.id} className="px-4 py-2 text-center">
                               <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-md ${intensityClass}`}>
                                 {count > 0 ? count : "-"}
                               </div>
                             </td>
                           )
                         })}
                         <td className="px-4 py-3 text-center font-bold text-foreground">{total}</td>
                       </tr>
                     )
                   })}
                 </tbody>
               </table>
             ) : (
               <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No tasks assigned to any team member.</div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
