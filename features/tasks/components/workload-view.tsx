"use client"

import { useProject } from "@/app/(authenticated)/[workspaceSlug]/projects/[projectId]/layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjectTasks } from "@/features/tasks/hooks/use-tasks"
import { Task } from "@/types/models"
import { AlertDiamondIcon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from "date-fns"
import { useMemo, useState } from "react"

export function WorkloadView() {
  const { projectId, selectedProject } = useProject()
  const { data: tasks = [], isLoading } = useProjectTasks(projectId || "")

  const [currentDate] = useState(new Date())

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const workloadByMember = useMemo(() => {
    if (!selectedProject?.members) return []

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const weekInterval = { start: weekStart, end: weekEnd }

    const memberMap = new Map(
      selectedProject.members.map((m) => [
        m.user?.id || m.userId,
        {
          member: m,
          totalHours: 0,
          tasks: [] as Task[],
        },
      ])
    )

    tasks.forEach((task: Task) => {
      if (!task.assigneeId) return

      const assigneeData = memberMap.get(task.assigneeId)
      if (assigneeData) {
        const taskDate = task.dueDate ? parseISO(task.dueDate) : currentDate

        if (isWithinInterval(taskDate, weekInterval) || !task.dueDate) {
          const estimate = task.estimate || 0
          assigneeData.totalHours += estimate
          assigneeData.tasks.push(task)
        }
      }
    })

    return Array.from(memberMap.values())
  }, [selectedProject, tasks, currentDate])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Team Workload</h2>
            <Skeleton className="mt-2 h-4 w-75" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-6 w-30" />
                      <Skeleton className="mt-1 h-4 w-25" />
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <Skeleton className="h-5 w-22.5 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-2 flex-1 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>

                  <div className="mt-4">
                    <Skeleton className="mb-2 h-4 w-30" />
                    <div className="max-h-50 space-y-2 overflow-y-auto pr-2">
                      <Skeleton className="h-9 w-full rounded-md" />
                      <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Workload</h2>
          <p className="text-muted-foreground">
            Monitor capacity and task distribution for{" "}
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workloadByMember.map(({ member, totalHours, tasks }) => {
          const user = member.user
          const isOverAllocated = totalHours > 40
          const capacityPercentage = Math.min((totalHours / 40) * 100, 100)

          return (
            <Card
              key={member.id}
              className={
                isOverAllocated
                  ? "border-red-500/50 dark:border-red-900/50"
                  : ""
              }
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage
                        src={user?.image || ""}
                        alt={user?.name || "Unknown"}
                      />
                      <AvatarFallback>
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {user?.name || "Unknown User"}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          className="mr-1 h-4 w-4"
                        />
                        {totalHours}h / 40h capacity
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  {isOverAllocated ? (
                    <Badge
                      variant="destructive"
                      className="mt-2 flex w-max items-center"
                    >
                      <HugeiconsIcon
                        icon={AlertDiamondIcon}
                        className="mr-1 h-3 w-3"
                      />{" "}
                      Over Allocated
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-2">
                      On Track
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={capacityPercentage}
                      className={`h-2 flex-1 ${isOverAllocated ? "[&>div]:bg-red-500" : ""}`}
                    />
                    <span className="w-12 text-right text-sm font-medium">
                      {Math.round((totalHours / 40) * 100)}%
                    </span>
                  </div>

                  {tasks.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-semibold">
                        Assigned Tasks ({tasks.length})
                      </h4>
                      <div className="max-h-50 space-y-2 overflow-y-auto pr-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between rounded-md bg-muted/50 p-2 text-sm"
                          >
                            <span
                              className="flex-1 truncate pr-4 font-medium"
                              title={task.title}
                            >
                              {task.title}
                            </span>
                            <span className="text-xs font-semibold whitespace-nowrap text-muted-foreground">
                              {task.estimate || 0}h
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-muted-foreground italic">
                      No tasks assigned for this period.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
