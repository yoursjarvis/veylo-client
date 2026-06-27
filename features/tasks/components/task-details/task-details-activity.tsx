"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ClockIcon } from "@hugeicons/core-free-icons"
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
    <div className="space-y-4 border-t border-border/60 pt-6">
      <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        <HugeiconsIcon icon={ClockIcon} size={14} className="text-muted-foreground/70" />{" "}
        Activity Feed
      </label>
      <div className="space-y-3 pl-1">
        {activityLogs.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-2.5 text-xs text-muted-foreground"
          >
            <HugeiconsIcon
              icon={ClockIcon}
              size={13}
              className="mt-0.5 flex-shrink-0 text-muted-foreground/60"
            />
            <div>
              <span className="font-semibold text-foreground">
                {activity.user?.name}{" "}
              </span>
              <span>{formatActivityText(activity)}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground/80">
                {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
