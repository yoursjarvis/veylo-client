"use client"
import { ProjectMember } from "@/types/models"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { IconStack } from "@/components/reui/icon-stack"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { axiosInstance } from "@/lib/axios"
import { AddTeam02Icon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash, UserPlus, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useProject } from "../../layout"

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
        selectedProject.members.map((m: ProjectMember) => m.userId) || []
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
        {selectedProject?.members && selectedProject.members.length !== 0 && (
          <Button
            onClick={() => setIsManageMembersOpen(true)}
            className="h-9 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus className="mr-1.5 h-4 w-4" /> Manage Members
          </Button>
        )}
      </div>

      <div className="max-w-2xl">
        <Card className="border border-border shadow-md">
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
              <Card className="m-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card px-4 py-16 text-center">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <IconStack
                        aria-hidden="true"
                        className="h-24 w-22 text-primary"
                      >
                        <HugeiconsIcon
                          icon={UserGroupIcon}
                          className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                        />
                      </IconStack>
                    </EmptyMedia>
                    <EmptyTitle>Ready to add Teammates?</EmptyTitle>
                    <EmptyDescription>
                      Click &quot;Add Members&quot; belown to add teammates.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline-default"
                      onClick={() => setIsManageMembersOpen(true)}
                      className="h-9 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <HugeiconsIcon
                        icon={AddTeam02Icon}
                        className="mr-1.5 h-4 w-4"
                      />{" "}
                      Add Members
                    </Button>
                  </EmptyContent>
                </Empty>
              </Card>
            ) : (
              <div className="divide-y divide-border">
                {selectedProject?.members?.map((member: ProjectMember) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3.5 text-xs first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={member.user?.image || ""} />
                        <AvatarFallback className="bg-muted text-xs text-muted-foreground uppercase">
                          {member.user?.name?.slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">
                          {member.user?.name}
                        </p>
                        <p className="mt-0.5 text-2xs text-muted-foreground">
                          {member.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-2xs font-semibold tracking-wider text-secondary-foreground uppercase">
                        {member.role || "Member"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (
                            confirm(
                              `Remove ${member.user?.name} from this project?`
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
        <DialogContent className="border border-border bg-card p-6 text-foreground sm:max-w-112.5">
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
              <div className="flex w-full flex-col space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
                <div className="rounded-md border border-border">
                  <div className="flex gap-4 border-b border-border p-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex gap-4 border-b border-border p-4 last:border-0"
                    >
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ) : workspaceMembers?.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground italic">
                No workspace members found.
              </p>
            ) : (
              workspaceMembers?.map((wMember) => {
                const isChecked = selectedMembers.includes(wMember.userId)
                return (
                  <div
                    key={wMember.id}
                    className="flex items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={wMember.user.image || ""} />
                        <AvatarFallback className="bg-muted text-xs text-muted-foreground uppercase">
                          {wMember.user.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">
                          {wMember.user.name}
                        </p>
                        <p className="mt-0.5 text-2xs text-muted-foreground">
                          {wMember.user.email}
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => {
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

          <DialogFooter className="flex gap-2 border-t border-border pt-4">
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
