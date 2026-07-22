"use client"
import { Label } from "@/types/models"

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
  useCreateLabel,
  useDeleteLabel,
  useProjectLabels,
} from "@/features/tasks/hooks/use-tasks"
import { cn } from "@/lib/utils"
import { useForm } from "@tanstack/react-form"
import { Tag } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useProject } from "../../layout"
import { usePermissions } from "@/hooks/use-permissions"

import { IconStack } from "@/components/reui/icon-stack"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Delete01Icon,
  LabelIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

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

export default function LabelsSettingsPage() {
  const { projectId } = useProject()
  const { hasPermission } = usePermissions()

  const canRead = hasPermission("project-label:read")
  const canCreate = hasPermission("project-label:create")
  const canDelete = hasPermission("project-label:delete")

  const [labelValidationErrors, setLabelValidationErrors] = useState<
    Record<string, string>
  >({})

  const { data: labels, isLoading: isLabelsLoading } =
    useProjectLabels(projectId)
  const createLabelMutation = useCreateLabel(projectId)
  const deleteLabelMutation = useDeleteLabel(projectId)

  const form = useForm({
    defaultValues: {
      name: "",
      color: "#3b82f6",
    },
    onSubmit: async ({ value }) => {
      setLabelValidationErrors({})
      if (!value.name.trim()) return

      createLabelMutation.mutate(
        {
          name: value.name.trim(),
          color: value.color,
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
              setLabelValidationErrors(errors)
            } else {
              toast.error(
                err.response?.data?.message || "Failed to create label"
              )
            }
          },
        }
      )
    },
  })

  if (!canRead) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to view project labels.
      </div>
    )
  }

  const handleDeleteLabel = (labelId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this label? Tasks using it will no longer show this label."
      )
    ) {
      deleteLabelMutation.mutate(labelId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Tag className="h-5 w-5" /> Project Labels
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create, edit, or delete categorization tags/labels to organize tasks
          within this project.
        </p>
      </div>

      {isLabelsLoading ? (
        <div className="flex w-full flex-col space-y-6 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="rounded-md border border-border">
            <div className="flex gap-4 border-b border-border p-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 border-b border-border p-4 last:border-0"
              >
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* List of Labels */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Active Labels
              </CardTitle>
              <CardDescription className="text-xs">
                Labels currently available for tasks in this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!labels || labels.length === 0 ? (
                <Card className="m-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card px-4 py-16 text-center">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia>
                        <IconStack
                          aria-hidden="true"
                          className="h-24 w-22 text-primary"
                        >
                          <HugeiconsIcon
                            icon={LabelIcon}
                            className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                          />
                        </IconStack>
                      </EmptyMedia>
                      <EmptyTitle>No Label</EmptyTitle>
                      <EmptyDescription>
                        No labels defined for this project. Create your first
                        label.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </Card>
              ) : (
                <div className="space-y-3">
                  {labels.map((lbl: Label) => (
                    <div
                      key={lbl.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/10"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-2xs font-bold text-primary-foreground shadow-sm"
                          style={{ backgroundColor: lbl.color }}
                        >
                          {lbl.name}
                        </span>
                        <span className="font-mono text-2xs text-muted-foreground">
                          {lbl.color}
                        </span>
                      </div>
                      {canDelete && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteLabel(lbl.id)}
                          disabled={deleteLabelMutation.isPending}
                          className="h-8 w-8"
                        >
                          <HugeiconsIcon
                            icon={Delete01Icon}
                            className="h-4 w-4"
                          />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form to Add Label */}
          {canCreate && (
            <Card className="h-fit shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Create Project Label
                </CardTitle>
                <CardDescription className="text-xs">
                  Define a new label with a name and custom color.
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
                        if (!value.trim()) return "Label name is required"
                        return undefined
                      },
                    }}
                  >
                    {(field) => {
                      const fieldErrors: string[] = []
                      field.state.meta.errors.forEach((err) => {
                        if (err) fieldErrors.push(String(err))
                      })
                      if (labelValidationErrors.name)
                        fieldErrors.push(labelValidationErrors.name)
                      const hasError =
                        field.state.meta.isTouched && !!fieldErrors.length
                      return (
                        <div className="space-y-1.5">
                          <label className="font-semibold">Label Name</label>
                          <Input
                            placeholder="e.g. Bug, Feature, Urgent"
                            value={field.state.value}
                            onChange={(e) => {
                              field.handleChange(e.target.value)
                              setLabelValidationErrors((prev) => ({
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

                  <form.Field name="color">
                    {(field) => (
                      <div className="space-y-2">
                        <label className="font-semibold">Label Color</label>

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
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
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
                            createLabelMutation.isPending
                          }
                        >
                          <HugeiconsIcon
                            icon={PlusSignIcon}
                            className="mr-1.5 h-4 w-4"
                          />{" "}
                          Create Label
                        </Button>
                      )}
                    </form.Subscribe>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
