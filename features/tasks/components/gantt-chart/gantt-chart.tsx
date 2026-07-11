"use client"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CalendarIcon,
  CheckmarkSquare03Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleArrowUp01Icon,
  EqualSignIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  addDays,
  differenceInDays,
  format,
  isWeekend,
  startOfDay,
} from "date-fns"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  FlatRow,
  TaskGroupType,
  TimelineTask,
} from "../../hooks/use-timeline-state"

const getPriorityStyle = (priorityVal: string) => {
  const normalized = (priorityVal || "").toLowerCase().replace("priority-", "")
  switch (normalized) {
    case "urgent":
    case "highest":
      return {
        icon: CircleArrowUp01Icon,
        className: "text-destructive",
      }
    case "high":
      return {
        icon: ArrowUp01Icon,
        className: "text-destructive",
      }
    case "medium":
      return {
        icon: EqualSignIcon,
        className: "text-warning",
      }
    case "low":
      return {
        icon: ArrowDown01Icon,
        className: "text-primary",
      }
    case "lowest":
      return {
        icon: ArrowDown01Icon,
        className: "text-muted-foreground",
      }
    default:
      return {
        icon: EqualSignIcon,
        className: "text-muted-foreground",
      }
  }
}

interface GanttChartProps {
  tasks: TimelineTask[]
  visibleRows: FlatRow[]
  activeLayout: TaskGroupType
  zoom: "Day" | "Week" | "Month" | "Quarter" | "HalfYear" | "Year"
  expandedNodes: Record<string, boolean>
  selectedTaskIds: string[]
  onToggleExpand: (id: string) => void
  onToggleSelectTask: (id: string) => void
  onUpdateTask: (taskId: string, start: Date, end: Date) => void
  onSelectTask: (taskId: string) => void
  todayScrollCount: number
}

export function GanttChart({
  tasks,
  visibleRows,
  zoom,
  selectedTaskIds,
  onToggleExpand,
  onToggleSelectTask,
  onUpdateTask,
  onSelectTask,
  todayScrollCount,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const colWidth = isMobile ? 180 : 500

  // Drag and Resize State
  const [dragAction, setDragAction] = useState<{
    taskId: string
    type: "move" | "resize-left" | "resize-right"
    initialStartX: number
    initialStartOffset: number
    initialDurationDays: number
  } | null>(null)

  const [dragVisualFeedback, setDragVisualFeedback] = useState<{
    taskId: string
    tempStartOffset: number
    tempWidth: number
  } | null>(null)

  // Calculate global date range for the timeline columns
  const timelineDates = useMemo(() => {
    if (tasks.length === 0) {
      const today = startOfDay(new Date())
      return {
        start: addDays(today, -15),
        end: addDays(today, 45),
      }
    }

    let minDate = new Date()
    let maxDate = new Date()
    let first = true

    tasks.forEach((t) => {
      const start = t.startDate
        ? new Date(t.startDate)
        : t.createdAt
          ? new Date(t.createdAt)
          : new Date()
      const end = t.dueDate ? new Date(t.dueDate) : addDays(start, 7)
      if (first) {
        minDate = start
        maxDate = end
        first = false
      } else {
        if (start < minDate) minDate = start
        if (end > maxDate) maxDate = end
      }
    })

    let start = new Date(minDate)
    let end = new Date(maxDate)

    if (zoom === "Year" || zoom === "HalfYear") {
      start = new Date(minDate.getFullYear() - 1, 0, 1)
      end = new Date(maxDate.getFullYear() + 2, 0, 1)
    } else if (zoom === "Quarter") {
      const minQuarter = Math.floor(minDate.getMonth() / 3)
      start = new Date(minDate.getFullYear(), (minQuarter - 1) * 3, 1)
      const maxQuarter = Math.floor(maxDate.getMonth() / 3)
      end = new Date(maxDate.getFullYear(), (maxQuarter + 2) * 3, 1)
    } else {
      start = startOfDay(addDays(minDate, -30))
      end = startOfDay(addDays(maxDate, 90))
    }

    return { start, end }
  }, [tasks, zoom])

  const totalDays = useMemo(() => {
    return differenceInDays(timelineDates.end, timelineDates.start) || 1
  }, [timelineDates])

  // Horizontal Scale config based on Zoom Level
  const pxPerDay = useMemo(() => {
    if (zoom === "Day") return 40
    if (zoom === "Week") return 16
    if (zoom === "Month") return 6
    if (zoom === "Quarter") return 2
    if (zoom === "HalfYear") return 1
    return 0.4 // Year view
  }, [zoom])

  const timelineWidth = totalDays * pxPerDay
  const rowHeight = 44

  const getDateOffset = useCallback(
    (date: Date) => {
      const diff = differenceInDays(date, timelineDates.start)
      return diff * pxPerDay
    },
    [timelineDates.start, pxPerDay]
  )

  // Calculate today's pixel offset
  const todayOffset = useMemo(() => {
    const today = startOfDay(new Date())
    if (today >= timelineDates.start && today <= timelineDates.end) {
      return getDateOffset(today)
    }
    return null
  }, [timelineDates, getDateOffset])

  // Instant scroll to today on initial mount / date offset loaded
  useEffect(() => {
    if (containerRef.current && todayOffset !== null) {
      const containerWidth = containerRef.current.clientWidth
      const targetScrollLeft = Math.max(
        0,
        colWidth + todayOffset - containerWidth / 2
      )
      containerRef.current.scrollLeft = targetScrollLeft
    }
  }, [todayOffset, colWidth])

  // Smooth scroll to today when button is clicked (todayScrollCount increments)
  useEffect(() => {
    if (containerRef.current && todayOffset !== null && todayScrollCount > 0) {
      const containerWidth = containerRef.current.clientWidth
      const targetScrollLeft = Math.max(
        0,
        colWidth + todayOffset - containerWidth / 2
      )
      containerRef.current.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      })
    }
  }, [todayScrollCount, todayOffset, colWidth])

  // Generate date header cells (Day / Week / Month)
  const timeScaleCells = useMemo(() => {
    const cells: {
      key: string
      label: string
      left: number
      width: number
      isWeekend: boolean
    }[] = []
    const currentDate = new Date(timelineDates.start)

    if (zoom === "Day") {
      for (let i = 0; i < totalDays; i++) {
        const cellDate = addDays(currentDate, i)
        cells.push({
          key: `day-${i}`,
          label: format(cellDate, "d"),
          left: i * pxPerDay,
          width: pxPerDay,
          isWeekend: isWeekend(cellDate),
        })
      }
    } else if (zoom === "Week") {
      // Group by weeks
      const totalWeeks = Math.ceil(totalDays / 7)
      for (let i = 0; i < totalWeeks; i++) {
        const weekDate = addDays(currentDate, i * 7)
        cells.push({
          key: `week-${i}`,
          label: format(weekDate, "MMM dd"),
          left: i * 7 * pxPerDay,
          width: 7 * pxPerDay,
          isWeekend: false,
        })
      }
    } else if (zoom === "Month") {
      // Group by months
      let tempDate = new Date(timelineDates.start)
      let index = 0
      while (tempDate < timelineDates.end) {
        const startOfNextMonth = new Date(
          tempDate.getFullYear(),
          tempDate.getMonth() + 1,
          1
        )
        const daysInMonth = differenceInDays(startOfNextMonth, tempDate)

        cells.push({
          key: `month-${index}`,
          label: format(tempDate, "MMM yy"),
          left: getDateOffset(tempDate),
          width: daysInMonth * pxPerDay,
          isWeekend: false,
        })

        tempDate = startOfNextMonth
        index++
      }
    } else if (zoom === "Quarter") {
      let tempDate = new Date(timelineDates.start)
      let index = 0
      while (tempDate < timelineDates.end) {
        const currentQuarter = Math.floor(tempDate.getMonth() / 3)
        const startOfQuarter = new Date(
          tempDate.getFullYear(),
          currentQuarter * 3,
          1
        )
        const startOfNextQuarter = new Date(
          tempDate.getFullYear(),
          (currentQuarter + 1) * 3,
          1
        )
        const daysInQuarter = differenceInDays(startOfNextQuarter, tempDate)

        cells.push({
          key: `quarter-${index}`,
          label: `Q${currentQuarter + 1} ${format(tempDate, "yy")}`,
          left: getDateOffset(tempDate),
          width: daysInQuarter * pxPerDay,
          isWeekend: false,
        })
        tempDate = startOfNextQuarter
        index++
      }
    } else if (zoom === "HalfYear") {
      let tempDate = new Date(timelineDates.start)
      let index = 0
      while (tempDate < timelineDates.end) {
        const currentHalf = Math.floor(tempDate.getMonth() / 6)
        const startOfHalf = new Date(tempDate.getFullYear(), currentHalf * 6, 1)
        const startOfNextHalf = new Date(
          tempDate.getFullYear(),
          (currentHalf + 1) * 6,
          1
        )
        const daysInHalf = differenceInDays(startOfNextHalf, tempDate)

        cells.push({
          key: `half-${index}`,
          label: `H${currentHalf + 1} ${format(tempDate, "yy")}`,
          left: getDateOffset(tempDate),
          width: daysInHalf * pxPerDay,
          isWeekend: false,
        })
        tempDate = startOfNextHalf
        index++
      }
    } else if (zoom === "Year") {
      let tempDate = new Date(timelineDates.start)
      let index = 0
      while (tempDate < timelineDates.end) {
        const startOfNextYearVal = new Date(tempDate.getFullYear() + 1, 0, 1)
        const daysInYear = differenceInDays(startOfNextYearVal, tempDate)

        cells.push({
          key: `year-${index}`,
          label: format(tempDate, "yyyy"),
          left: getDateOffset(tempDate),
          width: daysInYear * pxPerDay,
          isWeekend: false,
        })
        tempDate = startOfNextYearVal
        index++
      }
    }

    return cells
  }, [zoom, timelineDates, totalDays, pxPerDay, getDateOffset])

  // Grid line columns for timeline background
  const gridLines = useMemo(() => {
    const lines: { left: number; width: number; isWeekend: boolean }[] = []
    const currentDate = new Date(timelineDates.start)

    if (zoom === "Day") {
      for (let i = 0; i < totalDays; i++) {
        const lineDate = addDays(currentDate, i)
        lines.push({
          left: i * pxPerDay,
          width: pxPerDay,
          isWeekend: isWeekend(lineDate),
        })
      }
    } else if (zoom === "Week") {
      const totalWeeks = Math.ceil(totalDays / 7)
      for (let i = 0; i < totalWeeks; i++) {
        lines.push({
          left: i * 7 * pxPerDay,
          width: 7 * pxPerDay,
          isWeekend: false,
        })
      }
    } else if (zoom === "Month") {
      let tempDate = new Date(timelineDates.start)
      while (tempDate < timelineDates.end) {
        const startOfNextMonth = new Date(
          tempDate.getFullYear(),
          tempDate.getMonth() + 1,
          1
        )
        const daysInMonth = differenceInDays(startOfNextMonth, tempDate)

        lines.push({
          left: getDateOffset(tempDate),
          width: daysInMonth * pxPerDay,
          isWeekend: false,
        })
        tempDate = startOfNextMonth
      }
    } else if (zoom === "Quarter") {
      let tempDate = new Date(timelineDates.start)
      while (tempDate < timelineDates.end) {
        const currentQuarter = Math.floor(tempDate.getMonth() / 3)
        const startOfNextQuarter = new Date(
          tempDate.getFullYear(),
          (currentQuarter + 1) * 3,
          1
        )
        const daysInQuarter = differenceInDays(startOfNextQuarter, tempDate)

        lines.push({
          left: getDateOffset(tempDate),
          width: daysInQuarter * pxPerDay,
          isWeekend: false,
        })
        tempDate = startOfNextQuarter
      }
    } else if (zoom === "HalfYear") {
      let tempDate = new Date(timelineDates.start)
      while (tempDate < timelineDates.end) {
        const currentHalf = Math.floor(tempDate.getMonth() / 6)
        const startOfNextHalf = new Date(
          tempDate.getFullYear(),
          (currentHalf + 1) * 6,
          1
        )
        const daysInHalf = differenceInDays(startOfNextHalf, tempDate)

        lines.push({
          left: getDateOffset(tempDate),
          width: daysInHalf * pxPerDay,
          isWeekend: false,
        })
        tempDate = startOfNextHalf
      }
    } else if (zoom === "Year") {
      let tempDate = new Date(timelineDates.start)
      while (tempDate < timelineDates.end) {
        const startOfNextYearVal = new Date(tempDate.getFullYear() + 1, 0, 1)
        const daysInYear = differenceInDays(startOfNextYearVal, tempDate)

        lines.push({
          left: getDateOffset(tempDate),
          width: daysInYear * pxPerDay,
          isWeekend: false,
        })
        tempDate = startOfNextYearVal
      }
    }

    return lines
  }, [zoom, timelineDates, totalDays, pxPerDay, getDateOffset])

  // Setup TanStack Virtualizer for vertical rows
  const rowVirtualizer = useVirtualizer({
    count: visibleRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })

  // Drag and Resize event handlers
  const handleMouseDown = (
    e: React.MouseEvent,
    taskId: string,
    type: "move" | "resize-left" | "resize-right",
    currentStart: Date,
    currentEnd: Date
  ) => {
    e.stopPropagation()
    e.preventDefault()

    const initialStartOffset = getDateOffset(currentStart)
    const initialDurationDays = differenceInDays(currentEnd, currentStart) || 1

    setDragAction({
      taskId,
      type,
      initialStartX: e.clientX,
      initialStartOffset,
      initialDurationDays,
    })

    setDragVisualFeedback({
      taskId,
      tempStartOffset: initialStartOffset,
      tempWidth: initialDurationDays * pxPerDay,
    })
  }

  // Handle Drag Move and Drag Up
  useEffect(() => {
    if (!dragAction) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragAction.initialStartX
      const deltaDays = Math.round(deltaX / pxPerDay)

      if (dragAction.type === "move") {
        const newOffset = dragAction.initialStartOffset + deltaX
        setDragVisualFeedback({
          taskId: dragAction.taskId,
          tempStartOffset: newOffset,
          tempWidth: dragAction.initialDurationDays * pxPerDay,
        })
      } else if (dragAction.type === "resize-left") {
        const newOffset = dragAction.initialStartOffset + deltaX
        const newWidth = Math.max(
          pxPerDay,
          dragAction.initialDurationDays * pxPerDay - deltaX
        )
        setDragVisualFeedback({
          taskId: dragAction.taskId,
          tempStartOffset: newOffset,
          tempWidth: newWidth,
        })
      } else if (dragAction.type === "resize-right") {
        const newWidth = Math.max(
          pxPerDay,
          dragAction.initialDurationDays * pxPerDay + deltaX
        )
        setDragVisualFeedback({
          taskId: dragAction.taskId,
          tempStartOffset: dragAction.initialStartOffset,
          tempWidth: newWidth,
        })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const deltaX = e.clientX - dragAction.initialStartX
      const deltaDays = Math.round(deltaX / pxPerDay)

      // Calculate final new dates
      const timelineStart = timelineDates.start
      let finalStart = new Date(timelineStart)
      let finalEnd = new Date(timelineStart)

      const activeTask = tasks.find((t) => t.id === dragAction.taskId)
      if (activeTask) {
        const taskStart = activeTask.startDate
          ? new Date(activeTask.startDate)
          : activeTask.createdAt
            ? new Date(activeTask.createdAt)
            : new Date()
        const taskEnd = activeTask.dueDate
          ? new Date(activeTask.dueDate)
          : addDays(taskStart, 7)

        if (dragAction.type === "move") {
          finalStart = addDays(taskStart, deltaDays)
          finalEnd = addDays(taskEnd, deltaDays)
        } else if (dragAction.type === "resize-left") {
          finalStart = addDays(taskStart, deltaDays)
          finalEnd = taskEnd
          if (finalStart >= finalEnd) {
            finalStart = addDays(finalEnd, -1)
          }
        } else if (dragAction.type === "resize-right") {
          finalStart = taskStart
          finalEnd = addDays(taskEnd, deltaDays)
          if (finalEnd <= finalStart) {
            finalEnd = addDays(finalStart, 1)
          }
        }

        onUpdateTask(dragAction.taskId, finalStart, finalEnd)
      }

      setDragAction(null)
      setDragVisualFeedback(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragAction, pxPerDay, timelineDates, tasks, onUpdateTask])

  // Map ALL flat rows to visual coordinates for dependency arrows
  const visibleItemsMap = useMemo(() => {
    const map = new Map<string, { top: number; index: number }>()
    visibleRows.forEach((rowItem, index) => {
      if (!rowItem.isVirtualGroup) {
        map.set(rowItem.id, { top: index * rowHeight, index })
      }
    })
    return map
  }, [visibleRows, rowHeight])

  // SVG Dependency Paths
  const dependencyPaths = useMemo(() => {
    const paths: { key: string; d: string }[] = []

    tasks.forEach((targetTask) => {
      const targetCoords = visibleItemsMap.get(targetTask.id)
      if (!targetCoords) return // Target is off-screen

      const dependencies = targetTask.blockedByDependencies || []
      dependencies.forEach((dep) => {
        const sourceCoords = visibleItemsMap.get(dep.blockingTaskId)
        if (!sourceCoords) return // Source is off-screen

        const sourceTask = tasks.find((t) => t.id === dep.blockingTaskId)
        if (!sourceTask) return

        // Compute pixel offsets
        const sourceStart = sourceTask.startDate
          ? new Date(sourceTask.startDate)
          : sourceTask.createdAt
            ? new Date(sourceTask.createdAt)
            : new Date()
        const sourceEnd = sourceTask.dueDate
          ? new Date(sourceTask.dueDate)
          : addDays(sourceStart, 7)
        const targetStart = targetTask.startDate
          ? new Date(targetTask.startDate)
          : targetTask.createdAt
            ? new Date(targetTask.createdAt)
            : new Date()

        let x1 = getDateOffset(sourceEnd)
        const y1 = sourceCoords.top + rowHeight / 2
        let x2 = getDateOffset(targetStart)
        const y2 = targetCoords.top + rowHeight / 2

        // If drag feedback is active, use visual coordinate overrides
        if (dragVisualFeedback && dragVisualFeedback.taskId === sourceTask.id) {
          x1 = dragVisualFeedback.tempStartOffset + dragVisualFeedback.tempWidth
        }
        if (dragVisualFeedback && dragVisualFeedback.taskId === targetTask.id) {
          x2 = dragVisualFeedback.tempStartOffset
        }

        // Draw cubic bezier curve for smooth connector paths
        const controlOffset = Math.min(40, Math.abs(x2 - x1) * 0.5)
        const d = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`

        paths.push({
          key: `${dep.blockingTaskId}-${targetTask.id}`,
          d,
        })
      })
    })

    return paths
  }, [tasks, visibleItemsMap, getDateOffset, dragVisualFeedback])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent overflow-auto select-none"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div
        style={{
          width: `${colWidth + timelineWidth}px`, // Combined sticky grid + timeline width
          height: `${rowVirtualizer.getTotalSize() + 48}px`, // +48px for scale header
          position: "relative",
        }}
        className="flex flex-col"
      >
        {/* Pinned Scale Header */}
        <div className="sticky top-0 z-30 flex h-12 border-b border-border bg-muted">
          {/* Left Grid Pinned Column Headers */}
          <div
            style={{ width: `${colWidth}px` }}
            className="sticky left-0 z-40 flex shrink-0 items-center border-r border-border bg-muted px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            <div className="flex-1">Task Name</div>
            {!isMobile && (
              <>
                <div className="w-24 shrink-0 text-center">Start Date</div>
                <div className="w-24 shrink-0 text-center">Due Date</div>
              </>
            )}
          </div>
          {/* Right Date Scales */}
          <div className="relative h-full flex-1 overflow-hidden">
            {timeScaleCells.map((cell) => (
              <div
                key={cell.key}
                style={{
                  position: "absolute",
                  left: `${cell.left}px`,
                  width: `${cell.width}px`,
                }}
                className={cn(
                  "flex h-full items-center justify-center border-r border-border/30 text-[10px] font-bold text-muted-foreground select-none",
                  cell.isWeekend && "bg-muted/40 text-muted-foreground/50"
                )}
              >
                {cell.label}
              </div>
            ))}
          </div>
        </div>

        {/* virtual elements canvas */}
        <div className="relative flex-1">
          {/* Timeline Scrollable Lanes Area Overlay & Grid Background */}
          <div
            style={{
              position: "absolute",
              left: `${colWidth}px`,
              right: 0,
              top: 0,
              bottom: 0,
            }}
            className="pointer-events-none"
          >
            {/* Background Grid Lines */}
            {gridLines.map((line, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${line.left}px`,
                  width: `${line.width}px`,
                  top: 0,
                  bottom: 0,
                }}
                className={cn(
                  "border-r border-border/20",
                  line.isWeekend && "bg-muted/10"
                )}
              />
            ))}

            {/* Today Indicator Line */}
            {todayOffset !== null && (
              <div
                style={{
                  position: "absolute",
                  left: `${todayOffset}px`,
                  top: 0,
                  bottom: 0,
                  width: "1.5px",
                }}
                className="z-20 bg-primary"
              >
                <div className="absolute top-1 -left-5 rounded bg-primary px-1 text-[8px] font-extrabold text-primary-foreground shadow-xs select-none">
                  Today
                </div>
              </div>
            )}

            {/* SVG Dependency Canvas Overlay */}
            <svg
              className="pointer-events-none absolute inset-y-0 z-10"
              style={{ left: 0, width: "100%", height: "100%" }}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 0 2 L 8 5 L 0 8 z"
                    fill="hsl(var(--muted-foreground))"
                    className="opacity-40"
                  />
                </marker>
              </defs>
              {dependencyPaths.map((path) => (
                <path
                  key={path.key}
                  d={path.d}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  className="opacity-50"
                  markerEnd="url(#arrow)"
                />
              ))}
            </svg>
          </div>

          {/* Render Virtualized Rows */}
          {rowVirtualizer.getVirtualItems().map((vRow) => {
            const rowItem = visibleRows[vRow.index]
            if (!rowItem) return null

            const isHovered = hoveredRowId === rowItem.id
            const isSelected =
              !rowItem.isVirtualGroup && selectedTaskIds.includes(rowItem.id)

            return (
              <div
                key={vRow.key}
                data-index={vRow.index}
                ref={rowVirtualizer.measureElement}
                onMouseEnter={() => setHoveredRowId(rowItem.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                style={{
                  position: "absolute",
                  top: `${vRow.start}px`,
                  left: 0,
                  width: "100%",
                  height: `${rowHeight}px`,
                }}
                className={cn(
                  "group flex items-center border-b border-border/30 transition-colors",
                  isHovered && "bg-accent/40",
                  isSelected && "bg-primary/5"
                )}
              >
                {/* ──────────────────────────────────────────────────────── */}
                {/* Sticky Left Data Grid Columns */}
                {/* ──────────────────────────────────────────────────────── */}
                <div
                  style={{ width: `${colWidth}px` }}
                  className={cn(
                    "sticky left-0 z-20 flex h-full shrink-0 items-center border-r border-border bg-card px-4 group-hover:bg-accent/50",
                    rowItem.isVirtualGroup &&
                      "bg-muted/40 group-hover:bg-muted/60"
                  )}
                >
                  {/* Indentation offset based on nesting depth */}
                  <div
                    style={{ width: `${rowItem.depth * 16}px` }}
                    className="shrink-0"
                  />

                  {/* Expand/Collapse Chevron */}
                  <div className="mr-1 flex h-6 w-6 items-center justify-center">
                    {rowItem.hasChildren ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleExpand(rowItem.id)
                        }}
                        className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <HugeiconsIcon
                          icon={
                            rowItem.isExpanded
                              ? ChevronDownIcon
                              : ChevronRightIcon
                          }
                          className="h-4 w-4"
                          strokeWidth={2.5}
                        />
                      </button>
                    ) : null}
                  </div>

                  {/* Node icon based on type */}
                  <div className="mr-2 shrink-0 text-muted-foreground">
                    {rowItem.isVirtualGroup ? (
                      rowItem.groupType === "priority" ? (
                        (() => {
                          const style = getPriorityStyle(
                            rowItem.groupValue || ""
                          )
                          return (
                            <HugeiconsIcon
                              icon={style.icon}
                              className={cn("h-5 w-5", style.className)}
                              strokeWidth={2}
                            />
                          )
                        })()
                      ) : (
                        <HugeiconsIcon
                          icon={
                            rowItem.groupType === "assignee"
                              ? UserIcon
                              : rowItem.groupType === "sprint"
                                ? CalendarIcon
                                : CheckmarkSquare03Icon
                          }
                          className="h-4 w-4 text-primary/80"
                        />
                      )
                    ) : (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectTask(rowItem.id)}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-border text-primary focus:ring-primary"
                      />
                    )}
                  </div>

                  {/* Task Name / Title */}
                  <div
                    onClick={() =>
                      !rowItem.isVirtualGroup && onSelectTask(rowItem.id)
                    }
                    className={cn(
                      "flex flex-1 cursor-pointer items-center gap-1.5 truncate font-medium text-foreground hover:underline",
                      rowItem.isVirtualGroup &&
                        "cursor-default font-bold text-foreground/80 hover:no-underline"
                    )}
                  >
                    {!rowItem.isVirtualGroup &&
                      rowItem.task?.priority &&
                      (() => {
                        const style = getPriorityStyle(rowItem.task.priority)
                        return (
                          <HugeiconsIcon
                            icon={style.icon}
                            className={cn(style.className, "shrink-0")}
                          />
                        )
                      })()}
                    <span>{rowItem.title}</span>
                  </div>

                  {/* Custom columns (dates) */}
                  {!isMobile && !rowItem.isVirtualGroup && rowItem.task && (
                    <>
                      <div className="w-24 shrink-0 text-center font-mono text-sm text-muted-foreground select-none">
                        {rowItem.task.startDate
                          ? format(
                              new Date(rowItem.task.startDate),
                              "yyyy-MM-dd"
                            )
                          : rowItem.task.createdAt
                            ? format(
                                new Date(rowItem.task.createdAt),
                                "yyyy-MM-dd"
                              )
                            : "—"}
                      </div>
                      <div className="w-24 shrink-0 text-center font-mono text-sm text-muted-foreground select-none">
                        {rowItem.task.dueDate
                          ? format(new Date(rowItem.task.dueDate), "yyyy-MM-dd")
                          : "—"}
                      </div>
                    </>
                  )}
                </div>

                {/* ──────────────────────────────────────────────────────── */}
                {/* Scrollable Right Timeline lane */}
                {/* ──────────────────────────────────────────────────────── */}
                <div className="relative h-full flex-1">
                  {!rowItem.isVirtualGroup &&
                    rowItem.task &&
                    (() => {
                      const taskStart = rowItem.task.startDate
                        ? new Date(rowItem.task.startDate)
                        : rowItem.task.createdAt
                          ? new Date(rowItem.task.createdAt)
                          : new Date()
                      const taskEnd = rowItem.task.dueDate
                        ? new Date(rowItem.task.dueDate)
                        : addDays(taskStart, 7)

                      let left = getDateOffset(taskStart)
                      let width =
                        (differenceInDays(taskEnd, taskStart) || 1) * pxPerDay

                      // Override offset and width if currently dragging this task
                      const isDraggingThis =
                        dragVisualFeedback?.taskId === rowItem.id
                      if (isDraggingThis && dragVisualFeedback) {
                        left = dragVisualFeedback.tempStartOffset
                        width = dragVisualFeedback.tempWidth
                      }

                      return (
                        <HoverCard key={rowItem.id}>
                          <HoverCardTrigger
                            render={
                              <div
                                style={{
                                  position: "absolute",
                                  left: `${left}px`,
                                  width: `${width}px`,
                                  height: "26px",
                                  top: "9px",
                                }}
                                className={cn(
                                  "flex cursor-grab items-center rounded-md border border-primary bg-primary/20 px-2 text-[11px] font-bold text-primary-foreground shadow-2xs transition-shadow select-none group-hover:shadow-xs active:cursor-grabbing",
                                  isDraggingThis &&
                                    "cursor-grabbing border-dashed opacity-80 shadow-md"
                                )}
                                onMouseDown={(e) =>
                                  handleMouseDown(
                                    e,
                                    rowItem.id,
                                    "move",
                                    taskStart,
                                    taskEnd
                                  )
                                }
                                onClick={() => onSelectTask(rowItem.id)}
                              />
                            }
                          >
                            {/* Left Resize Handle */}
                            <div
                              className="absolute top-0 bottom-0 left-0 w-1.5 cursor-col-resize rounded-l hover:bg-primary/40"
                              onMouseDown={(e) =>
                                handleMouseDown(
                                  e,
                                  rowItem.id,
                                  "resize-left",
                                  taskStart,
                                  taskEnd
                                )
                              }
                            />

                            {/* Task Bar Label */}
                            <span className="pointer-events-none w-full truncate text-foreground/80">
                              {rowItem.title}
                            </span>

                            {/* Right Resize Handle */}
                            <div
                              className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize rounded-r hover:bg-primary/40"
                              onMouseDown={(e) =>
                                handleMouseDown(
                                  e,
                                  rowItem.id,
                                  "resize-right",
                                  taskStart,
                                  taskEnd
                                )
                              }
                            />
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="top"
                            className="z-50 min-w-55 space-y-2 rounded-xl border border-border bg-popover p-3 text-xs text-popover-foreground shadow-md"
                          >
                            <div className="border-b border-border/50 pb-1.5 text-sm font-bold">
                              {rowItem.title}
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                              <span className="font-semibold text-foreground/80">
                                Project:
                              </span>
                              <span className="truncate">
                                {rowItem.task?.projectTitle || "N/A"}
                              </span>

                              <span className="font-semibold text-foreground/80">
                                Start Date:
                              </span>
                              <span>{format(taskStart, "MMM dd, yyyy")}</span>

                              <span className="font-semibold text-foreground/80">
                                Due Date:
                              </span>
                              <span>{format(taskEnd, "MMM dd, yyyy")}</span>

                              <span className="font-semibold text-foreground/80">
                                Status:
                              </span>
                              <span>
                                {rowItem.task?.status?.name || "Unknown"}
                              </span>

                              <span className="font-semibold text-foreground/80">
                                Priority:
                              </span>
                              <span className="capitalize">
                                {rowItem.task?.priority || "Medium"}
                              </span>

                              <span className="font-semibold text-foreground/80">
                                Assignee:
                              </span>
                              <span className="truncate">
                                {rowItem.task?.assignee?.name || "Unassigned"}
                              </span>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )
                    })()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
