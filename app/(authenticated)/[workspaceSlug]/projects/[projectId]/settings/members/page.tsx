"use client"

import React, { useState, useEffect } from "react"
import { useProject } from "../../layout"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Users, UserPlus, Trash } from "lucide-react"

interface WorkspaceMember {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export default function ProjectMembersPage() {
  const { projectId, selectedProject, isWorkspaceAdmin } = useProject()
  const { activeWorkspace } = useWorkspaceContext()
  const queryClient = useQueryClient()

  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // Sync selected members when project details load
  useEffect(() => {
    if (selectedProject?.members) {
      const memberIds =
        selectedProject.members.map((m: LooseRecord) => m.userId) || []
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing project members to state
      setSelectedMembers(memberIds)
    }
  }, [selectedProject])

  const { data: workspaceMembers, isLoading: isWorkspaceMembersLoading } =
    useQuery<WorkspaceMember[]>({
      queryKey: ["workspace-members", activeWorkspace?.id],
      queryFn: async () => {
        if (!activeWorkspace) return []
        const response = await axiosInstance.get(
          `/workspaces/${activeWorkspace.id}/members`
        )
        return response.data.data
      },
      enabled: !!activeWorkspace,
    })

  const manageMembersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      return axiosInstance.post(`/projects/${projectId}/members`, { userIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Project members updated")
      setIsManageMembersOpen(false)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to assign members")
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return axiosInstance.delete(`/projects/${projectId}/members/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Member removed from project")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to remove member")
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
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Users className="h-5 w-5" /> Members & Roles
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage permissions, invite workspace teammates, and delegate project
            ownership.
          </p>
        </div>
        <Button
          onClick={() => setIsManageMembersOpen(true)}
          className="h-9 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="mr-1.5 h-4 w-4" /> Manage Members
        </Button>
      </div>

      <div className="max-w-2xl">
        <Card className="shadow-md border border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Assigned Project Team
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              These members are assigned to work on the current project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProject?.members &&
            selectedProject.members.length === 0 ? (
              <div className="py-6 text-center text-xs italic text-muted-foreground">
                No assigned members. Click &quot;Manage Members&quot; above to
                add teammate accounts.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {selectedProject?.members?.map((member: ProjectMember) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3.5 text-xs first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={member.user.image || ""} />
                        <AvatarFallback className="text-xs uppercase bg-muted text-muted-foreground">
                          {member.user.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{member.user.name}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase">
                        {member.role || "Member"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive h-8 w-8 text-muted-foreground hover:bg-destructive/10"
                        onClick={() => {
                          if (
                            confirm(
                              `Remove ${member.user.name} from this project?`
                            )
                          ) {
                            removeMemberMutation.mutate(member.userId)
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manage Members Dialog */}
      <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
        <DialogContent className="p-6 sm:max-w-[450px] bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Manage Project Members
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign members from this workspace to the project. Only users
              added to the workspace are listed.
            </DialogDescription>
          </DialogHeader>
 
          <div className="max-h-[300px] space-y-2.5 overflow-y-auto py-4">
            {isWorkspaceMembersLoading ? (
              <div className="flex h-20 items-center justify-center">
                <Spinner className="text-primary" />
              </div>
            ) : workspaceMembers?.length === 0 ? (
              <p className="text-center text-xs italic text-muted-foreground">
                No workspace members found.
              </p>
            ) : (
              workspaceMembers?.map((wMember) => {
                const isChecked = selectedMembers.includes(wMember.userId)
                return (
                  <div
                    key={wMember.id}
                    className="flex items-center justify-between p-3 transition-colors border border-transparent hover:border-border hover:bg-muted/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={wMember.user.image || ""} />
                        <AvatarFallback className="text-xs uppercase bg-muted text-muted-foreground">
                          {wMember.user.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">
                          {wMember.user.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {wMember.user.email}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      className="h-4 w-4 rounded border-input bg-background text-primary accent-primary focus:ring-ring"
                      onChange={() => {
                        if (isChecked) {
                          setSelectedMembers((prev) =>
                            prev.filter((id) => id !== wMember.userId)
                          )
                        } else {
                          setSelectedMembers((prev) => [
                            ...prev,
                            wMember.userId,
                          ])
                        }
                      }}
                    />
                  </div>
                )
              })
            )}
          </div>
 
          <DialogFooter className="border-t border-border flex gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsManageMembersOpen(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => manageMembersMutation.mutate(selectedMembers)}
              disabled={manageMembersMutation.isPending}
              className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {manageMembersMutation.isPending
                ? "Saving..."
                : "Save Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
