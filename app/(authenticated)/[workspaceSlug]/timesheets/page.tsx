"use client"
import React, { useState } from "react"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { AlertDiamondIcon, Clock01Icon, CheckmarkSquare02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function TimesheetsPage() {
  const { activeWorkspace, isLoading } = useWorkspaceContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data for weekly timesheet
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const dates = ["01", "02", "03", "04", "05", "06", "07"]
  
  const [timesheetData, setTimesheetData] = useState([
    {
      id: "task-1",
      project: "Marketing Website",
      task: "Design Homepage Hero",
      hours: ["2.5", "4", "0", "0", "0", "0", "0"],
    },
    {
      id: "task-2",
      project: "Payment Gateway",
      task: "Stripe API Integration",
      hours: ["5", "3.5", "8", "4", "2", "0", "0"],
    },
    {
      id: "task-3",
      project: "Internal Tools",
      task: "Timesheet UI Development",
      hours: ["0", "0", "0", "4", "6", "0", "0"],
    }
  ])

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!activeWorkspace) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-background p-6">
        <HugeiconsIcon
          icon={AlertDiamondIcon}
          className="mb-4 h-12 w-12 text-muted-foreground"
        />
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          No Workspace Selected
        </h2>
        <p className="mt-1.5 max-w-sm text-center text-sm text-muted-foreground">
          Please select or create a workspace to view timesheets.
        </p>
      </div>
    )
  }

  const handleHourChange = (taskIndex: number, dayIndex: number, value: string) => {
    const newData = [...timesheetData]
    newData[taskIndex].hours[dayIndex] = value
    setTimesheetData(newData)
  }

  const calculateDailyTotal = (dayIndex: number) => {
    return timesheetData.reduce((total, task) => {
      const val = parseFloat(task.hours[dayIndex])
      return total + (isNaN(val) ? 0 : val)
    }, 0)
  }

  const calculateTaskTotal = (taskIndex: number) => {
    return timesheetData[taskIndex].hours.reduce((total, val) => {
      const num = parseFloat(val)
      return total + (isNaN(num) ? 0 : num)
    }, 0)
  }

  const weeklyTotal = days.reduce((total, _, i) => total + calculateDailyTotal(i), 0)

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success("Timesheet submitted successfully for approval.")
    }, 1500)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={Clock01Icon} className="h-6 w-6 text-primary" />
              Time Tracking & Timesheets
            </h1>
            <p className="text-sm text-muted-foreground">
              Log your hours across projects and tasks. Ensure your weekly total is accurate before submitting.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-muted px-4 py-2 rounded-lg border border-border shadow-sm flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Weekly Total:</span>
              <span className="text-lg font-bold text-primary">{weeklyTotal.toFixed(1)}h</span>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || weeklyTotal === 0}
              className="shadow-sm font-semibold transition-all duration-200"
            >
              {isSubmitting ? "Submitting..." : "Submit Timesheet"}
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-[2fr_repeat(7,1fr)_1fr] gap-4 bg-muted/50 p-4 border-b border-border text-sm font-semibold text-muted-foreground">
            <div>Project / Task</div>
            {days.map((day, i) => (
              <div key={day} className="text-center">
                <div className="text-xs uppercase tracking-wider">{day}</div>
                <div className="text-foreground text-base mt-0.5">{dates[i]}</div>
              </div>
            ))}
            <div className="text-right">Total</div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-border">
            {timesheetData.map((task, tIndex) => (
              <div key={task.id} className="grid grid-cols-[2fr_repeat(7,1fr)_1fr] gap-4 p-4 items-center transition-colors hover:bg-muted/20">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary/80"></span>
                    {task.project}
                  </div>
                  <div className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                    <HugeiconsIcon icon={CheckmarkSquare02Icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{task.task}</span>
                  </div>
                </div>
                
                {days.map((_, dIndex) => (
                  <div key={dIndex} className="flex justify-center">
                    <Input
                      type="text"
                      value={task.hours[dIndex]}
                      onChange={(e) => handleHourChange(tIndex, dIndex, e.target.value)}
                      className={cn(
                        "w-16 h-9 text-center text-sm font-medium transition-colors focus:border-primary",
                        parseFloat(task.hours[dIndex]) > 0 ? "bg-primary/5 text-primary border-primary/20" : "bg-transparent border-transparent hover:border-border"
                      )}
                      placeholder="0"
                    />
                  </div>
                ))}

                <div className="text-right font-bold text-foreground flex justify-end items-center">
                  {calculateTaskTotal(tIndex).toFixed(1)}h
                </div>
              </div>
            ))}
          </div>

          {/* Footer Row (Totals) */}
          <div className="grid grid-cols-[2fr_repeat(7,1fr)_1fr] gap-4 bg-muted/30 p-4 border-t border-border font-bold">
            <div className="text-right text-sm text-muted-foreground pr-2 flex items-center justify-end">
              Daily Totals
            </div>
            {days.map((_, i) => (
              <div key={i} className="text-center text-sm text-foreground">
                {calculateDailyTotal(i) > 0 ? `${calculateDailyTotal(i).toFixed(1)}h` : "-"}
              </div>
            ))}
            <div className="text-right text-base text-primary">
              {weeklyTotal.toFixed(1)}h
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
