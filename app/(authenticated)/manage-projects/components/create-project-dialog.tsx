/* eslint-disable react-hooks/set-state-in-effect */
import { axiosInstance } from "@/lib/axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { IconPicker } from "@/components/shared/icon-picker"
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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Textarea } from "@/components/ui/textarea"
import { ProjectTemplate } from "../types"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaces: Array<{ id: string; name: string; slug: string }>
  activeWorkspace: { id: string; name: string; slug: string } | null
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  workspaces,
  activeWorkspace,
}: CreateProjectDialogProps) {
  const queryClient = useQueryClient()

  // Form states
  const [title, setTitle] = useState("")
  const [projectKey, setProjectKey] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState<string | File | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState("general-project")
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  )

  // Initialize selected workspace to the active one on open
  useEffect(() => {
    if (open) {
      if (activeWorkspace) {
        setSelectedWorkspaceId(activeWorkspace.id)
      } else {
        setSelectedWorkspaceId(null)
      }
      // Reset form states
      setTitle("")
      setProjectKey("")
      setDescription("")
      setIcon(null)
      setSelectedTemplate("general-project")
    }
  }, [open, activeWorkspace])

  // Fetch templates for project creation
  const { data: templates } = useQuery<ProjectTemplate[]>({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const response = await axiosInstance.get("/project-templates")
      return response.data.data
    },
    enabled: open,
  })

  const workspaceOptions = useMemo(() => {
    return (workspaces || []).map((w) => ({
      value: w.id,
      label: w.name,
    }))
  }, [workspaces])

  const handleProjectKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase()
    if (val.length <= 10) {
      setProjectKey(val)
    }
  }

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

  // Create Project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      projectKey: string
      description?: string
      icon?: string | File | null
      template: string
      workspaceId: string
    }) => {
      const isFile = payload.icon instanceof File
      const res = await axiosInstance.post(
        `/workspaces/${payload.workspaceId}/projects`,
        {
          title: payload.title,
          projectKey: payload.projectKey,
          description: payload.description,
          icon: !isFile ? (payload.icon as string | null) : undefined,
          template: payload.template,
        }
      )
      const createdProject = res.data.data
      if (isFile && payload.icon) {
        const iconUrl = await uploadProjectIcon(
          createdProject.id,
          payload.icon as File
        )
        createdProject.icon = iconUrl
      }
      return createdProject
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["manage-all-projects-infinite"],
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project created successfully")
      onOpenChange(false)
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to create project")
    },
  })

  const handleCreate = () => {
    if (!selectedWorkspaceId) return
    createProjectMutation.mutate({
      title,
      projectKey,
      description,
      icon: icon || "icon:FolderOpenIcon:#4f46e5",
      template: selectedTemplate,
      workspaceId: selectedWorkspaceId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border/50 bg-card p-6 text-foreground shadow-lg sm:max-w-112.5">
        <DialogHeader className="space-y-1.5 border-b border-border/50 pb-4">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
            Create Project
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a new project. Admins can select the workspace target.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Workspace selector */}
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Target Workspace <span className="text-destructive">*</span>
            </label>
            <SearchableSelect
              value={selectedWorkspaceId}
              onValueChange={(val) => {
                setSelectedWorkspaceId(val)
              }}
              options={workspaceOptions}
              placeholder="Select target workspace..."
              searchPlaceholder="Search workspaces..."
              emptyText="No workspaces found"
              triggerClassName="h-9 text-xs"
            />
          </div>

          {/* Title Field */}
          <div className="grid gap-1.5">
            <label
              htmlFor="title"
              className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              placeholder="e.g. Payment Gateway Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background text-xs"
            />
          </div>

          {/* Project Key Field */}
          <div className="grid gap-1.5">
            <label
              htmlFor="projectKey"
              className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Project Key <span className="text-destructive">*</span>
            </label>
            <Input
              id="projectKey"
              placeholder="Example: DEV"
              value={projectKey}
              onChange={handleProjectKeyChange}
              className="h-9 rounded-lg border border-border bg-background text-xs uppercase"
            />
            <p className="text-2xs text-muted-foreground">
              Used to generate task IDs (e.g. DEV-1, DEV-2). Permanent once
              created.
            </p>
          </div>

          {/* Description Field */}
          <div className="grid gap-1.5">
            <label
              htmlFor="desc"
              className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Description
            </label>
            <Textarea
              id="desc"
              placeholder="Project description, objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 rounded-lg border border-border bg-background text-xs"
            />
          </div>

          {/* Template Picker */}
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Project Template
            </label>
            <SearchableSelect
              value={selectedTemplate}
              onValueChange={(val) => {
                if (val) setSelectedTemplate(val)
              }}
              options={(templates || []).map((tpl) => ({
                value: tpl.slug,
                label: tpl.name,
              }))}
              placeholder="Select a template..."
              searchPlaceholder="Search templates..."
              emptyText="No templates found"
              triggerClassName="h-9 text-xs"
            />
          </div>

          {/* Icon Selector */}
          <div className="grid gap-1.5">
            <label
              htmlFor="icon"
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
            disabled={
              !title.trim() ||
              projectKey.trim().length < 2 ||
              !selectedWorkspaceId ||
              createProjectMutation.isPending
            }
            onClick={handleCreate}
            className="h-9 bg-primary text-xs text-primary-foreground"
          >
            {createProjectMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
