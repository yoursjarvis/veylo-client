"use client"

import type * as React from "react"
import { AlertTriangleIcon, BarChart3Icon, RefreshCwIcon } from "lucide-react"

import { EmptyState } from "./empty-state"
import { NoticeAlert } from "./notice-alert"
import { ShimmerSkeleton, ShimmerSkeletonBox } from "./shimmer-skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ChartStateFrameState = "ready" | "loading" | "empty" | "error"

export function ChartStateFrame({
  state = "ready",
  title,
  description,
  action,
  minHeight = 320,
  className,
  children,
}: {
  state?: ChartStateFrameState
  title?: string
  description?: string
  action?: React.ReactNode
  minHeight?: number | string
  className?: string
  children: React.ReactNode
}) {
  const style = {
    minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
  }

  if (state === "ready") {
    return (
      <div className={cn("min-w-0", className)} style={style}>
        {children}
      </div>
    )
  }

  if (state === "loading") {
    return (
      <div
        className={cn(
          "grid min-w-0 content-center gap-4 rounded-md border bg-card p-4",
          className
        )}
        style={style}
      >
        <div className="flex items-center justify-between gap-4">
          <ShimmerSkeleton lines={2} className="max-w-52" />
          <ShimmerSkeletonBox className="h-8 w-20" />
        </div>
        <div className="grid h-40 grid-cols-8 items-end gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex h-full items-end"
              style={{ height: `${42 + ((index * 17) % 58)}%` }}
            >
              <ShimmerSkeletonBox className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (state === "empty") {
    return (
      <div
        className={cn("grid min-w-0 place-items-center", className)}
        style={style}
      >
        <EmptyState
          icon={<BarChart3Icon className="size-4" />}
          title={title ?? "No chart data"}
          description={
            description ??
            "There is no data available for this reporting period."
          }
          action={action}
          variant="bordered"
          className="w-full"
        />
      </div>
    )
  }

  return (
    <div className={cn("grid min-w-0 content-center", className)} style={style}>
      <NoticeAlert
        tone="destructive"
        title={title ?? "Unable to load chart"}
        description={
          description ??
          "The data source did not respond. Retry the request or check the connection."
        }
      />
      {action ? (
        <div className="mt-3 flex justify-end">{action}</div>
      ) : (
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm">
            <RefreshCwIcon className="size-3.5" />
            Retry
          </Button>
        </div>
      )}
      <AlertTriangleIcon className="sr-only" />
    </div>
  )
}
