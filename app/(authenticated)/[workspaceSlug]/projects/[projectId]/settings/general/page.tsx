"use client"

import React, { useState, useEffect } from "react"
import { useProject } from "../../layout"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { IconPicker } from "@/components/shared/icon-picker"
import { Sliders, Trash2, AlertTriangle, Save } from "lucide-react"
import { useRouter } from "next/navigation"

export default function GeneralSettingsPage() {
  const { projectId, workspaceSlug, selectedProject, isWorkspaceAdmin } =
    useProject()
  const { activeWorkspace } = useWorkspaceContext()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState<string | File | null>(null)

  useEffect(() => {
    if (selectedProject) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing layout context project state
      setTitle(selectedProject.title || "")
      setDescription(selectedProject.description || "")
      setIcon(selectedProject.icon || null)
    }
  }, [selectedProject])

  const uploadProjectIcon = async (projId: string, file: File) => {
    const formData = new FormData()
    formData.append("icon", file)
    const response = await axiosInstance.post(
      `/media/project/${projId}/icon`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    )
    return response.data.data.url
  }

  const updateProjectMutation = useMutation({
    mutationFn: async (data: {
      title?: string
      description?: string
      icon?: string | File | null
    }) => {
      const isFile = data.icon instanceof File
      const patchData = {
        title: data.title,
        description: data.description,
        icon: !isFile ? (data.icon as string | null) : undefined,
      }
      const res = await axiosInstance.patch(`/projects/${projectId}`, patchData)
      const updatedProject = res.data.data
      if (isFile && data.icon) {
        const iconUrl = await uploadProjectIcon(projectId!, data.icon as File)
        updatedProject.icon = iconUrl
      }
      return updatedProject
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", activeWorkspace?.id],
      })
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Project details updated")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to update project")
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      return axiosInstance.delete(`/projects/${projectId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", activeWorkspace?.id],
      })
      toast.success("Project deleted successfully")
      router.push(`/${workspaceSlug}/projects`)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete project")
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
      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Sliders className="h-5 w-5 text-primary" /> General Settings
        </h3>
        <p className="mt-1 text-xs">
          Configure name, descriptions, visual branding, or project lifecycle
          status.
        </p>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Project Identity
            </CardTitle>
            <CardDescription className="text-xs">
              Change the primary name, description, and icon of this workspace
              project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Project Name</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium">
                Project Brand Icon
              </label>
              <div className="flex w-fit items-center gap-4 rounded-lg border p-3">
                <IconPicker
                  value={
                    icon instanceof File
                      ? URL.createObjectURL(icon)
                      : (icon as string | null)
                  }
                  onChange={(val) => setIcon(val)}
                />
                <div className="text-[10px]">
                  <p className="font-semibold">Select Emoji / Graphic</p>
                  <p className="mt-0.5">
                    Helps identify this project at a glance.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t pt-2">
              <Button
                disabled={!title.trim() || updateProjectMutation.isPending}
                onClick={() =>
                  updateProjectMutation.mutate({
                    title,
                    description,
                    icon,
                  })
                }
                variant="default"
              >
                {updateProjectMutation.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-rose-400">
              <AlertTriangle className="h-4.5 w-4.5" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-xs">
              Actions that are destructive and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5 text-xs">
                <p className="font-semibold">Delete this Project</p>
                <p className="max-w-sm">
                  Permanently deletes tasks, secrets vault, custom fields, slack
                  configs, and associated drive files.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    confirm(
                      "Are you absolutely sure you want to delete this project? This will permanently delete its keys vault, members, and uploaded files."
                    )
                  ) {
                    deleteProjectMutation.mutate()
                  }
                }}
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete Project
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
