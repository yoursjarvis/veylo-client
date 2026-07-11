"use client"

import { RichTextEditor } from "@/components/shared/rich-text-editor"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { ComboboxSelect } from "@/components/ui/combobox-select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { axiosInstance } from "@/lib/axios"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { useCreateTask, useProjectCustomFields } from "../hooks/use-tasks"

interface CreateTaskDialogProps {
  open: boolean
  projectId: string
  projectMembers: {
    user: { id: string; name: string; image?: string | null }
  }[]
  projectStatuses: { id: string; name: string }[]
  projectSprints: { id: string; name: string; status: string }[]
  projectTemplate: string
  onOpenChange: (open: boolean) => void
  projectEpics?: { id: string; title: string }[]
  projectMilestones?: { id: string; title: string }[]
  projectLabels?: { id: string; name: string; color: string }[]
}

export function CreateTaskDialog({
  open,
  projectId,
  projectMembers,
  projectStatuses,
  projectSprints,
  projectTemplate,
  onOpenChange,
  projectEpics = [],
  projectMilestones = [],
  projectLabels = [],
}: CreateTaskDialogProps) {
  const params = useParams()
  const workspaceSlug = params?.workspaceSlug as string
  const createTaskMutation = useCreateTask(projectId)
  const { data: customFieldDefinitions } = useProjectCustomFields(projectId)
  const queryClient = useQueryClient()

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [statusId, setStatusId] = useState("")
  const [type, setType] = useState<"task" | "bug" | "feature">("task")
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium")
  const [sprintId, setSprintId] = useState<string | null>(null)
  const [epicId, setEpicId] = useState<string | null>(null)
  const [milestoneId, setMilestoneId] = useState<string | null>(null)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [reporterId, setReporterId] = useState<string | null>(null)
  const [estimate, setEstimate] = useState<number | null>(null)
  const [dueDate, setDueDate] = useState("")
  type CustomFieldValue = string | number | boolean
  const [customFields, setCustomFields] = useState<
    Record<string, CustomFieldValue>
  >({})
  const [isInitializing, setIsInitializing] = useState(false)

  // Auto-initialize statuses if none exist
  useEffect(() => {
    if (
      open &&
      projectId &&
      projectStatuses &&
      projectStatuses.length === 0 &&
      !isInitializing
    ) {
      queueMicrotask(() => setIsInitializing(true))
      const defaults = [
        { name: "To Do", category: "todo", order: 0 },
        { name: "In Progress", category: "in_progress", order: 1 },
        { name: "Done", category: "done", order: 2 },
      ]
      Promise.all(
        defaults.map((status) =>
          axiosInstance.post(`/projects/${projectId}/statuses`, status)
        )
      )
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["statuses", projectId] })
        })
        .finally(() => {
          setIsInitializing(false)
        })
    }
  }, [projectStatuses, open, projectId, isInitializing, queryClient])

  useEffect(() => {
    if (projectStatuses && projectStatuses.length > 0) {
      queueMicrotask(() => setStatusId(projectStatuses[0].id))
    }
  }, [projectStatuses, open])

  // Reset all other fields on close/open
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setTitle("")
        setDescription("")
        setType("task")
        setPriority("medium")
        setSprintId(null)
        setEpicId(null)
        setMilestoneId(null)
        setSelectedLabels([])
        setAssigneeId(null)
        setReporterId(null)
        setEstimate(null)
        setDueDate("")
        setCustomFields({})
      })
    }
  }, [open])

  const handleCustomFieldChange = (
    fieldId: string,
    value: CustomFieldValue
  ) => {
    setCustomFields((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !statusId) return

    createTaskMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        statusId,
        type,
        priority,
        sprintId: sprintId || null,
        epicId: epicId || null,
        milestoneId: milestoneId || null,
        labelIds: selectedLabels,
        assigneeId: assigneeId || null,
        reporterId: reporterId || null,
        estimate: estimate,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        customFields,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  // Memoized lists of options
  const statusOptions = React.useMemo(() => {
    return projectStatuses.map((st) => ({
      value: st.id,
      label: st.name,
    }))
  }, [projectStatuses])

  const typeOptions = React.useMemo(
    () => [
      { value: "task", label: "Task" },
      { value: "bug", label: "Bug" },
      { value: "feature", label: "Feature" },
    ],
    []
  )

  const priorityOptions = React.useMemo(
    () => [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "urgent", label: "Urgent" },
    ],
    []
  )

  const assigneeOptions = React.useMemo(() => {
    return [
      {
        value: "unassigned",
        label: "Unassigned",
        icon: (
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px]">?</AvatarFallback>
          </Avatar>
        ),
      },
      ...projectMembers.map((m) => ({
        value: m.user?.id,
        label: m.user?.name,
        icon: (
          <Avatar className="h-5 w-5">
            <AvatarImage src={m.user?.image || ""} />
            <AvatarFallback className="text-[9px]">
              {m.user?.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ),
      })),
    ]
  }, [projectMembers])

  const sprintOptions = React.useMemo(() => {
    return [
      { value: "backlog", label: "Backlog" },
      ...projectSprints.map((sp) => ({
        value: sp.id,
        label: `${sp.name} (${sp.status})`,
      })),
    ]
  }, [projectSprints])

  const epicOptions = React.useMemo(() => {
    return [
      { value: "none", label: "Select epic..." },
      ...projectEpics.map((ep) => ({
        value: ep.id,
        label: ep.title,
      })),
    ]
  }, [projectEpics])

  const milestoneOptions = React.useMemo(() => {
    return [
      { value: "none", label: "Select milestone..." },
      ...projectMilestones.map((ms) => ({
        value: ms.id,
        label: ms.title,
      })),
    ]
  }, [projectMilestones])

  const selectedLabelsList = React.useMemo(() => {
    return selectedLabels
      .map((id) => projectLabels.find((l) => l.id === id))
      .filter(Boolean) as typeof projectLabels
  }, [selectedLabels, projectLabels])

  const unselectedLabelsList = React.useMemo(() => {
    return projectLabels.filter((lbl) => !selectedLabels.includes(lbl.id))
  }, [projectLabels, selectedLabels])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]">
        {/* Sticky Header */}
        <DialogHeader className="flex-none border-b border-border bg-card p-5">
          <DialogTitle className="text-base font-bold text-foreground">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-8 overflow-y-auto p-6">
            {/* Section 1: Task Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Task Details
              </h3>

              {/* Title Input */}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  required
                  placeholder="e.g. Implement authentication flow"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-lg border-border bg-background px-3.5 text-base text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              {/* Description RichTextEditor */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">
                  Description
                </Label>
                <RichTextEditor
                  placeholder="Add context, links, screenshots, or acceptance criteria..."
                  value={description}
                  onChange={setDescription}
                  projectMembers={projectMembers}
                  minHeight="140px"
                  className="group [&>div:last-child]:hidden [&>div:last-child]:border-t-0 [&>div:last-child]:bg-transparent focus-within:[&>div:last-child]:flex"
                />
              </div>
            </div>

            {/* Section 2: Assignment & Planning */}
            <div className="grid grid-cols-1 gap-8 border-t border-border pt-6">
              {/* Left Column: Assignment */}
              <div className="space-y-6">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Assignment
                </h3>

                {/* Status & Type */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-medium text-foreground">
                      Status *{" "}
                      {isInitializing && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </Label>
                    <ComboboxSelect
                      value={statusId}
                      onValueChange={(val) => setStatusId(val || "")}
                      options={statusOptions}
                      placeholder={
                        isInitializing ? "Initializing..." : "Select status..."
                      }
                      emptyText="No statuses found"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Type
                    </Label>
                    <ComboboxSelect
                      value={type}
                      onValueChange={(val) =>
                        setType((val as "task" | "bug" | "feature") || "task")
                      }
                      options={typeOptions}
                      placeholder="Select type..."
                      isSearchable={false}
                    />
                  </div>
                </div>

                {/* Priority & Assignee */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Priority
                    </Label>
                    <ComboboxSelect
                      value={priority}
                      onValueChange={(val) =>
                        setPriority(
                          (val as "low" | "medium" | "high" | "urgent") ||
                            "medium"
                        )
                      }
                      options={priorityOptions}
                      placeholder="Select priority..."
                      isSearchable={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Assignee
                    </Label>
                    <ComboboxSelect
                      value={assigneeId || "unassigned"}
                      onValueChange={(val) =>
                        setAssigneeId(val === "unassigned" ? null : val)
                      }
                      options={assigneeOptions}
                      placeholder="Select assignee..."
                      emptyText="No members found"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Reporter
                    </Label>
                    <ComboboxSelect
                      value={reporterId || "unassigned"}
                      onValueChange={(val) =>
                        setReporterId(val === "unassigned" ? null : val)
                      }
                      options={assigneeOptions}
                      placeholder="Select reporter..."
                      emptyText="No members found"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Planning */}
              <div className="space-y-6">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Planning
                </h3>

                {/* Due Date & Estimate */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-foreground">
                      Due Date
                    </Label>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-9 w-full justify-start border-border bg-background text-left text-xs font-normal text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/20",
                              !dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            {dueDate ? (
                              format(new Date(dueDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate ? new Date(dueDate) : undefined}
                          onSelect={(date) =>
                            setDueDate(date ? date.toISOString() : "")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Estimate
                    </Label>
                    <Input
                      type="number"
                      placeholder="Estimate"
                      value={estimate ?? ""}
                      onChange={(e) =>
                        setEstimate(
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="h-9 border-border bg-background text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Epic & Milestone */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Epic / Goal
                    </Label>
                    <ComboboxSelect
                      value={epicId || "none"}
                      onValueChange={(val) =>
                        setEpicId(val === "none" ? null : val)
                      }
                      options={epicOptions}
                      placeholder="Select epic..."
                      emptyText="No epics found"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Milestone
                    </Label>
                    <ComboboxSelect
                      value={milestoneId || "none"}
                      onValueChange={(val) =>
                        setMilestoneId(val === "none" ? null : val)
                      }
                      options={milestoneOptions}
                      placeholder="Select milestone..."
                      emptyText="No milestones found"
                    />
                  </div>
                </div>

                {/* Sprint (if Scrum template) */}
                {projectTemplate === "scrum" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Sprint
                    </Label>
                    <ComboboxSelect
                      value={sprintId || "backlog"}
                      onValueChange={(val) =>
                        setSprintId(val === "backlog" ? null : val)
                      }
                      options={sprintOptions}
                      placeholder="Select sprint..."
                      emptyText="No sprints found"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Labels */}
            <div className="space-y-3 border-t border-border pt-6">
              <h3 className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Labels
              </h3>
              <div>
                {projectLabels && projectLabels.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedLabelsList.map((lbl) => (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => handleLabelToggle(lbl.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:opacity-85 focus-visible:ring-2 focus-visible:ring-primary/20"
                        style={{
                          backgroundColor: `${lbl.color}20`,
                          borderColor: `${lbl.color}40`,
                          color: lbl.color,
                        }}
                      >
                        <span>{lbl.name}</span>
                        <span className="text-xs font-semibold opacity-75 hover:opacity-100">
                          ×
                        </span>
                      </button>
                    ))}

                    {unselectedLabelsList.length > 0 && (
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="outline"
                              className="h-7 rounded-full border-dashed border-border px-3 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              + Add Label
                            </Button>
                          }
                        />
                        <PopoverContent
                          className="z-50 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg"
                          align="start"
                        >
                          <div className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Select Label
                          </div>
                          <div className="max-h-48 space-y-0.5 overflow-y-auto">
                            {unselectedLabelsList.map((lbl) => (
                              <button
                                key={lbl.id}
                                type="button"
                                onClick={() => handleLabelToggle(lbl.id)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                              >
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: lbl.color }}
                                />
                                <span className="truncate">{lbl.name}</span>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    No labels created.{" "}
                    <Link
                      href={`/${workspaceSlug}/projects/${projectId}/settings/labels`}
                      className="font-medium text-primary hover:underline"
                      onClick={() => onOpenChange(false)}
                    >
                      Create labels in Settings
                    </Link>
                  </p>
                )}
              </div>
            </div>

            {/* Section 4: Advanced Section (Custom Properties) */}
            {customFieldDefinitions && customFieldDefinitions.length > 0 && (
              <Accordion className="border-t border-border pt-4">
                <AccordionItem
                  value="custom-properties"
                  className="border-none"
                >
                  <AccordionTrigger className="flex items-center gap-2 py-2 text-xs font-semibold text-primary hover:no-underline">
                    <span className="text-xs font-bold tracking-wider uppercase">
                      Custom Properties
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {customFieldDefinitions.map(
                        (fieldDef: {
                          id: string
                          name: string
                          type: string
                          options?: string[]
                        }) => {
                          const fieldValue = customFields[fieldDef.id] ?? ""
                          return (
                            <div key={fieldDef.id} className="space-y-2">
                              <Label className="text-xs font-medium text-foreground">
                                {fieldDef.name}
                              </Label>
                              {fieldDef.type === "checkbox" ? (
                                <div className="mt-1.5 flex h-9 items-center gap-2">
                                  <Checkbox
                                    checked={!!fieldValue}
                                    onCheckedChange={(checked) =>
                                      handleCustomFieldChange(
                                        fieldDef.id,
                                        !!checked
                                      )
                                    }
                                    className="border-border"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    Yes / Active
                                  </span>
                                </div>
                              ) : fieldDef.type === "select" ? (
                                <ComboboxSelect
                                  value={
                                    typeof fieldValue === "string" && fieldValue
                                      ? fieldValue
                                      : "none"
                                  }
                                  onValueChange={(val) =>
                                    handleCustomFieldChange(
                                      fieldDef.id,
                                      val === "none" ? "" : val || ""
                                    )
                                  }
                                  options={[
                                    { value: "none", label: "Choose Option" },
                                    ...(fieldDef.options || []).map(
                                      (opt: string) => ({
                                        value: opt,
                                        label: opt,
                                      })
                                    ),
                                  ]}
                                  placeholder="Choose Option"
                                  isSearchable={false}
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
                                    typeof fieldValue === "boolean"
                                      ? String(fieldValue)
                                      : fieldValue
                                  }
                                  onChange={(e) =>
                                    handleCustomFieldChange(
                                      fieldDef.id,
                                      fieldDef.type === "number"
                                        ? parseFloat(e.target.value) || 0
                                        : e.target.value
                                    )
                                  }
                                  className="h-9 border-border bg-background text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                              )}
                            </div>
                          )
                        }
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="m-0 flex flex-none justify-end gap-3 rounded-none border-t border-border bg-muted/50 p-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-9 px-5 text-xs font-semibold">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
