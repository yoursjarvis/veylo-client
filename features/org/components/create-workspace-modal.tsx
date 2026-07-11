"use client"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { Button } from "@/components/ui/button"
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
import { useWorkspaces } from "@/hooks/use-workspaces"
import { axiosInstance } from "@/lib/axios"
import { IconPicker } from "@/components/shared/icon-picker"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useForm } from "@tanstack/react-form"

export function CreateWorkspaceModal() {
  const { isCreateModalOpen, setIsCreateModalOpen } = useWorkspaceContext()
  const { createWorkspace } = useWorkspaces()
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const uploadIcon = async (workspaceId: string, file: File) => {
    const formData = new FormData()
    formData.append("icon", file)
    const response = await axiosInstance.post(`/media/workspace/${workspaceId}/icon`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.data.url
  }

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      icon: null as string | File | null,
    },
    onSubmit: async ({ value }) => {
      setValidationErrors({})
      try {
        const isFile = value.icon instanceof File
        const workspace = await createWorkspace.mutateAsync({
          name: value.name,
          slug: value.slug,
          icon: !isFile ? (value.icon as string) : undefined,
        })

        if (isFile && value.icon) {
          await uploadIcon(workspace.id, value.icon as File)
        }

        setIsCreateModalOpen(false)
        form.reset()
        toast.success("Workspace created successfully")
      } catch (error) {
        const axiosError = error as { response?: { data?: { details?: Array<{ field: string; message: string }>; message?: string } } }
        const errorDetails = axiosError.response?.data?.details
        if (Array.isArray(errorDetails)) {
          const errors: Record<string, string> = {}
          errorDetails.forEach((d) => {
            errors[d.field] = d.message
          })
          setValidationErrors(errors)
        } else {
          toast.error(axiosError.response?.data?.message || "Failed to create workspace")
        }
      }
    },
  })

  useEffect(() => {
    if (isCreateModalOpen) {
      form.reset()
    }
  }, [isCreateModalOpen, form])

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="sm:max-w-112.5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Add a new workspace to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 py-4">
            <div className="pt-6">
              <form.Field name="icon">
                {(field) => (
                  <IconPicker 
                    value={field.state.value instanceof File ? URL.createObjectURL(field.state.value) : (field.state.value ?? undefined)} 
                    onChange={(val) => field.handleChange(val)} 
                  />
                )}
              </form.Field>
            </div>
            <div className="grid flex-1 gap-4">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "Workspace name is required"
                    return undefined
                  },
                }}
              >
                {(field) => {
                  const fieldErrors: string[] = []
                  field.state.meta.errors.forEach((err) => {
                    if (err) fieldErrors.push(String(err))
                  })
                  if (validationErrors.name) fieldErrors.push(validationErrors.name)
                  const hasError = field.state.meta.isTouched && !!fieldErrors.length
                  return (
                    <div className="grid gap-2">
                      <Label htmlFor="name">Workspace Name</Label>
                      <Input
                        id="name"
                        placeholder="Marketing, Engineering, etc."
                        value={field.state.value}
                        onChange={(e) => {
                          const val = e.target.value
                          field.handleChange(val)
                          form.setFieldValue(
                            "slug",
                            val
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)+/g, "")
                          )
                          setValidationErrors((prev) => ({ ...prev, name: "" }))
                        }}
                        aria-invalid={hasError}
                      />
                      {hasError && (
                        <p className="text-[11px] text-destructive font-medium mt-1">
                          {fieldErrors.join(", ")}
                        </p>
                      )}
                    </div>
                  )
                }}
              </form.Field>

              <form.Field
                name="slug"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "Workspace slug is required"
                    if (!/^[a-z0-9-]+$/.test(value)) return "Slug can only contain lowercase letters, numbers, and hyphens"
                    return undefined
                  },
                }}
              >
                {(field) => {
                  const fieldErrors: string[] = []
                  field.state.meta.errors.forEach((err) => {
                    if (err) fieldErrors.push(String(err))
                  })
                  if (validationErrors.slug) fieldErrors.push(validationErrors.slug)
                  const hasError = field.state.meta.isTouched && !!fieldErrors.length
                  return (
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Workspace Slug</Label>
                      <Input
                        id="slug"
                        placeholder="marketing"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value)
                          setValidationErrors((prev) => ({ ...prev, slug: "" }))
                        }}
                        aria-invalid={hasError}
                      />
                      {hasError && (
                        <p className="text-[11px] text-destructive font-medium mt-1">
                          {fieldErrors.join(", ")}
                        </p>
                      )}
                    </div>
                  )
                }}
              </form.Field>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createWorkspace.isPending}>
              {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
