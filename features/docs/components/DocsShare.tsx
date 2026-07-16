"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePermissions } from "@/hooks/use-permissions"
import { axiosInstance } from "@/lib/axios"
import {
  Delete02FreeIcons,
  SentIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useDocs } from "../hooks/useDocs"

const resolveAvatarUrl = (
  avatarUrl: string | null | undefined
): string | undefined => {
  if (!avatarUrl) return undefined
  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://") ||
    avatarUrl.startsWith("blob:")
  ) {
    return avatarUrl
  }
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api.veylo.com:4000/api/v1"
    const origin = new URL(apiUrl).origin
    const relativePath = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`
    return `${origin}${relativePath}`
  } catch (error) {
    return avatarUrl
  }
}

interface DocsShareProps {
  projectId: string
  docId: string
  docTitle: string
}

interface MemberUser {
  id: string
  name: string
  email: string
  image: string | null
}

interface ProjectMemberResponse {
  id: string
  userId: string
  user: MemberUser
}

export function DocsShare({ projectId, docId, docTitle }: DocsShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { hasPermission } = usePermissions()
  const canManagePerms = hasPermission("project-doc:manage-permissions")

  const { useDocPermissionsQuery, updatePermission, deletePermission } =
    useDocs(projectId)

  const { data: docPermissions = [], isLoading: isPermsLoading } =
    useDocPermissionsQuery(docId)

  // Fetch project members to invite
  const { data: projectMembers = [] } = useQuery<ProjectMemberResponse[]>({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/members`)
      return response.data.data
    },
    enabled: isOpen && !!projectId,
  })

  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<string>("view")

  const handleAddCollaborator = async () => {
    if (!selectedUserId) return
    await updatePermission({
      docId,
      userId: selectedUserId,
      permission: selectedRole,
    })
    setSelectedUserId("")
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    await updatePermission({
      docId,
      userId,
      permission: role,
    })
  }

  const handleRemoveCollaborator = async (userId: string) => {
    await deletePermission({
      docId,
      targetUserId: userId,
    })
  }

  // Filter out members who already have custom permissions
  const availableMembers = projectMembers.filter(
    (m) => !docPermissions.some((p) => p.userId === m.userId)
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={SentIcon} size={26} strokeWidth={2} />
                </Button>
              }
            />
          }
        />
        <TooltipContent side="top">Share Document</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Manage who can view, comment, or edit &ldquo;{docTitle}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        {canManagePerms ? (
          <div className="space-y-4 py-4">
            {/* Add Collaborator section */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={selectedUserId}
                onValueChange={(val) => setSelectedUserId(val || "")}
              >
                <SelectTrigger className="flex-1 text-xs">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          {resolveAvatarUrl(m.user.image) && (
                            <AvatarImage src={resolveAvatarUrl(m.user.image)} />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {m.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{m.user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {availableMembers.length === 0 && (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      No more members to add
                    </div>
                  )}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val || "view")}
                >
                  <SelectTrigger className="w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can View</SelectItem>
                    <SelectItem value="comment">Can Comment</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAddCollaborator}
                  disabled={!selectedUserId}
                  size="sm"
                  className="px-3"
                >
                  <HugeiconsIcon
                    icon={UserAdd01Icon}
                    className="mr-1"
                    size={16}
                  />{" "}
                  Add
                </Button>
              </div>
            </div>

            {/* Current Permissions list */}
            <div className="space-y-2">
              <span className="text-2xs font-bold tracking-wider text-muted-foreground uppercase">
                Collaborators with Access
              </span>
              <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                {docPermissions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Only workspace/project administrators have access.
                  </div>
                ) : (
                  docPermissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {resolveAvatarUrl(perm.user.image) && (
                            <AvatarImage
                              src={resolveAvatarUrl(perm.user.image)}
                            />
                          )}
                          <AvatarFallback className="text-xs">
                            {perm.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">
                            {perm.user.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={perm.permission}
                          onValueChange={(val) =>
                            handleUpdateRole(perm.userId, val || "view")
                          }
                        >
                          <SelectTrigger className="h-7 w-28 text-2xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">Can View</SelectItem>
                            <SelectItem value="comment">Can Comment</SelectItem>
                            <SelectItem value="edit">Can Edit</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCollaborator(perm.userId)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        >
                          <HugeiconsIcon icon={Delete02FreeIcons} size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground">
            You do not have permission to manage document sharing.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
