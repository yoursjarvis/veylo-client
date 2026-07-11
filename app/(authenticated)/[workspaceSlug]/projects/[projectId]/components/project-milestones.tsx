"use client"

import { IconStack } from "@/components/reui/icon-stack"
import { Button } from "@/components/ui/button"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  useCreateMilestone,
  useDeleteMilestone,
  useProjectMilestones,
} from "@/features/tasks/hooks/use-tasks"
import { cn } from "@/lib/utils"
import {
  Add01Icon,
  Calendar03Icon,
  Delete02Icon,
  Flag03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { format, isBefore, startOfDay } from "date-fns"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ProjectMilestonesProps {
  projectId: string
}

export function ProjectMilestones({ projectId }: ProjectMilestonesProps) {
  const { data: milestones, isLoading: isMilestonesLoading } =
    useProjectMilestones(projectId)
  const createMilestoneMutation = useCreateMilestone(projectId)
  const deleteMilestoneMutation = useDeleteMilestone(projectId)

  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [milestoneValidationErrors, setMilestoneValidationErrors] = useState<
    Record<string, string>
  >({})

  const milestoneForm = useForm({
    defaultValues: {
      title: "",
      dueDate: null as Date | null,
    },
    onSubmit: async ({ value }) => {
      setMilestoneValidationErrors({})
      createMilestoneMutation.mutate(
        {
          title: value.title.trim(),
          dueDate: value.dueDate ? value.dueDate.toISOString() : undefined,
        },
        {
          onSuccess: () => {
            milestoneForm.reset()
            setIsAddingMilestone(false)
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
              setMilestoneValidationErrors(errors)
            } else {
              toast.error(
                err.response?.data?.message || "Failed to create milestone"
              )
            }
          },
        }
      )
    },
  })

  useEffect(() => {
    if (isAddingMilestone) {
      milestoneForm.reset()
    }
  }, [isAddingMilestone, milestoneForm])

  const handleDeleteMilestone = (id: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      deleteMilestoneMutation.mutate(id)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
            <HugeiconsIcon
              icon={Flag03Icon}
              className="h-4.5 w-4.5 text-primary"
            />{" "}
            Key Milestones
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Track critical check points and release markers on your roadmap.
          </CardDescription>
        </div>
        {(milestones || []).length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddingMilestone(!isAddingMilestone)
              setMilestoneValidationErrors({})
            }}
            className="h-8 text-2xs font-bold uppercase"
          >
            <HugeiconsIcon icon={Add01Icon} className="mr-1 h-3.5 w-3.5" />
            Add Milestone
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingMilestone && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              milestoneForm.handleSubmit()
            }}
            className="space-y-3 rounded-xl border border-border bg-muted/30 p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <milestoneForm.Field
                name="title"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "Milestone title is required"
                    return undefined
                  },
                }}
              >
                {(field) => {
                  const fieldErrors: string[] = []
                  field.state.meta.errors.forEach((err) => {
                    if (err) fieldErrors.push(String(err))
                  })
                  if (milestoneValidationErrors.title)
                    fieldErrors.push(milestoneValidationErrors.title)
                  const hasError =
                    field.state.meta.isTouched && !!fieldErrors.length
                  return (
                    <div className="space-y-1">
                      <Label className="text-2xs font-bold text-muted-foreground uppercase">
                        Milestone Title
                      </Label>
                      <Input
                        placeholder="e.g. Beta Release 1.0"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value)
                          setMilestoneValidationErrors((prev) => ({
                            ...prev,
                            title: "",
                          }))
                        }}
                        aria-invalid={hasError}
                        className="h-9 w-full rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                      />
                      {hasError && (
                        <p className="mt-1 text-2xs font-medium text-destructive">
                          {fieldErrors.join(", ")}
                        </p>
                      )}
                    </div>
                  )
                }}
              </milestoneForm.Field>

              <milestoneForm.Field
                name="dueDate"
                validators={{
                  onChange: ({ value }) => {
                    if (
                      value &&
                      isBefore(startOfDay(value), startOfDay(new Date()))
                    ) {
                      return "Target date cannot be in the past"
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
                  if (milestoneValidationErrors.dueDate)
                    fieldErrors.push(milestoneValidationErrors.dueDate)
                  const hasError =
                    field.state.meta.isTouched && !!fieldErrors.length
                  return (
                    <div className="flex flex-col justify-end space-y-1">
                      <Label className="mb-1 text-2xs font-bold text-muted-foreground uppercase">
                        Target Date
                      </Label>
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
                              <HugeiconsIcon
                                icon={Calendar03Icon}
                                className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                              />
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
                              setMilestoneValidationErrors((prev) => ({
                                ...prev,
                                dueDate: "",
                              }))
                            }}
                            disabled={{ before: startOfDay(new Date()) }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {hasError && (
                        <p className="mt-1 text-2xs font-medium text-destructive">
                          {fieldErrors.join(", ")}
                        </p>
                      )}
                    </div>
                  )
                }}
              </milestoneForm.Field>
            </div>
            <div className="flex justify-end gap-1.5">
              <Button type="submit" size="sm" className="h-8 px-3 text-xs">
                Create Milestone
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setIsAddingMilestone(false)}
                className="h-8 px-3 text-xs"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {isMilestonesLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {(milestones || []).map(
              (milestone: {
                id: string
                title: string
                dueDate?: string | null
              }) => (
                <div
                  key={milestone.id}
                  className="group flex items-center justify-between rounded-xl border bg-card p-3 transition-all hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-1.5 text-primary">
                      <HugeiconsIcon icon={Flag03Icon} className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {milestone.title}
                      </p>
                      {milestone.dueDate && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            className="h-3 w-3"
                          />{" "}
                          Target Date:{" "}
                          {format(new Date(milestone.dueDate), "MMMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    className="p-1.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                  </button>
                </div>
              )
            )}
            {(milestones || []).length === 0 && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <IconStack
                      aria-hidden="true"
                      className="h-24 w-22 text-primary"
                    >
                      <HugeiconsIcon
                        icon={Flag03Icon}
                        className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                      />
                    </IconStack>
                  </EmptyMedia>
                  <EmptyTitle>No milestones set</EmptyTitle>
                  <EmptyDescription>
                    Set milestones to mark key phases of your project.
                  </EmptyDescription>
                </EmptyHeader>

                <EmptyContent className="flex-row justify-center gap-2">
                  <Button
                    variant="outline-default"
                    size="sm"
                    onClick={() => {
                      setIsAddingMilestone(!isAddingMilestone)
                      setMilestoneValidationErrors({})
                    }}
                    className="h-8 text-2xs font-bold uppercase"
                  >
                    <HugeiconsIcon
                      icon={Add01Icon}
                      className="mr-1 h-3.5 w-3.5"
                    />{" "}
                    Add Milestone
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
