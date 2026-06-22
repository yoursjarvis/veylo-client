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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWorkspaces } from "@/hooks/use-workspaces"
import { axiosInstance } from "@/lib/axios"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Briefcase02Icon,
  Delete02Icon,
  Edit01Icon,
  PlusSignIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { IconPicker } from "@/components/shared/icon-picker"
import { getThumbUrl } from "@/lib/utils"

import { authClient } from "@/lib/auth-client"

export function WorkspaceList() {
  const { workspaces, isLoading, setIsCreateModalOpen } = useWorkspaceContext()
  const { updateWorkspace, deleteWorkspace } = useWorkspaces()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<{ id: string; name: string; slug: string; icon?: string | File | null } | null>(null)

  const { data: activeMember } = authClient.useActiveMember()
  const userRole = activeMember?.role
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin"

  const uploadIcon = async (workspaceId: string, file: File) => {
    const formData = new FormData()
    formData.append("icon", file)
    const response = await axiosInstance.post(`/media/workspace/${workspaceId}/icon`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.data.url
  }

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWorkspace) return
    try {
      const isFile = editingWorkspace.icon instanceof File
      
      if (isFile && editingWorkspace.icon) {
        await uploadIcon(editingWorkspace.id, editingWorkspace.icon as File)
      }

      await updateWorkspace.mutateAsync({
        id: editingWorkspace.id,
        data: { 
          name: editingWorkspace.name, 
          slug: editingWorkspace.slug,
          icon: !isFile ? (editingWorkspace.icon as string) : undefined
        },
      })
      
      setIsEditModalOpen(false)
      setEditingWorkspace(null)
      toast.success("Workspace updated successfully")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update workspace")
    }
  }

  const handleDeleteWorkspace = async (id: string) => {
    try {
      await deleteWorkspace.mutateAsync(id)
      toast.success("Workspace deleted successfully")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete workspace")
    }
  }

  const renderIcon = (icon?: string | null, size = 18) => {
    if (!icon) return <HugeiconsIcon icon={Briefcase02Icon} size={size} />
    if (icon.startsWith("http") || icon.startsWith("/") || icon.startsWith("blob:")) {
      const thumbUrl = icon.startsWith("blob:") ? icon : (getThumbUrl(icon) || icon)
      return <img src={thumbUrl} alt="Workspace Icon" className="h-full w-full object-cover rounded-[inherit]" />
    }
    return <span className="leading-none" style={{ fontSize: size }}>{icon}</span>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-4 h-4 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="mt-6 flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (workspaces?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 p-12 text-center shadow-xs backdrop-blur-md dark:border-zinc-800">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon icon={Briefcase02Icon} size={32} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">No Workspaces Found</h2>
        
        {isOwnerOrAdmin ? (
          <>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              You are an administrator of this organization. Start by creating a workspace to organize your projects, team, and integrations.
            </p>
            <div className="mt-8">
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <HugeiconsIcon icon={PlusSignIcon} size={18} />
                Create Workspace
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              You haven't been assigned to any workspaces in this organization yet. Please ask your organization administrator or owner to add you to a workspace so you can get started.
            </p>
            <div className="mt-8 w-full max-w-md rounded-lg border bg-card/80 p-5 text-left dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next steps</p>
              <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                  <span>Contact your organization admin or owner (the person who invited you).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                  <span>Ask them to assign you to a workspace. They can do this via the workspace members settings.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                  <span>Once assigned, refresh this page to access your workspace dashboard.</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isOwnerOrAdmin && (
        <div className="flex items-center justify-end">
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <HugeiconsIcon icon={PlusSignIcon} size={18} />
            Create Workspace
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces?.map((workspace) => (
          <Card key={workspace.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {workspace.name}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {renderIcon(workspace.icon)}
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
              {isOwnerOrAdmin ? (
                <div className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    nativeButton={false}
                    render={<Link href={`/workspaces/${workspace.id}`} />}
                  >
                    <HugeiconsIcon icon={UserMultipleIcon} size={14} />
                    Members
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      setEditingWorkspace({
                        id: workspace.id,
                        name: workspace.name,
                        slug: workspace.slug,
                        icon: workspace.icon,
                      })
                      setIsEditModalOpen(true)
                    }}
                  >
                    <HugeiconsIcon icon={Edit01Icon} size={14} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:bg-destructive/10"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will soft-delete the workspace. You can restore it
                          later if needed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="mt-6">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-1"
                    nativeButton={false}
                    render={<Link href={`/${workspace.slug}/dashboard`} />}
                  >
                    Enter Workspace
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Workspace Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateWorkspace}>
            <DialogHeader>
              <DialogTitle>Edit Workspace</DialogTitle>
              <DialogDescription>
                Update the workspace details.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 py-4">
              <div className="pt-6">
                <IconPicker 
                  value={editingWorkspace?.icon instanceof File ? URL.createObjectURL(editingWorkspace.icon) : editingWorkspace?.icon} 
                  onChange={(val) => editingWorkspace && setEditingWorkspace({ ...editingWorkspace, icon: val })} 
                />
              </div>
              <div className="grid flex-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Workspace Name</Label>
                  <Input
                    id="edit-name"
                    value={editingWorkspace?.name || ""}
                    onChange={(e) => {
                      if (editingWorkspace) {
                        setEditingWorkspace({
                          ...editingWorkspace,
                          name: e.target.value,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)+/g, ""),
                        })
                      }
                    }}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-slug">Workspace Slug</Label>
                  <Input
                    id="edit-slug"
                    value={editingWorkspace?.slug || ""}
                    onChange={(e) => {
                      if (editingWorkspace) {
                        setEditingWorkspace({
                          ...editingWorkspace,
                          slug: e.target.value,
                        })
                      }
                    }}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateWorkspace.isPending}>
                {updateWorkspace.isPending ? "Updating..." : "Update Workspace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
