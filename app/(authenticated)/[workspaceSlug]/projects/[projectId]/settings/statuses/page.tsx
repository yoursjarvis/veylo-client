"use client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCreateStatus,
  useDeleteStatus,
  useProjectStatuses,
  useUpdateStatus,
} from "@/features/tasks/hooks/use-tasks"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "@tanstack/react-form"
import { Check, Tag, X, GripVertical } from "lucide-react"
import { Delete01Icon, Edit02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useProject } from "../../layout"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const COLOR_PRESETS = [
  { name: "Slate", hex: "#64748b" },
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
]

function StatusRow({
  status,
  projectId,
}: {
  status: { id: string; name: string; color?: string }
  projectId: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(status.name)
  const [editedColor, setEditedColor] = useState(status.color || "#e2e8f0")

  const updateStatusMutation = useUpdateStatus(projectId)
  const deleteStatusMutation = useDeleteStatus(projectId)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = () => {
    if (!editedName.trim()) return
    updateStatusMutation.mutate(
      {
        id: status.id,
        data: { name: editedName.trim(), color: editedColor },
      },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      }
    )
  }

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this status? Tasks in this status might be affected."
      )
    ) {
      deleteStatusMutation.mutate(status.id)
    }
  }

  if (isEditing) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="flex flex-col gap-3 rounded-lg border border-primary/50 bg-card p-3 shadow-sm relative z-10"
      >
        <div className="flex items-center gap-3">
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="h-8 text-xs font-medium"
            placeholder="Status name"
          />
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={editedColor}
              onChange={(e) => setEditedColor(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded p-0.5"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleSave}
              disabled={updateStatusMutation.isPending}
              className="h-8 w-8"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/10",
        isDragging && "opacity-50 z-50 border-primary shadow-md"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground touch-none focus:outline-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              !status.color && "bg-primary/60"
            )}
            style={status.color ? { backgroundColor: status.color } : undefined}
          />
        </div>
        <span className="text-xs font-semibold">{status.name}</span>
        {status.color && (
          <span className="font-mono text-2xs text-muted-foreground">
            {status.color}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          className="h-8 w-8"
        >
          <HugeiconsIcon icon={Edit02Icon} className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleteStatusMutation.isPending}
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function StatusesSettingsPage() {
  const { projectId, isWorkspaceAdmin } = useProject()

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})

  const { data: statuses, isLoading: isStatusesLoading } =
    useProjectStatuses(projectId)
  const createStatusMutation = useCreateStatus(projectId)
  const updateStatusMutation = useUpdateStatus(projectId)

  const [localStatuses, setLocalStatuses] = useState<{ id: string; name: string; color?: string; order?: number }[]>([])

  useEffect(() => {
    if (statuses) {
      setTimeout(() => setLocalStatuses(statuses), 0)
    }
  }, [statuses])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = localStatuses.findIndex((s) => s.id === active.id)
      const newIndex = localStatuses.findIndex((s) => s.id === over.id)
      
      const newStatuses = arrayMove(localStatuses, oldIndex, newIndex)
      setLocalStatuses(newStatuses)
      
      // Update orders for all affected items
      newStatuses.forEach((st, index) => {
        const currentOrder = st.order ?? -1
        if (currentOrder !== index) {
          updateStatusMutation.mutate({ id: st.id, data: { order: index } })
        }
      })
    }
  }

  const form = useForm({
    defaultValues: {
      name: "",
      color: "#e2e8f0",
      category: "todo",
    },
    onSubmit: async ({ value }) => {
      setValidationErrors({})
      if (!value.name.trim()) return

      createStatusMutation.mutate(
        {
          name: value.name.trim(),
          color: value.color,
          category: value.category as "backlog" | "todo" | "in_progress" | "done",
        },
        {
          onSuccess: () => {
            form.reset()
          },
          onError: (error: unknown) => {
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
              toast.error(
                err.response?.data?.message || "Failed to create status"
              )
            }
          },
        }
      )
    },
  })

  if (!isWorkspaceAdmin) {
    return (
      <div className="p-8 text-center">
        You do not have administrative permissions to view settings.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Tag className="h-5 w-5" /> Project Statuses
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create, edit, or delete statuses to organize tasks within this
          project.
        </p>
      </div>

      {isStatusesLoading ? (
        <div className="flex flex-col space-y-6 p-6 w-full">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="rounded-md border border-border">
          <div className="border-b border-border p-4 flex gap-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4 border-b border-border last:border-0">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
      ) : (
        <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* List of Statuses */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Active Statuses
              </CardTitle>
              <CardDescription className="text-xs">
                Statuses currently available for tasks in this project. You can drag and drop them to reorder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!localStatuses || localStatuses.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground italic">
                  No statuses defined for this project.
                </div>
              ) : (
                <div className="space-y-3">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={localStatuses.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {localStatuses.map((st: { id: string; name: string; color?: string; order?: number }) => (
                        <StatusRow 
                          key={st.id} 
                          status={st} 
                          projectId={projectId}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form to Add Status */}
          <Card className="h-fit shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Create Project Status
              </CardTitle>
              <CardDescription className="text-xs">
                Define a new status with a name and custom color.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
                className="space-y-4 text-xs"
              >
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "Status name is required"
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = []
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err))
                    })
                    if (validationErrors.name)
                      fieldErrors.push(validationErrors.name)
                    const hasError =
                      field.state.meta.isTouched && !!fieldErrors.length
                    return (
                      <div className="space-y-1.5">
                        <label className="font-semibold">Status Name</label>
                        <Input
                          placeholder="e.g. To Do, In Progress, Done"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value)
                            setValidationErrors((prev) => ({
                              ...prev,
                              name: "",
                            }))
                          }}
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <p className="mt-1 text-2xs font-medium text-destructive">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  }}
                </form.Field>

                <form.Field
                  name="category"
                >
                  {(field) => (
                    <div className="space-y-1.5">
                      <label className="font-semibold">Category</label>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) => field.handleChange(val as "backlog" | "todo" | "in_progress" | "done")}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="color">
                  {(field) => (
                    <div className="space-y-2">
                      <label className="font-semibold">Status Color</label>

                      {/* Presets Grid */}
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => field.handleChange(preset.hex)}
                            className={cn(
                              "flex h-8 w-full items-center justify-center rounded-md border text-2xs font-semibold text-primary-foreground transition-all hover:scale-105",
                              field.state.value === preset.hex
                                ? "scale-100 border-primary-foreground ring-2 ring-primary"
                                : "border-transparent"
                            )}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          >
                            {field.state.value === preset.hex && "✓"}
                          </button>
                        ))}
                      </div>

                      {/* Custom Color Input */}
                      <div className="flex items-center gap-2 pt-2">
                        <div className="relative flex-1">
                          <Input
                            type="text"
                            placeholder="#ffffff"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="pl-9 font-mono"
                          />
                          <span
                            className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 rounded-full border border-border/20"
                            style={{ backgroundColor: field.state.value }}
                          />
                        </div>
                        <input
                          type="color"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>

                {/* Form Actions */}
                <div className="flex justify-end border-t border-border/80 pt-4">
                  <form.Subscribe
                    selector={(state) =>
                      [state.values.name, state.canSubmit] as const
                    }
                  >
                    {([nameVal, canSubmit]) => (
                      <Button
                        type="submit"
                        disabled={
                          !nameVal.trim() ||
                          !canSubmit ||
                          createStatusMutation.isPending
                        }
                      >
                        <HugeiconsIcon icon={PlusSignIcon} className="mr-1.5 h-4 w-4" /> Create Status
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

