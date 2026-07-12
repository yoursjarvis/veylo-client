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
  Share01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useDocs } from "../hooks/useDocs"

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

  const {
    useDocPermissionsQuery,
    updatePermission,
    deletePermission,
  } = useDocs(projectId)

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
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg text-xs font-semibold h-8 gap-2 border border-input bg-transparent px-3 hover:bg-accent hover:text-accent-foreground transition-colors">
        <HugeiconsIcon icon={Share01Icon} className="h-4 w-4" /> Share
      </DialogTrigger>
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
              <Select value={selectedUserId} onValueChange={(val) => setSelectedUserId(val || "")}>
                <SelectTrigger className="flex-1 text-xs">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={m.user.image || ""} />
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
                <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val || "view")}>
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
                  <HugeiconsIcon icon={UserAdd01Icon} className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Current Permissions list */}
            <div className="space-y-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                Collaborators with Access
              </span>
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {docPermissions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Only workspace/project administrators have access.
                  </div>
                ) : (
                  docPermissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={perm.user.image || ""} />
                          <AvatarFallback className="text-xs">
                            {perm.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {perm.user.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={perm.permission}
                          onValueChange={(val) => handleUpdateRole(perm.userId, val || "view")}
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
                          <HugeiconsIcon icon={Delete02FreeIcons} className="h-4 w-4" />
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
