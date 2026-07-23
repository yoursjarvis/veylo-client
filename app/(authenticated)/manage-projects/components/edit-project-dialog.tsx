/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { axiosInstance } from "@/lib/axios"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { IconPicker } from "@/components/shared/icon-picker"
import { Project } from "../types"

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
}: EditProjectDialogProps) {
  const queryClient = useQueryClient()

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState<string | File | null>(null)

  // Sync details from project prop when dialog opens
  useEffect(() => {
    if (open && project) {
      setTitle(project.title)
      setDescription(project.description || "")
      setIcon(project.icon)
    }
  }, [open, project])

  // Upload project icon helper
  const uploadProjectIcon = async (projectId: string, file: File) => {
    const formData = new FormData()
    formData.append("icon", file)
    const response = await axiosInstance.post(
      `/media/project/${projectId}/icon`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    )
    return response.data.data.url
  }

  // Edit Project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (payload: {
      id: string
      title?: string
      description?: string
      icon?: string | File | null
    }) => {
      const isFile = payload.icon instanceof File
      const patchData = {
        title: payload.title,
        description: payload.description,
        icon: !isFile ? (payload.icon as string | null) : undefined,
      }
      const res = await axiosInstance.patch(
        `/projects/${payload.id}`,
        patchData
      )
      const updatedProject = res.data.data
      if (isFile && payload.icon) {
        const iconUrl = await uploadProjectIcon(
          payload.id,
          payload.icon as File
        )
        updatedProject.icon = iconUrl
      }
      return updatedProject
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["manage-all-projects-infinite"],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project updated successfully")
      onOpenChange(false)
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to update project")
    },
  })

  const handleSave = () => {
    if (!project) return
    updateProjectMutation.mutate({
      id: project.id,
      title,
      description,
      icon,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border/50 bg-card p-6 text-foreground shadow-lg sm:max-w-112.5">
        <DialogHeader className="space-y-1.5 border-b border-border/50 pb-4">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
            Edit Project
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update project details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Title Field */}
          <div className="grid gap-1.5">
            <label
              htmlFor="edit-title"
              className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-title"
              placeholder="e.g. Payment Gateway Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background text-xs"
            />
          </div>

          {/* Description Field */}
          <div className="grid gap-1.5">
            <label
              htmlFor="edit-desc"
              className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Description
            </label>
            <Textarea
              id="edit-desc"
              placeholder="Project description, objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 rounded-lg border border-border bg-background text-xs"
            />
          </div>

          {/* Icon Selector */}
          <div className="grid gap-1.5">
            <label
              htmlFor="edit-icon"
              className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Project Icon
            </label>
            <div className="flex items-center gap-3">
              <IconPicker
                value={
                  icon instanceof File
                    ? URL.createObjectURL(icon)
                    : (icon as string | null)
                }
                onChange={(val) => setIcon(val)}
              />
              <span className="text-xs leading-normal text-muted-foreground">
                Choose a predefined icon &amp; color, or upload a custom image.
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-border/50 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            disabled={!title.trim() || updateProjectMutation.isPending}
            onClick={handleSave}
            className="h-9 bg-primary text-xs text-primary-foreground"
          >
            {updateProjectMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
