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
import { useState } from "react"
import { toast } from "sonner"

export function CreateWorkspaceModal() {
  const { isCreateModalOpen, setIsCreateModalOpen } = useWorkspaceContext()
  const { createWorkspace } = useWorkspaces()
  const [newWorkspace, setNewWorkspace] = useState<{ name: string; slug: string; icon?: string | File | null }>({ name: "", slug: "" })

  const uploadIcon = async (workspaceId: string, file: File) => {
    const formData = new FormData()
    formData.append("icon", file)
    const response = await axiosInstance.post(`/media/workspace/${workspaceId}/icon`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.data.url
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isFile = newWorkspace.icon instanceof File
      const workspace = await createWorkspace.mutateAsync({
        name: newWorkspace.name,
        slug: newWorkspace.slug,
        icon: !isFile ? (newWorkspace.icon as string) : undefined,
      })

      if (isFile && newWorkspace.icon) {
        await uploadIcon(workspace.id, newWorkspace.icon as File)
      }

      setIsCreateModalOpen(false)
      setNewWorkspace({ name: "", slug: "" })
      toast.success("Workspace created successfully")
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to create workspace")
    }
  }

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent>
        <form onSubmit={handleCreateWorkspace}>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Add a new workspace to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 py-4">
            <div className="pt-6">
              <IconPicker 
                value={newWorkspace.icon instanceof File ? URL.createObjectURL(newWorkspace.icon) : newWorkspace.icon} 
                onChange={(val) => setNewWorkspace({ ...newWorkspace, icon: val })} 
              />
            </div>
            <div className="grid flex-1 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="Marketing, Engineering, etc."
                  value={newWorkspace.name}
                  onChange={(e) => {
                    setNewWorkspace({
                      ...newWorkspace,
                      name: e.target.value,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, ""),
                    })
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Workspace Slug</Label>
                <Input
                  id="slug"
                  placeholder="marketing"
                  value={newWorkspace.slug}
                  onChange={(e) =>
                    setNewWorkspace({ ...newWorkspace, slug: e.target.value })
                  }
                  required
                />
              </div>
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
