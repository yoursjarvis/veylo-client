"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { ComboboxSelect } from "@/components/ui/combobox-select"
import { Calendar } from "@/components/ui/calendar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Calendar01Icon, Clock01Icon, PlayIcon, StopIcon } from "@hugeicons/core-free-icons"
import {
  Task,
  TaskStatus,
  Sprint,
  Epic,
  Milestone,
  Label,
  ProjectMember,
  CustomFieldDefinition,
  TaskLabel
} from "@/types/models"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { useTaskWorkLogs, useCreateWorkLog, useDeleteWorkLog } from "@/features/tasks/hooks/use-tasks"

interface TaskDetailsSidebarProps {
  task: Task
  projectStatuses: TaskStatus[]
  projectSprints: Sprint[]
  projectEpics: Epic[]
  projectMilestones: Milestone[]
  projectLabels: Label[]
  projectMembers: ProjectMember[]
  customFieldDefinitions: CustomFieldDefinition[] | undefined
  projectTemplate: string
  onFieldChange: (field: string, value: unknown) => void
  onCustomFieldChange: (fieldKey: string, value: unknown) => void
}

export function TaskDetailsSidebar({
  task,
  projectStatuses,
  projectSprints,
  projectEpics,
  projectMilestones,
  projectLabels,
  projectMembers,
  customFieldDefinitions,
  projectTemplate,
  onFieldChange,
  onCustomFieldChange,
}: TaskDetailsSidebarProps) {
  const { data: user } = useCurrentUser()
  const currentUser = user?.user
  const { data: workLogs = [] } = useTaskWorkLogs(task.id)
  const createWorkLogMutation = useCreateWorkLog(task.id)
  const deleteWorkLogMutation = useDeleteWorkLog(task.id)

  const [isLogWorkOpen, setIsLogWorkOpen] = React.useState(false)
  const [hours, setHours] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [descError, setDescError] = React.useState(false)

  const [isTimerRunning, setIsTimerRunning] = React.useState(false)
  const [timerSeconds, setTimerSeconds] = React.useState(0)
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    const activeTimerKey = `task-timer-${task.id}`
    const stored = localStorage.getItem(activeTimerKey)
    
    const startInterval = (startTime: number, initialElapsed: number) => {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - startTime) / 1000) + initialElapsed)
      }, 1000)
    }

    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.isRunning) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsTimerRunning(true)
          const currentElapsed = Math.floor((Date.now() - data.startTime) / 1000) + data.elapsed
          setTimerSeconds(currentElapsed)
          startInterval(data.startTime, data.elapsed)
        } else {
          setTimerSeconds(data.elapsed || 0)
        }
      } catch (e) {
        console.error("Failed to parse timer state", e)
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [task.id])

  const toggleTimer = () => {
    const activeTimerKey = `task-timer-${task.id}`
    if (isTimerRunning) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      setIsTimerRunning(false)
      localStorage.setItem(activeTimerKey, JSON.stringify({
        isRunning: false,
        elapsed: timerSeconds,
      }))
    } else {
      setIsTimerRunning(true)
      const now = Date.now()
      localStorage.setItem(activeTimerKey, JSON.stringify({
        isRunning: true,
        startTime: now,
        elapsed: timerSeconds,
      }))
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - now) / 1000) + timerSeconds)
      }, 1000)
    }
  }

  const resetTimer = () => {
    const activeTimerKey = `task-timer-${task.id}`
    localStorage.removeItem(activeTimerKey)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    setIsTimerRunning(false)
    setTimerSeconds(0)
  }

  const submitTimer = () => {
    if (timerSeconds === 0) return
    const hoursVal = (timerSeconds / 3600).toFixed(2)
    setHours(hoursVal)
    setIsLogWorkOpen(true)
    resetTimer()
  }

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const totalLoggedHours = workLogs.reduce((acc: number, log: { hoursLogged: number }) => acc + log.hoursLogged, 0)
  const statusOptions = projectStatuses.map((st) => ({
    value: st.id,
    label: st.name,
  }))

  const assigneeOptions = [
    {
      value: "",
      label: "Unassigned",
      icon: <HugeiconsIcon icon={Add01Icon} size={12} className="text-muted-foreground" />,
    },
    ...projectMembers.map((m) => ({
      value: String(m.user?.id || ""),
      label: m.user?.name || "Unknown",
      icon: (
        <Avatar className="h-5 w-5 border border-border">
          <AvatarImage src={m.user?.image || ""} />
          <AvatarFallback className="bg-muted text-[8px] font-bold text-muted-foreground">
            {m.user?.name?.charAt(0).toUpperCase() || "-"}
          </AvatarFallback>
        </Avatar>
      ),
    })),
  ]

  const typeOptions = [
    { value: "task", label: "Task" },
    { value: "bug", label: "Bug (Defect)" },
    { value: "feature", label: "Feature" },
  ]

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ]

  const sprintOptions = [
    { value: "", label: "Backlog" },
    ...projectSprints.map((sp) => ({
      value: sp.id,
      label: `${sp.name} (${sp.status})`,
    })),
  ]

  const epicOptions = [
    { value: "", label: "No Epic" },
    ...projectEpics.map((ep) => ({
      value: ep.id,
      label: ep.title,
    })),
  ]

  const milestoneOptions = [
    { value: "", label: "No Milestone" },
    ...projectMilestones.map((ms) => ({
      value: ms.id,
      label: ms.title,
    })),
  ]

  return (
    <div className="space-y-6">
      {/* Group 1: Status, Assignee, Type, Priority */}
      <div className="space-y-3.5">
        <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
          Properties
        </h3>
        <div className="grid grid-cols-[100px_1fr] items-center gap-x-2 gap-y-3 text-xs">
          <span className="font-medium text-muted-foreground">Status</span>
          <div>
            <ComboboxSelect
              value={task.statusId}
              onValueChange={(val) => onFieldChange("statusId", val)}
              options={statusOptions}
              placeholder="Select status..."
              className="h-8"
            />
          </div>

          <span className="font-medium text-muted-foreground">Assignee</span>
          <div>
            {!task.assigneeId ? (
              <span
                role="button"
                tabIndex={0}
                className="text-primary hover:underline cursor-pointer text-xs transition-colors inline-block py-1.5"
                onClick={() => {
                  if (currentUser) {
                    onFieldChange("assigneeId", currentUser.id)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    if (currentUser) {
                      onFieldChange("assigneeId", currentUser.id)
                    }
                  }
                }}
              >
                Assign to me
              </span>
            ) : (
              <ComboboxSelect
                value={task.assigneeId}
                onValueChange={(val) => onFieldChange("assigneeId", val || null)}
                options={assigneeOptions}
                placeholder="Select assignee..."
                className="h-8"
              />
            )}
          </div>

          <span className="font-medium text-muted-foreground">Reporter</span>
          <div>
            <ComboboxSelect
              value={task.reporterId || ""}
              onValueChange={(val) => onFieldChange("reporterId", val || null)}
              options={assigneeOptions}
              placeholder="Select reporter..."
              className="h-8"
            />
          </div>

          <span className="font-medium text-muted-foreground">Type</span>
          <div>
            <ComboboxSelect
              value={task.type}
              onValueChange={(val) => onFieldChange("type", val)}
              options={typeOptions}
              placeholder="Select type..."
              className="h-8"
            />
          </div>

          <span className="font-medium text-muted-foreground">Priority</span>
          <div>
            <ComboboxSelect
              value={task.priority}
              onValueChange={(val) => onFieldChange("priority", val)}
              options={priorityOptions}
              placeholder="Select priority..."
              className="h-8"
            />
          </div>

          <span className="font-medium text-muted-foreground">Privacy</span>
          <div className="flex items-center gap-2 py-1">
            <Checkbox
              id="isPrivate"
              checked={!!task.isPrivate}
              onCheckedChange={(checked) => onFieldChange("isPrivate", !!checked)}
            />
            <label
              htmlFor="isPrivate"
              className="text-xs text-muted-foreground cursor-pointer font-medium select-none"
            >
              Private Task
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Group 2: Sprint, Estimate, Due Date */}
      <div className="space-y-3.5">
        <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
          Planning
        </h3>
        <div className="grid grid-cols-[100px_1fr] items-center gap-x-2 gap-y-3 text-xs">
          {projectTemplate === "scrum" && (
            <>
              <span className="font-medium text-muted-foreground">Sprint</span>
              <div>
                <ComboboxSelect
                  value={task.sprintId || ""}
                  onValueChange={(val) => onFieldChange("sprintId", val || null)}
                  options={sprintOptions}
                  placeholder="Select sprint..."
                  className="h-8"
                />
              </div>
            </>
          )}

          <>
            <span className="font-medium text-muted-foreground">Estimate</span>
            <div>
              <Input
                type="number"
                value={task.estimate ?? ""}
                onChange={(e) =>
                  onFieldChange(
                    "estimate",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                className="h-8 w-full rounded-md border-transparent bg-transparent px-2 text-xs text-foreground transition-colors hover:border-border/50 hover:bg-muted/40 focus:border-border/80 focus:bg-background focus:outline-none"
                placeholder="Estimate value..."
              />
            </div>
          </>

          <span className="font-medium text-muted-foreground">Due Date</span>
          <div>
            <Popover>
              <PopoverTrigger render={
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8",
                    !task.dueDate && "text-muted-foreground"
                  )}
                />
              }>
                  <HugeiconsIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" icon={Calendar01Icon} />
                  {task.dueDate ? (
                    format(new Date(task.dueDate), "MMM d, yyyy")
                  ) : (
                    "Set due date"
                  )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={task.dueDate ? new Date(task.dueDate) : undefined}
                  onSelect={(date) =>
                    onFieldChange(
                      "dueDate",
                      date ? date.toISOString() : null
                    )
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <span className="font-medium text-muted-foreground">Logged Time</span>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">{totalLoggedHours} hrs</span>
              {task.estimate ? (
                <span className="text-[10px] text-muted-foreground">
                  of {task.estimate}h estimate ({Math.min(100, Math.round((totalLoggedHours / task.estimate) * 100))}% logged)
                </span>
              ) : null}
            </div>
            
            {task.estimate ? (
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalLoggedHours / task.estimate) * 100)}%` }}
                />
              </div>
            ) : null}

            <div className="bg-muted/50 rounded-md p-2 mt-2 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <HugeiconsIcon icon={Clock01Icon} size={14} className={isTimerRunning ? "text-primary animate-pulse" : "text-muted-foreground"} />
                  <span className={isTimerRunning ? "text-foreground" : "text-muted-foreground"}>
                    {formatTimer(timerSeconds)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={isTimerRunning ? "destructive" : "outline"}
                    size="icon"
                    className="h-6 w-6"
                    onClick={toggleTimer}
                  >
                    <HugeiconsIcon icon={isTimerRunning ? StopIcon : PlayIcon} size={12} />
                  </Button>
                  {timerSeconds > 0 && !isTimerRunning && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      onClick={submitTimer}
                    >
                      Log
                    </Button>
                  )}
                  {timerSeconds > 0 && !isTimerRunning && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                      onClick={resetTimer}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="h-7 w-full text-[11px] font-medium flex items-center justify-center gap-1 mt-1"
              onClick={() => setIsLogWorkOpen(true)}
            >
              <HugeiconsIcon icon={Add01Icon} size={11} />
              Manual Log Work
            </Button>

            <Dialog open={isLogWorkOpen} onOpenChange={setIsLogWorkOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Log work hours</DialogTitle>
                </DialogHeader>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsedHours = parseFloat(hours);
                    if (isNaN(parsedHours) || parsedHours <= 0) {
                      return;
                    }
                    
                    const doc = new DOMParser().parseFromString(description, 'text/html');
                    const textContent = doc.body.textContent || "";
                    if (textContent.trim().length === 0) {
                      setDescError(true);
                      return;
                    }
                    
                    createWorkLogMutation.mutate({ 
                      hoursLogged: parsedHours, 
                      description: description || null 
                    }, {
                      onSuccess: () => {
                        setHours("");
                        setDescription("");
                        setDescError(false);
                        setIsLogWorkOpen(false);
                      }
                    });
                  }}
                  className="space-y-4 py-2"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Hours spent <span className="text-destructive">*</span></label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="0.1"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="e.g. 1.5" 
                      required 
                      className="h-9 text-xs" 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">What did you do? <span className="text-destructive">*</span></label>
                    <RichTextEditor
                      placeholder="Describe what work you performed..."
                      value={description}
                      onChange={(val) => {
                        setDescription(val);
                        if (descError) {
                          const doc = new DOMParser().parseFromString(val, 'text/html');
                          const text = doc.body.textContent || "";
                          if (text.trim().length > 0) {
                            setDescError(false);
                          }
                        }
                      }}
                      projectMembers={projectMembers
                        .filter((m) => !!m.user)
                        .map((m) => ({
                          user: {
                            id: m.user!.id,
                            name: m.user!.name,
                            image: m.user!.image,
                            email: m.user!.email,
                          },
                        }))}
                      minHeight="120px"
                      className="group [&>div:last-child]:hidden [&>div:last-child]:border-t-0 [&>div:last-child]:bg-transparent focus-within:[&>div:last-child]:flex"
                    />
                    {descError && (
                      <p className="text-[11px] font-medium text-destructive">
                        What did you do is required.
                      </p>
                    )}
                  </div>
                  
                  <DialogFooter className="pt-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        setIsLogWorkOpen(false);
                        setHours("");
                        setDescription("");
                        setDescError(false);
                      }}
                      className="h-9 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createWorkLogMutation.isPending} 
                      className="h-9 text-xs min-w-[80px]"
                    >
                      {createWorkLogMutation.isPending ? "Logging..." : "Log Hours"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {workLogs.length > 0 && (
              <Popover>
                <PopoverTrigger render={
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="h-6 w-full text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center justify-center"
                  />
                }>
                  Show History ({workLogs.length})
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3 max-h-60 overflow-y-auto space-y-2" align="start">
                  <h4 className="font-bold text-xs border-b border-border pb-1">Work Log History</h4>
                  {workLogs.map((log: { id: string; hoursLogged: number; description?: string; loggedAt?: string; user?: { name?: string } }) => (
                    <div key={log.id} className="text-[11px] flex justify-between gap-2 border-b border-border/30 pb-2 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">
                          {log.hoursLogged} hrs by <span className="font-semibold">{log.user?.name || "Member"}</span>
                        </div>
                        {log.description && <div className="text-muted-foreground">{log.description}</div>}
                        <div className="text-[9px] text-muted-foreground/60">
                          {log.loggedAt ? format(new Date(log.loggedAt), "MMM d, yyyy h:mm a") : ""}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => {
                          if (confirm("Delete this log?")) {
                            deleteWorkLogMutation.mutate(log.id)
                          }
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Group 3: Epic, Milestone, Labels */}
      <div className="space-y-3.5">
        <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
          Context
        </h3>
        <div className="grid grid-cols-[100px_1fr] items-center gap-x-2 gap-y-3 text-xs">
          <span className="font-medium text-muted-foreground">Epic</span>
          <div>
            <ComboboxSelect
              value={task.epicId || ""}
              onValueChange={(val) => onFieldChange("epicId", val || null)}
              options={epicOptions}
              placeholder="Select epic..."
              className="h-8"
            />
          </div>

          <span className="font-medium text-muted-foreground">Milestone</span>
          <div>
            <ComboboxSelect
              value={task.milestoneId || ""}
              onValueChange={(val) => onFieldChange("milestoneId", val || null)}
              options={milestoneOptions}
              placeholder="Select milestone..."
              className="h-8"
            />
          </div>

          <span className="font-medium text-muted-foreground">Labels</span>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              {projectLabels
                .filter((lbl) =>
                  (task.labels || []).some(
                    (tl: TaskLabel) => tl.labelId === lbl.id
                  )
                )
                .map((lbl: Label) => (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => {
                      const nextIds = (task.labels || [])
                        .map((tl: TaskLabel) => tl.labelId)
                        .filter((id: string) => id !== lbl.id)
                      onFieldChange("labelIds", nextIds)
                    }}
                    className="group relative flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:opacity-85 focus-visible:ring-2 focus-visible:ring-primary/20"
                    style={{
                      backgroundColor: lbl.color ? `${lbl.color}20` : "rgba(59, 130, 246, 0.12)",
                      borderColor: lbl.color ? `${lbl.color}40` : "rgba(59, 130, 246, 0.25)",
                      color: lbl.color || "#3b82f6",
                    }}
                    title="Click to remove"
                  >
                    <span>{lbl.name}</span>
                    <span className="text-xs font-semibold opacity-75 transition-opacity group-hover:opacity-100">
                      ×
                    </span>
                  </button>
                ))}

              <Popover>
                <PopoverTrigger render={
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded border border-dashed border-border bg-transparent px-2 py-0.5 text-[11px] text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  />
                }>
                    <HugeiconsIcon icon={Add01Icon} size={11} /> Add Label
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1.5" align="start">
                  <div className="mb-1 border-b border-border/50 px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                    Toggle Labels
                  </div>
                  <div className="max-h-48 space-y-0.5 overflow-y-auto">
                    {projectLabels.map((lbl: Label) => {
                      const isSelected = (task.labels || []).some(
                        (tl: TaskLabel) => tl.labelId === lbl.id
                      )
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => {
                            const currentIds = (task.labels || []).map(
                              (tl: TaskLabel) => tl.labelId
                            )
                            const nextIds = isSelected
                              ? currentIds.filter(
                                  (id: string) => id !== lbl.id
                                )
                              : [...currentIds, lbl.id]
                            onFieldChange("labelIds", nextIds)
                          }}
                          className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-all hover:bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: lbl.color }}
                            />
                            <span className="font-medium text-foreground">
                              {lbl.name}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-xs text-primary">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                    {projectLabels.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                        No labels found.
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {customFieldDefinitions && customFieldDefinitions.length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div className="space-y-3.5">
            <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
              Custom Fields
            </h3>
            <div className="grid grid-cols-[100px_1fr] items-center gap-x-2 gap-y-3 text-xs">
              {customFieldDefinitions.map(
                (fieldDef: CustomFieldDefinition) => {
                  const fieldValue =
                    task.customFields?.[fieldDef.id] ?? ""
                  return (
                    <React.Fragment key={fieldDef.id}>
                      <span
                        className="truncate font-medium text-muted-foreground"
                        title={fieldDef.name}
                      >
                        {fieldDef.name}
                      </span>
                      <div>
                        {fieldDef.type === "checkbox" ? (
                          <div className="flex items-center gap-2 pl-2">
                            <Checkbox
                              checked={!!fieldValue}
                              onCheckedChange={(checked) =>
                                onCustomFieldChange(
                                  fieldDef.id,
                                  !!checked
                                )
                              }
                              className="border-border"
                            />
                            <span className="text-xs text-muted-foreground">
                              Yes
                            </span>
                          </div>
                        ) : fieldDef.type === "select" ? (
                          <ComboboxSelect
                            value={(fieldValue as string) || null}
                            onValueChange={(val) =>
                              onCustomFieldChange(
                                fieldDef.id,
                                val || ""
                              )
                            }
                            options={
                              (fieldDef.options as unknown as string[]).map(
                                (opt) => ({
                                  value: opt,
                                  label: opt,
                                })
                              )
                            }
                            placeholder="Choose option..."
                            className="h-8"
                          />
                        ) : (
                          <Input
                            type={
                              fieldDef.type === "number"
                                ? "number"
                                : fieldDef.type === "date"
                                  ? "date"
                                  : "text"
                            }
                            value={
                              fieldDef.type === "date" && fieldValue
                                ? format(new Date(fieldValue as string), "yyyy-MM-dd")
                                : (fieldValue as string | number) || ""
                            }
                            onChange={(e) =>
                              onCustomFieldChange(
                                fieldDef.id,
                                fieldDef.type === "number"
                                  ? parseFloat(e.target.value) || 0
                                  : fieldDef.type === "date"
                                    ? e.target.value
                                      ? new Date(e.target.value).toISOString()
                                      : ""
                                    : e.target.value
                              )
                            }
                            className="h-8 w-full rounded-md border-transparent bg-transparent px-2 text-xs text-foreground transition-colors hover:border-border/50 hover:bg-muted/40 focus:border-border/80 focus:bg-background focus:outline-none"
                          />
                        )}
                      </div>
                    </React.Fragment>
                  )
                }
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
