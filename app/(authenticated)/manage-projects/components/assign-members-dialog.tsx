import { axiosInstance } from "@/lib/axios"
import { useMutation, useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { Search02Icon, UserMultipleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Project, ProjectMember, WorkspaceMember } from "../types"

interface AssignMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
}

export function AssignMembersDialog({
  open,
  onOpenChange,
  project,
}: AssignMembersDialogProps) {
  const [memberSearchQuery, setMemberSearchQuery] = useState("")

  // Fetch project members
  const { data: projectMembers = [], refetch: refetchProjectMembers } =
    useQuery<ProjectMember[]>({
      queryKey: ["project-members-list", project?.id],
      queryFn: async () => {
        if (!project) return []
        const response = await axiosInstance.get(
          `/projects/${project.id}/members`
        )
        return response.data.data
      },
      enabled: !!project && open,
    })

  // Fetch workspace members for the project's workspace
  const { data: workspaceMembers = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ["workspace-members-list", project?.workspaceId],
    queryFn: async () => {
      if (!project) return []
      const response = await axiosInstance.get(
        `/workspaces/${project.workspaceId}/members`
      )
      return response.data.data
    },
    enabled: !!project && open,
  })

  // Filter workspace members for member assignment
  const filteredWorkspaceMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return workspaceMembers
    const query = memberSearchQuery.toLowerCase()
    return workspaceMembers.filter(
      (m) =>
        m.user.name.toLowerCase().includes(query) ||
        m.user.email.toLowerCase().includes(query)
    )
  }, [workspaceMembers, memberSearchQuery])

  // Member Assignment mutations
  const assignMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!project) return
      return axiosInstance.post(`/projects/${project.id}/members`, {
        userIds: [userId],
      })
    },
    onSuccess: () => {
      refetchProjectMembers()
      toast.success("Member assigned to project")
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to assign member")
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!project) return
      return axiosInstance.delete(`/projects/${project.id}/members/${userId}`)
    },
    onSuccess: () => {
      refetchProjectMembers()
      toast.success("Member removed from project")
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to remove member")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border/50 bg-card p-6 text-foreground shadow-lg sm:max-w-150">
        <DialogHeader className="space-y-1.5 border-b border-border/50 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <HugeiconsIcon
              icon={UserMultipleIcon}
              className="h-5 w-5 animate-pulse text-primary"
            />
            Assign Members
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Assign users from{" "}
            <Badge
              variant="secondary"
              className="px-1.5 py-0.5 text-2xs font-semibold"
            >
              {project?.workspaceName}
            </Badge>{" "}
            workspace to{" "}
            <span className="font-semibold text-foreground">
              {project?.title}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <HugeiconsIcon
              icon={Search02Icon}
              className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
              placeholder="Search workspace members..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>

          <div className="max-h-60 divide-y divide-border overflow-y-auto rounded-lg border bg-background p-1">
            {filteredWorkspaceMembers.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No members found
              </p>
            ) : (
              filteredWorkspaceMembers.map((member) => {
                const isAssigned = projectMembers.some(
                  (pm) => pm.userId === member.userId
                )

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/50 text-xs">
                        {member.user.image ? (
                          <Image
                            src={(() => {
                              const img = member.user.image
                              if (
                                img.startsWith("http") ||
                                img.startsWith("blob:") ||
                                img.startsWith("data:")
                              )
                                return img
                              const backendBase = process.env
                                .NEXT_PUBLIC_API_URL
                                ? new URL(process.env.NEXT_PUBLIC_API_URL)
                                    .origin
                                : "https://api.veylo.com:4000"
                              return `${backendBase}${img}`
                            })()}
                            alt={member.user.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span>{member.user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-foreground">
                          {member.user.name}
                        </span>
                        <span className="text-2xs text-muted-foreground">
                          {member.user.email}
                        </span>
                      </div>
                    </div>

                    {isAssigned ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-2xs font-bold text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          removeMemberMutation.mutate(member.userId)
                        }
                        disabled={removeMemberMutation.isPending}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-2xs font-bold hover:bg-primary/5"
                        onClick={() =>
                          assignMemberMutation.mutate(member.userId)
                        }
                        disabled={assignMemberMutation.isPending}
                      >
                        Assign
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
        <DialogFooter className="border-t border-border/50 pt-4">
          <Button
            variant="default"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
