import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CircleArrowUp01Icon,
  EqualSignIcon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons"

export type PriorityType =
  "lowest" | "low" | "medium" | "high" | "highest" | "urgent"

export interface PriorityInfo {
  value: PriorityType
  label: string
  color: string // Tailwind text color class
  bgColor: string // Tailwind background color class
  borderColor: string // Tailwind border color class
  icon: any
}

export const priorities: Record<PriorityType, PriorityInfo> = {
  lowest: {
    value: "lowest",
    label: "Lowest",
    color: "text-slate-500 dark:text-slate-400",
    bgColor: "bg-slate-500/10 dark:bg-slate-400/10",
    borderColor: "border-slate-500/20",
    icon: ArrowDown01Icon,
  },
  low: {
    value: "low",
    label: "Low",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-400/10",
    borderColor: "border-emerald-500/20",
    icon: ArrowDown01Icon,
  },
  medium: {
    value: "medium",
    label: "Medium",
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-500/10 dark:bg-sky-400/10",
    borderColor: "border-sky-500/20",
    icon: EqualSignIcon,
  },
  high: {
    value: "high",
    label: "High",
    color: "text-amber-600 dark:text-amber-500",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/10",
    borderColor: "border-amber-500/20",
    icon: ArrowUp01Icon,
  },
  highest: {
    value: "highest",
    label: "Highest",
    color: "text-orange-600 dark:text-orange-500",
    bgColor: "bg-orange-500/10 dark:bg-orange-500/10",
    borderColor: "border-orange-500/20",
    icon: CircleArrowUp01Icon,
  },
  urgent: {
    value: "urgent",
    label: "Urgent",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10 dark:bg-rose-400/10",
    borderColor: "border-rose-500/20",
    icon: AlertCircleIcon,
  },
}

export const priorityList = Object.values(priorities)

export function getPriority(priority?: string): PriorityInfo {
  const norm = (priority || "medium").toLowerCase() as PriorityType
  return (
    priorities[norm] || {
      value: "medium",
      label: "Medium",
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-500/10 dark:bg-sky-400/10",
      borderColor: "border-sky-500/20",
      icon: EqualSignIcon,
    }
  )
}

export function renderPriorityIcon(
  priority: string,
  className = "h-3.5 w-3.5 shrink-0"
) {
  const info = getPriority(priority)
  const Icon = info.icon
  return <HugeiconsIcon icon={Icon} className={`${className} ${info.color}`} />
}
