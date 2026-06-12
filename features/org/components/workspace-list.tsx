"use client"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Briefcase02Icon,
  Delete02Icon,
  PlusSignIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

export function WorkspaceList() {
  const { workspaces, isLoading } = useWorkspaceContext()
  const { createWorkspace } = useWorkspaces() // createWorkspace doesn't need to be in context
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({ name: "", slug: "" })
  const queryClient = useQueryClient()

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createWorkspace.mutateAsync(newWorkspace)
      setIsCreateModalOpen(false)
      setNewWorkspace({ name: "", slug: "" })
      toast.success("Workspace created successfully")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create workspace")
    }
  }

  const deleteWorkspace = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/workspaces/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      toast.success("Workspace deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete workspace")
    },
  })

  if (isLoading) {
    return <div>Loading workspaces...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Workspaces</h2>
          <p className="text-sm text-muted-foreground">
            Manage your organization's workspaces and their members.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <HugeiconsIcon icon={PlusSignIcon} size={18} />
          Create Workspace
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces?.map((workspace) => (
          <Card key={workspace.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {workspace.name}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Briefcase02Icon} size={18} />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Slug:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {workspace.slug}
                </code>
              </CardDescription>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HugeiconsIcon icon={UserMultipleIcon} size={14} />
                <span>{workspace._count?.members || 0} Members</span>
              </div>
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  render={<Link href={`/members/workspaces/${workspace.id}`} />}
                >
                  <HugeiconsIcon icon={UserMultipleIcon} size={14} />
                  Members
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (
                      confirm("Are you sure you want to delete this workspace?")
                    ) {
                      deleteWorkspace.mutate(workspace.id)
                    }
                  }}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Workspace Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <form onSubmit={handleCreateWorkspace}>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription>
                Add a new workspace to your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
    </div>
  )
}
