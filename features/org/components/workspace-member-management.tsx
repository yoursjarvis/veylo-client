"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { axiosInstance } from "@/lib/axios"
import {
  Delete02Icon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

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

interface OrgMember {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export function WorkspaceMemberManagement({
  workspaceId,
}: {
  workspaceId: string
}) {
  const queryClient = useQueryClient()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // Fetch Workspace Details
  const { data: workspaces } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["workspaces"],
  })
  const workspace = workspaces?.find((w) => w.id === workspaceId)

  // Fetch Workspace Members
  const { data: members, isLoading: isLoadingMembers } = useQuery<
    WorkspaceMember[]
  >({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/workspaces/${workspaceId}/members`
      )
      return response.data.data
    },
  })

  // Fetch Organization Members for invitation
  const { data: orgMembersData, isLoading: isLoadingOrgMembers } =
    useQuery<{ members: OrgMember[] }>({
      queryKey: ["org-members", searchTerm],
      queryFn: async () => {
        const response = await axiosInstance.get(`/org/members`, {
          params: { search: searchTerm, limit: 50 },
        })
        return response.data.data
      },
      enabled: isInviteModalOpen,
    })

  const inviteMembers = useMutation({
    mutationFn: async (userIds: string[]) => {
      await axiosInstance.post(`/workspaces/${workspaceId}/members`, {
        userIds,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      })
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      setIsInviteModalOpen(false)
      setSelectedUserIds([])
      toast.success("Members added successfully")
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to add members")
    },
  })

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      await axiosInstance.delete(`/workspaces/${workspaceId}/members/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      })
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      toast.success("Member removed successfully")
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to remove member")
    },
  })

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  if (isLoadingMembers) return <div>Loading members...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Members - {workspace?.name}</h2>
          <p className="text-sm text-muted-foreground">
            Manage who has access to this workspace.
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
          <HugeiconsIcon icon={PlusSignIcon} size={18} />
          Add Member
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <div className="divide-y">
          {members?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No members in this workspace yet.
            </div>
          ) : (
            members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user.image || ""} />
                    <AvatarFallback>{member.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize">
                    {member.role}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Remove this member from the workspace?")) {
                        removeMember.mutate(member.userId)
                      }
                    }}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
            <DialogDescription>
              Select members from your organization to add to this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search members..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[250px] rounded-md border p-4">
              <div className="space-y-4">
                {isLoadingOrgMembers ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : orgMembersData?.members?.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No members found
                  </div>
                ) : (
                  orgMembersData?.members?.map((member: OrgMember) => {
                    const isAlreadyInWorkspace = members?.some(
                      (m) => m.userId === member.user.id
                    )
                    return (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={`user-${member.user.id}`}
                          checked={selectedUserIds.includes(member.user.id)}
                          onCheckedChange={() =>
                            toggleUserSelection(member.user.id)
                          }
                          disabled={isAlreadyInWorkspace}
                        />
                        <Label
                          htmlFor={`user-${member.user.id}`}
                          className="flex flex-1 cursor-pointer items-center gap-3"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.image || ""} />
                            <AvatarFallback>
                              {member.user.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {member.user.name}
                              {isAlreadyInWorkspace && (
                                <span className="ml-2 text-[10px] text-muted-foreground">
                                  (In Workspace)
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {member.user.email}
                            </span>
                          </div>
                        </Label>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => inviteMembers.mutate(selectedUserIds)}
              disabled={selectedUserIds.length === 0 || inviteMembers.isPending}
            >
              {inviteMembers.isPending
                ? "Adding..."
                : `Add ${selectedUserIds.length} Member${selectedUserIds.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
