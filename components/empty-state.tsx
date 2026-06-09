"use client"

import type * as React from "react"
import { InboxIcon } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

export type EmptyStateVariant = "default" | "muted" | "bordered"

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  variant?: EmptyStateVariant
  className?: string
}) {
  return (
    <Empty
      className={cn(
        "min-h-48 rounded-md",
        variant === "muted" && "bg-muted/30",
        variant === "bordered" && "border bg-card",
        className
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {icon ?? <InboxIcon className="size-4" />}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action || secondaryAction ? (
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {action}
            {secondaryAction}
          </div>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
