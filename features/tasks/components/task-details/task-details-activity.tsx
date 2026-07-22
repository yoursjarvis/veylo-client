"use client"

import React from "react"
import { TaskActivity } from "@/types/models"
import { format } from "date-fns"

interface TaskDetailsActivityProps {
  activityLogs: TaskActivity[]
  formatActivityText: (activity: TaskActivity) => string
}

export function TaskDetailsActivity({
  activityLogs = [],
  formatActivityText,
}: TaskDetailsActivityProps) {
  return (
    <div className="relative space-y-6">
      <div className="absolute top-0 bottom-0 left-2 w-px bg-border/50" />
      <div className="space-y-6 pl-6">
        {activityLogs.length > 0 ? (
          activityLogs.map((activity) => (
            <div
              key={activity.id}
              className="relative flex flex-col gap-1 text-xs"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {activity.user?.name || "System"}
                  </span>
                  <span className="text-muted-foreground">
                    {formatActivityText(activity)}
                  </span>
                </div>
                <span className="text-2xs text-muted-foreground/60">
                  {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No activity recorded for this task.
          </div>
        )}
      </div>
    </div>
  )
}
