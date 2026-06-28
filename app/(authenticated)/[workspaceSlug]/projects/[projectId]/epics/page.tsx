"use client"
import { Epic, Task, TaskStatus } from "@/types/models"

import { useEffect, useState } from "react"
import { useProject } from "../layout"

import { Button } from "@/components/ui/button"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateEpic,
  useDeleteEpic,
  useProjectEpics,
  useProjectTasks,
  useUpdateEpic,
} from "@/features/tasks/hooks/use-tasks"
import { cn } from "@/lib/utils"
import { useForm } from "@tanstack/react-form"
import { format, isBefore, startOfDay } from "date-fns"
import { Calendar, Edit, Plus, Target, Trash } from "lucide-react"
import { toast } from "sonner"

const PRESET_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Slate", value: "#64748b" },
]

export default function EpicsPage() {
  const { projectId, statuses } = useProject()
  const { data: epics, isLoading: isEpicsLoading } = useProjectEpics(projectId)
  const { data: tasks, isLoading: isTasksLoading } = useProjectTasks(projectId)

  const createEpicMutation = useCreateEpic(projectId)
  const updateEpicMutation = useUpdateEpic(projectId)
  const deleteEpicMutation = useDeleteEpic(projectId)

  // Dialog State
  const [isOpen, setIsOpen] = useState(false)
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})

  const form = useForm({
    defaultValues: {
      title: editingEpic?.title || "",
      description: editingEpic?.description || "",
      color: editingEpic?.color || "#6366f1",
      startDate: editingEpic?.startDate
        ? new Date(editingEpic.startDate)
        : (null as Date | null),
      endDate: editingEpic?.endDate
        ? new Date(editingEpic.endDate)
        : (null as Date | null),
    },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.title.trim(),
        title: value.title.trim(),
        description: value.description.trim(),
        color: value.color,
        startDate: value.startDate ? value.startDate.toISOString() : null,
        endDate: value.endDate ? value.endDate.toISOString() : null,
      }

      setValidationErrors({})

      const handleMutationError = (error: unknown) => {
        const err = error as {
          response?: {
            data?: {
              details?: Array<{ field: string; message: string }>
              message?: string
            }
          }
        }
        const errorDetails = err.response?.data?.details
        if (Array.isArray(errorDetails)) {
          const errors: Record<string, string> = {}
          errorDetails.forEach((d) => {
            errors[d.field] = d.message
          })
          setValidationErrors(errors)
        } else {
          toast.error(err.response?.data?.message || "Failed to save Epic")
        }
      }

      if (editingEpic) {
        updateEpicMutation.mutate(
          { id: editingEpic.id, data: payload },
          {
            onSuccess: () => {
              setIsOpen(false)
            },
            onError: handleMutationError,
          }
        )
      } else {
        createEpicMutation.mutate(payload, {
          onSuccess: () => {
            setIsOpen(false)
          },
          onError: handleMutationError,
        })
      }
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen, editingEpic, form])

  const handleOpenCreate = () => {
    setEditingEpic(null)
    setValidationErrors({})
    setIsOpen(true)
  }

  const handleOpenEdit = (epic: Epic) => {
    setEditingEpic(epic)
    setValidationErrors({})
    setIsOpen(true)
  }

  const handleDelete = (epicId: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete the epic "${name}"? Tasks associated with this epic will remain but will lose the link.`
      )
    ) {
      deleteEpicMutation.mutate(epicId)
    }
  }

  if (isEpicsLoading || isTasksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Target className="h-5 w-5" /> Epics & Initiatives
          </h3>
          <p className="mt-1 text-xs">
            Define high-level feature buckets, business outcomes, and timeline
            goals.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Epic
        </Button>
      </div>

      {!epics || epics.length === 0 ? (
        <div className="flex min-h-75 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
          <Target className="mb-3 h-12 w-12" />
          <h4 className="text-sm font-bold">No Epics Created</h4>
          <p className="mt-1 max-w-xs text-xs leading-relaxed">
            Create an epic to group tasks under a larger initiative and monitor
            project outcomes.
          </p>
          <Button
            onClick={handleOpenCreate}
            variant="secondary"
            className="mt-4 h-8 text-xs font-semibold"
          >
            Create Epic
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {epics.map((epic: Epic) => {
            // Find tasks linked to this epic
            const epicTasks =
              tasks?.filter(
                (t: Task) => t.epicId === epic.id || t.epic?.id === epic.id
              ) || []
            const totalTasksCount = epicTasks.length
            const doneTasksCount = epicTasks.filter((t: Task) => {
              const status = statuses?.find(
                (s: TaskStatus) => s.id === t.statusId
              )
              return (
                status?.category === "done" ||
                status?.name?.toLowerCase() === "done" ||
                status?.name?.toLowerCase() === "completed"
              )
            }).length

            const progress =
              totalTasksCount > 0
                ? Math.round((doneTasksCount / totalTasksCount) * 100)
                : 0
            const epicColor = epic.color || "#6366f1"

            return (
              <Card
                key={epic.id}
                className="group relative flex flex-col justify-between overflow-hidden shadow-lg transition-all duration-300"
              >
                {/* Visual Accent Top Bar */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: epicColor }}
                />

                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: epicColor }}
                        />
                        <CardTitle className="text-sm font-bold transition-colors group-hover:text-primary">
                          {epic.title}
                        </CardTitle>
                      </div>
                      <p className="text-[10px]">ID: {epic.id.slice(0, 8)}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="t h-7 w-7"
                        onClick={() => handleOpenEdit(epic)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
                        onClick={() => handleDelete(epic.id, epic.title)}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-5 pt-0">
                  <p className="line-clamp-3 text-xs leading-relaxed whitespace-pre-wrap">
                    {epic.description || "No description provided."}
                  </p>

                  <div className="mt-auto space-y-3">
                    {/* Dates */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {epic.startDate
                          ? new Date(epic.startDate).toLocaleDateString()
                          : "No start"}
                        {" - "}
                        {epic.endDate
                          ? new Date(epic.endDate).toLocaleDateString()
                          : "No end"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span>Progress</span>
                        <span>
                          {doneTasksCount} / {totalTasksCount} tasks ({progress}
                          %)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: epicColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-6 sm:max-w-125">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingEpic ? "Edit Epic" : "Create Epic"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Group tasks under larger strategic priorities or phases.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <form.Field
                name="title"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "Epic title is required"
                    return undefined
                  },
                }}
              >
                {(field) => {
                  const fieldErrors: string[] = []
                  field.state.meta.errors.forEach((err) => {
                    if (err) fieldErrors.push(String(err))
                  })
                  if (validationErrors.title)
                    fieldErrors.push(validationErrors.title)
                  const hasError =
                    field.state.meta.isTouched && !!fieldErrors.length
                  return (
                    <div className="space-y-1">
                      <Label className="font-semibold">Epic Title</Label>
                      <Input
                        placeholder="e.g. Authentication Refresh"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value)
                          setValidationErrors((prev) => ({
                            ...prev,
                            title: "",
                          }))
                        }}
                        aria-invalid={hasError}
                        className="h-9 text-xs"
                      />
                      {hasError && (
                        <p className="mt-1 text-[11px] font-medium text-rose-500">
                          {fieldErrors.join(", ")}
                        </p>
                      )}
                    </div>
                  )
                }}
              </form.Field>

              <form.Field name="description">
                {(field) => {
                  const fieldErrors: string[] = []
                  field.state.meta.errors.forEach((err) => {
                    if (err) fieldErrors.push(String(err))
                  })
                  if (validationErrors.description)
                    fieldErrors.push(validationErrors.description)
                  const hasError =
                    field.state.meta.isTouched && !!fieldErrors.length
                  return (
                    <div className="space-y-1">
                      <Label className="font-semibold">Description</Label>
                      <Textarea
                        placeholder="Explain goals, key metrics, or scope..."
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value)
                          setValidationErrors((prev) => ({
                            ...prev,
                            description: "",
                          }))
                        }}
                        aria-invalid={hasError}
                        className="min-h-22.5 text-xs"
                      />
                      {hasError && (
                        <p className="mt-1 text-[11px] font-medium text-rose-500">
                          {fieldErrors.join(", ")}
                        </p>
                      )}
                    </div>
                  )
                }}
              </form.Field>

              <div className="grid grid-cols-2 gap-3">
                <form.Field
                  name="startDate"
                  validators={{
                    onChange: ({ value }) => {
                      if (
                        value &&
                        isBefore(startOfDay(value), startOfDay(new Date()))
                      ) {
                        return "Start date cannot be in the past"
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = []
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err))
                    })
                    if (validationErrors.startDate)
                      fieldErrors.push(validationErrors.startDate)
                    const hasError =
                      field.state.meta.isTouched && !!fieldErrors.length
                    return (
                      <div className="space-y-1">
                        <Label className="font-semibold">Start Date</Label>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                type="button"
                                variant="outline"
                                aria-invalid={hasError}
                                className={cn(
                                  "h-9 w-full justify-start rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-xs font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                                  !field.state.value && "text-muted-foreground"
                                )}
                              >
                                <Calendar className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                {field.state.value ? (
                                  format(field.state.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            }
                          />
                          <PopoverContent className="w-auto p-0" align="start">
                            <ShadcnCalendar
                              mode="single"
                              selected={field.state.value ?? undefined}
                              onSelect={(date) => {
                                field.handleChange(date ?? null)
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  startDate: "",
                                }))
                              }}
                              disabled={{ before: startOfDay(new Date()) }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {hasError && (
                          <p className="mt-1 text-[11px] font-medium text-rose-500">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  }}
                </form.Field>

                <form.Field
                  name="endDate"
                  validators={{
                    onChange: ({ value }) => {
                      if (
                        value &&
                        isBefore(startOfDay(value), startOfDay(new Date()))
                      ) {
                        return "End date cannot be in the past"
                      }
                      const startVal = form.state.values.startDate
                      if (
                        value &&
                        startVal &&
                        isBefore(startOfDay(value), startOfDay(startVal))
                      ) {
                        return "End date cannot be before start date"
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = []
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err))
                    })
                    if (validationErrors.endDate)
                      fieldErrors.push(validationErrors.endDate)
                    const hasError =
                      field.state.meta.isTouched && !!fieldErrors.length

                    const startVal = form.state.values.startDate
                    const minEndDate = startVal ? startVal : new Date()

                    return (
                      <div className="space-y-1">
                        <Label className="font-semibold">Target End Date</Label>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                type="button"
                                variant="outline"
                                aria-invalid={hasError}
                                className={cn(
                                  "h-9 w-full justify-start rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-xs font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                                  !field.state.value && "text-muted-foreground"
                                )}
                              >
                                <Calendar className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                {field.state.value ? (
                                  format(field.state.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            }
                          />
                          <PopoverContent className="w-auto p-0" align="start">
                            <ShadcnCalendar
                              mode="single"
                              selected={field.state.value ?? undefined}
                              onSelect={(date) => {
                                field.handleChange(date ?? null)
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  endDate: "",
                                }))
                              }}
                              disabled={{ before: startOfDay(minEndDate) }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {hasError && (
                          <p className="mt-1 text-[11px] font-medium text-rose-500">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  }}
                </form.Field>
              </div>

              <form.Field name="color">
                {(field) => (
                  <div className="space-y-2">
                    <Label className="font-semibold">Theme Color</Label>
                    <div className="flex flex-wrap gap-2.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          className={`h-7 w-7 rounded-full border-2 transition-all duration-200 ${
                            field.state.value === c.value
                              ? "scale-110 border-white shadow-lg"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => field.handleChange(c.value)}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </form.Field>
            </div>

            <DialogFooter className="border-slate-850 flex gap-2 border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="hover: h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createEpicMutation.isPending || updateEpicMutation.isPending
                }
                className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold hover:bg-primary/90"
              >
                {editingEpic ? "Save Epic" : "Create Epic"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
