"use client"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { useProjectEpics } from "@/features/tasks/hooks/use-tasks"
import { axiosInstance } from "@/lib/axios"
import { Epic, Project } from "@/types/models"
import {
  ArrowRight01Icon,
  Briefcase02Icon,
  Target02Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons"
import Image from "next/image"
import { getThumbUrl } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import React, { useState } from "react"
import { useForm, useStore } from "@tanstack/react-form"
import { z } from "zod"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  useWorkspaceObjectives,
  useCreateObjective,
  useUpdateObjective,
  useDeleteObjective,
  useRestoreObjective,
  useForceDeleteObjective,
  Objective,
} from "../hooks/use-okrs"
import { usePermissions } from "@/hooks/use-permissions"
import { Edit, Trash2, RotateCcw, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"





const objectiveSchema = z.object({
  title: z.string().min(1, "Objective title is required"),
  description: z.string().optional(),
  krTitle: z.string().min(1, "Key Result title is required"),
  krTarget: z.string().min(1, "Target is required"),
  projectId: z.string().nullable().refine((val) => val !== null && val !== "", {
    message: "Project is required",
  }),
  epicId: z.string().nullable().optional(),
})

export function OkrsDashboard() {
  const { activeWorkspace } = useWorkspaceContext()

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return []
      const response = await axiosInstance.get(
        `/workspaces/${activeWorkspace.id}/projects`
      )
      return response.data.data
    },
    enabled: !!activeWorkspace,
  })

  const { hasPermission } = usePermissions()
  const canCreate = hasPermission("goal-okrs:create")
  const canUpdate = hasPermission("goal-okrs:update")
  const canDelete = hasPermission("goal-okrs:delete")
  const canRestore = hasPermission("goal-okrs:restore")
  const canForceDelete = hasPermission("goal-okrs:force-delete")

  const [withTrashed, setWithTrashed] = useState(false)

  const workspaceId = activeWorkspace?.id ?? ""
  const { data: okrs = [] } = useWorkspaceObjectives(workspaceId, withTrashed)
  const createObjectiveMutation = useCreateObjective(workspaceId)
  const updateObjectiveMutation = useUpdateObjective(workspaceId)
  const deleteObjectiveMutation = useDeleteObjective(workspaceId)
  const restoreObjectiveMutation = useRestoreObjective(workspaceId)
  const forceDeleteObjectiveMutation = useForceDeleteObjective(workspaceId)

  const [userExpandedObj, setUserExpandedObj] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)

  const expandedObj = userExpandedObj ?? (okrs.length > 0 ? okrs[0].id : null)

  const renderProjectIcon = (icon?: string | null) => {
    const baseClasses = "flex items-center justify-center rounded bg-secondary/80 border border-border/40 shrink-0"
    const sizeClass = "h-5 w-5"
    const textClass = "text-2xs"
    if (!icon) {
      return (
        <span className={`${baseClasses} ${sizeClass} ${textClass}`}>
          📁
        </span>
      )
    }
    if (
      icon.startsWith("http") ||
      icon.startsWith("/") ||
      icon.startsWith("blob:")
    ) {
      const imageUrl = icon.startsWith("blob:")
        ? icon
        : getThumbUrl(icon) || icon
      return (
        <div className={`${baseClasses} ${sizeClass} relative overflow-hidden bg-background`}>
          <Image
            src={imageUrl}
            onError={(e) => {
              if (imageUrl !== icon && icon) {
                e.currentTarget.src = icon
              }
            }}
            alt="Project Icon"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )
    }
    return (
      <span className={`${baseClasses} ${sizeClass} ${textClass} leading-none`}>
        {icon}
      </span>
    )
  }

  const projectOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return projects
      .filter((p: Project) => {
        if (!p.id || !p.title || seen.has(p.title)) return false
        seen.add(p.title)
        return true
      })
      .map((p: Project) => ({ value: p.id, label: p.title }))
  }, [projects])

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      krTitle: "",
      krTarget: "",
      projectId: null as string | null,
      epicId: null as string | null,
    },
    onSubmit: async ({ value }) => {
      await createObjectiveMutation.mutateAsync({
        title: value.title,
        description: value.description,
        krTitle: value.krTitle,
        krTarget: value.krTarget,
        projectId: value.projectId ?? "",
        epicId: value.epicId,
      })
      form.reset()
      setIsDialogOpen(false)
    },
  })

  // Watch projectId to fetch epics
  const selectedProjectId = useStore(form.store, (state) => state.values.projectId)

  const { data: epics = [] } = useProjectEpics(selectedProjectId ?? "")

  const epicOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return (epics as Epic[])
      .filter((e: Epic) => {
        if (!e.id || !e.title || seen.has(e.title)) return false
        seen.add(e.title)
        return true
      })
      .map((e: Epic) => ({ value: e.id, label: e.title }))
  }, [epics])



  const editForm = useForm({
    defaultValues: {
      title: "",
      description: "",
      krTitle: "",
      krTarget: "",
      projectId: null as string | null,
      epicId: null as string | null,
    },
    onSubmit: async ({ value }) => {
      if (!editingObjective) return
      await updateObjectiveMutation.mutateAsync({
        id: editingObjective.id,
        data: {
          title: value.title,
          description: value.description,
          krTitle: value.krTitle,
          krTarget: value.krTarget,
          projectId: value.projectId ?? "",
          epicId: value.epicId,
        },
      })
      editForm.reset()
      setIsEditDialogOpen(false)
      setEditingObjective(null)
    },
  })

  // Watch projectId to fetch epics for editForm
  const selectedEditProjectId = useStore(editForm.store, (state) => state.values.projectId)

  const { data: editEpics = [] } = useProjectEpics(selectedEditProjectId ?? "")

  const editEpicOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return (editEpics as Epic[])
      .filter((e: Epic) => {
        if (!e.id || !e.title || seen.has(e.title)) return false
        seen.add(e.title)
        return true
      })
      .map((e: Epic) => ({ value: e.id, label: e.title }))
  }, [editEpics])

  // Populate editForm on open
  React.useEffect(() => {
    if (editingObjective && isEditDialogOpen) {
      editForm.setFieldValue("title", editingObjective.title)
      editForm.setFieldValue("description", editingObjective.description)
      editForm.setFieldValue("krTitle", editingObjective.keyResults[0]?.title || "")
      editForm.setFieldValue("krTarget", editingObjective.keyResults[0]?.target || "")
      editForm.setFieldValue("projectId", editingObjective.projectId)
      editForm.setFieldValue("epicId", editingObjective.epicId || null)
    }
  }, [editingObjective, isEditDialogOpen, editForm])

  // Reset form on open
  React.useEffect(() => {
    if (isDialogOpen) {
      form.reset()
    }
  }, [isDialogOpen, form])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Goals & OKRs</h2>
          <p className="text-muted-foreground">
            Company-wide Objectives and Key Results linked to your active
            projects.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {canRestore && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="with-trashed-switch"
                className="text-sm font-medium text-muted-foreground cursor-pointer"
              >
                Include Trashed
              </label>
              <Switch
                id="with-trashed-switch"
                checked={withTrashed}
                onCheckedChange={setWithTrashed}
              />
            </div>
          )}
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <HugeiconsIcon icon={Target02Icon} className="mr-2 h-4 w-4" />
                New Objective
              </Button>
            }
          />
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle>Create New Objective</DialogTitle>
              <DialogDescription>
                Define a high-level goal for your organization.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 py-4">
                 <form.Field
                  name="title"
                  validators={{
                    onChange: ({ value }) => {
                      const res = objectiveSchema.shape.title.safeParse(value)
                      return res.success ? undefined : res.error.errors[0].message
                    },
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                      <FieldLabel htmlFor={field.name}>Objective Title</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Expand into Enterprise Market"
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      <FieldError errors={field.state.meta.errors.map((err) => ({ message: String(err) }))} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Short summary of this objective"
                      />
                    </Field>
                  )}
                </form.Field>

                <div className="mt-2 border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                    Initial Key Result
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <form.Field
                        name="krTitle"
                        validators={{
                          onChange: ({ value }) => {
                            const res = objectiveSchema.shape.krTitle.safeParse(value)
                            return res.success ? undefined : res.error.errors[0].message
                          },
                        }}
                      >
                        {(field) => (
                          <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                            <FieldLabel htmlFor={field.name} className="text-xs">
                              KR Title
                            </FieldLabel>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="e.g. Increase MAU by 20%"
                              aria-invalid={field.state.meta.errors.length > 0}
                            />
                            <FieldError errors={field.state.meta.errors.map((err) => ({ message: String(err) }))} />
                          </Field>
                        )}
                      </form.Field>
                    </div>
                    <div className="col-span-1">
                      <form.Field
                        name="krTarget"
                        validators={{
                          onChange: ({ value }) => {
                            const res = objectiveSchema.shape.krTarget.safeParse(value)
                            return res.success ? undefined : res.error.errors[0].message
                          },
                        }}
                      >
                        {(field) => (
                          <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                            <FieldLabel htmlFor={field.name} className="text-xs">
                              Target
                            </FieldLabel>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="e.g. 20%"
                              aria-invalid={field.state.meta.errors.length > 0}
                            />
                            <FieldError errors={field.state.meta.errors.map((err) => ({ message: String(err) }))} />
                          </Field>
                        )}
                      </form.Field>
                    </div>
                  </div>
                </div>

                <div className="mt-2 space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Link Project & Epic
                  </h4>
                  <form.Field
                    name="projectId"
                    validators={{
                      onChange: ({ value }) => {
                        const res = objectiveSchema.shape.projectId.safeParse(value)
                        return res.success ? undefined : res.error.errors[0].message
                      },
                    }}
                  >
                    {(field) => (
                      <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                        <FieldLabel>Project</FieldLabel>
                        <SearchableSelect
                          value={field.state.value}
                          onValueChange={(val) => {
                            field.handleChange(val)
                            form.setFieldValue("epicId", null)
                          }}
                          options={projectOptions}
                          placeholder="Select a project"
                          ariaInvalid={field.state.meta.errors.length > 0}
                        />
                        <FieldError errors={field.state.meta.errors.map((err) => ({ message: String(err) }))} />
                      </Field>
                    )}
                  </form.Field>

                  {selectedProjectId && (
                    <form.Field name="epicId">
                      {(field) => (
                        <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                          <FieldLabel>Epic (Optional)</FieldLabel>
                          <SearchableSelect
                            value={field.state.value}
                            onValueChange={(val) => field.handleChange(val)}
                            options={epicOptions}
                            placeholder="Select an epic"
                            clearable
                            ariaInvalid={field.state.meta.errors.length > 0}
                          />
                        </Field>
                      )}
                    </form.Field>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Objective"}
                    </Button>
                  )}
                </form.Subscribe>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
        </div>
      </div>

      <div className="grid gap-6">
        {okrs.map((obj) => (
          <Card key={obj.id} className="overflow-hidden">
            <div
              className="cursor-pointer p-6 transition-colors hover:bg-muted/50"
              onClick={() =>
                setUserExpandedObj(expandedObj === obj.id ? "" : obj.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    {obj.title}
                    {obj.deletedAt && (
                      <Badge variant="destructive" className="text-2xs px-1.5 py-0 leading-normal">
                        Deleted
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {obj.description}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={obj.progress}
                      className="h-2 w-25 md:w-37.5"
                    />
                    <span className="w-10 text-right text-sm font-medium">
                      {obj.progress}%
                    </span>
                  </div>

                  {(canUpdate || canDelete || canRestore || canForceDelete) && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={(props) => (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              {...props}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          )}
                        />
                        <DropdownMenuContent align="end" className="w-40 bg-popover text-popover-foreground">
                          {!obj.deletedAt && canUpdate && (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingObjective(obj)
                                setIsEditDialogOpen(true)
                              }}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {!obj.deletedAt && canDelete && (
                            <DropdownMenuItem
                              onClick={() => {
                                deleteObjectiveMutation.mutate(obj.id)
                              }}
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                          {obj.deletedAt && canRestore && (
                            <DropdownMenuItem
                              onClick={() => {
                                restoreObjectiveMutation.mutate(obj.id)
                              }}
                              className="gap-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                          )}
                          {obj.deletedAt && canForceDelete && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to permanently delete this objective?"
                                  )
                                ) {
                                  forceDeleteObjectiveMutation.mutate(obj.id)
                                }
                              }}
                              className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              Force Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                      expandedObj === obj.id ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            {expandedObj === obj.id && (
              <CardContent className="border-t bg-muted/30 p-6">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="flex items-center font-medium">
                      <HugeiconsIcon
                        icon={Target02Icon}
                        className="mr-2 h-4 w-4 text-primary"
                      />
                      Key Results
                    </h4>
                    <div className="space-y-4">
                      {obj.keyResults.map((kr) => (
                        <div key={kr.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{kr.title}</span>
                            <span className="text-muted-foreground">
                              Target: {kr.target}
                            </span>
                          </div>
                          <Progress value={kr.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="flex items-center font-medium">
                      <HugeiconsIcon
                        icon={Briefcase02Icon}
                        className="mr-2 h-4 w-4 text-primary"
                      />
                      Linked Projects & Epics
                    </h4>
                    <div className="space-y-4">
                      {obj.linkedProjects.map((item, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                              {item.type === "project" ? (
                                renderProjectIcon(item.icon)
                              ) : (
                                <HugeiconsIcon
                                  icon={Layers01Icon}
                                  className="h-5 w-5 text-muted-foreground"
                                />
                              )}
                              <span>{item.title}</span>
                            </span>
                            <Badge variant="secondary" className="text-2xs px-2 py-0">
                              {item.type}
                            </Badge>
                          </div>
                          <div className="h-2 bg-transparent" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {canUpdate && editingObjective && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle>Edit Objective</DialogTitle>
              <DialogDescription>
                Modify the details of your objective.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                editForm.handleSubmit()
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 py-4">
                <editForm.Field
                  name="title"
                  validators={{
                    onChange: ({ value }) => {
                      const res = objectiveSchema.shape.title.safeParse(value)
                      return res.success ? undefined : res.error.errors[0].message
                    },
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                      <FieldLabel htmlFor={field.name}>Objective Title</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Expand into Enterprise Market"
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      <FieldError errors={field.state.meta.errors.map((err) => ({ message: String(err) }))} />
                    </Field>
                  )}
                </editForm.Field>

                <editForm.Field name="description">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Short summary of this objective"
                      />
                    </Field>
                  )}
                </editForm.Field>

                <div className="mt-2 border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                    Initial Key Result
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <editForm.Field
                        name="krTitle"
                        validators={{
                          onChange: ({ value }) => {
                            const res = objectiveSchema.shape.krTitle.safeParse(value)
                            return res.success ? undefined : res.error.errors[0].message
                          },
                        }}
                      >
                        {(field) => (
                          <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                            <FieldLabel htmlFor={field.name} className="text-xs">
                              KR Title
                            </FieldLabel>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="e.g. Increase MAU by 20%"
                              aria-invalid={field.state.meta.errors.length > 0}
                            />
                            <FieldError errors={field.state.meta.errors.map((err) => ({ message: String(err) }))} />
                          </Field>
                        )}
                      </editForm.Field>
                    </div>
                    <div className="col-span-1">
                      <editForm.Field
                        name="krTarget"
                        validators={{
                          onChange: ({ value }) => {
                            const res = objectiveSchema.shape.krTarget.safeParse(value)
                            return res.success ? undefined : res.error.errors[0].message
                          },
                        }}
                      >
                        {(field) => (
                          <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                            <FieldLabel htmlFor={field.name} className="text-xs">
                              Target
                            </FieldLabel>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="e.g. 20%"
                              aria-invalid={field.state.meta.errors.length > 0}
                            />
                            <FieldError errors={field.state.meta.errors.map((err) => ({ message: String(err) }))} />
                          </Field>
                        )}
                      </editForm.Field>
                    </div>
                  </div>
                </div>

                <div className="mt-2 space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Link Project & Epic
                  </h4>
                  <editForm.Field
                    name="projectId"
                    validators={{
                      onChange: ({ value }) => {
                        const res = objectiveSchema.shape.projectId.safeParse(value)
                        return res.success ? undefined : res.error.errors[0].message
                      },
                    }}
                  >
                    {(field) => (
                      <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                        <FieldLabel>Project</FieldLabel>
                        <SearchableSelect
                          value={field.state.value}
                          onValueChange={(val) => {
                            field.handleChange(val)
                            editForm.setFieldValue("epicId", null)
                          }}
                          options={projectOptions}
                          placeholder="Select a project"
                          ariaInvalid={field.state.meta.errors.length > 0}
                        />
                        <FieldError errors={field.state.meta.errors.map((err) => ({ message: String(err) }))} />
                      </Field>
                    )}
                  </editForm.Field>

                  {selectedEditProjectId && (
                    <editForm.Field name="epicId">
                      {(field) => (
                        <Field data-invalid={field.state.meta.errors.length > 0 ? "true" : undefined}>
                          <FieldLabel>Epic (Optional)</FieldLabel>
                          <SearchableSelect
                            value={field.state.value}
                            onValueChange={(val) => field.handleChange(val)}
                            options={editEpicOptions}
                            placeholder="Select an epic"
                            clearable
                            ariaInvalid={field.state.meta.errors.length > 0}
                          />
                        </Field>
                      )}
                    </editForm.Field>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingObjective(null)
                  }}
                >
                  Cancel
                </Button>
                <editForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </editForm.Subscribe>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
