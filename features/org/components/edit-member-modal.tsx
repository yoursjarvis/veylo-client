import {
  Camera01Icon,
  LaptopProgrammingIcon,
  Logout02Icon,
  SecurityPasswordIcon,
  UserEdit01Icon,
} from "@hugeicons/core-free-icons"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePermissions } from "@/hooks/use-permissions"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  useChangeMemberPassword,
  useMemberSessions,
  useRevokeSpecificSession,
  useUpdateMemberPhoto,
} from "../api/use-member-actions"

export interface MemberProps {
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface EditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: MemberProps | null | undefined
}

export function EditMemberModal({
  isOpen,
  onClose,
  member,
}: EditMemberModalProps) {
  const { hasPermission } = usePermissions()

  const canUpdate =
    hasPermission("member:update") ||
    hasPermission("member:edit") ||
    hasPermission("*") // Or assuming organization owner
  const canChangePassword =
    hasPermission("member:change_password") || hasPermission("*")

  const [activeTab, setActiveTab] = useState("profile")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: sessions, isLoading: sessionsLoading } = useMemberSessions(
    member?.user?.id as string
  )
  const revokeSession = useRevokeSpecificSession(member?.user?.id as string)
  const changePassword = useChangeMemberPassword(member?.user?.id as string)
  const updatePhoto = useUpdateMemberPhoto(member?.user?.id as string)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    toast.promise(updatePhoto.mutateAsync(file), {
      loading: "Uploading photo...",
      success: "Profile photo updated successfully!",
      error: "Failed to update profile photo",
    })
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    try {
      await changePassword.mutateAsync(password)
      toast.success("Password changed successfully")
      setPassword("")
      setConfirmPassword("")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message || "Failed to change password")
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId)
      toast.success("Session revoked successfully")
    } catch (error: unknown) {
      toast.error("Failed to revoke session")
    }
  }

  if (!member) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-125">
        <DialogHeader className="border-b border-border bg-card px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <HugeiconsIcon
              icon={UserEdit01Icon}
              className="h-5 w-5 text-muted-foreground"
            />
            Edit Member
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border bg-muted/20 px-6 pt-4">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-4 rounded-none border-b-0 bg-transparent p-0">
              <TabsTrigger
                value="profile"
                className="rounded-none border-b-2 border-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                disabled={!canChangePassword}
                className="rounded-none border-b-2 border-transparent px-0 pb-3 disabled:opacity-30 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Security
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                disabled={!canUpdate}
                className="rounded-none border-b-2 border-transparent px-0 pb-3 disabled:opacity-30 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Sessions
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="profile" className="mt-0 space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="group relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                    <AvatarImage src={member?.user?.image || ""} />
                    <AvatarFallback className="text-2xl">
                      {member?.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {canUpdate && (
                    <>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-full bg-black/50 text-white opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100"
                      >
                        <HugeiconsIcon
                          icon={Camera01Icon}
                          className="h-6 w-6"
                        />
                        <span className="text-[10px] font-medium tracking-wider uppercase">
                          Change
                        </span>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                <div className="space-y-1 text-center">
                  <h3 className="text-lg font-semibold">
                    {member?.user?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {member?.user?.email}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
                  <div className="rounded-md border border-border/50 bg-background p-2 shadow-sm">
                    <HugeiconsIcon
                      icon={SecurityPasswordIcon}
                      className="h-5 w-5 text-primary"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Change Password</h4>
                    <p className="text-xs text-muted-foreground">
                      Force a password update for this user.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={
                      changePassword.isPending || !password || !confirmPassword
                    }
                  >
                    {changePassword.isPending
                      ? "Updating..."
                      : "Update Password"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="sessions" className="mt-0 space-y-4">
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
                <div className="rounded-md border border-border/50 bg-background p-2 shadow-sm">
                  <HugeiconsIcon
                    icon={LaptopProgrammingIcon}
                    className="h-5 w-5 text-primary"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Active Sessions</h4>
                  <p className="text-xs text-muted-foreground">
                    Manage and revoke active sessions.
                  </p>
                </div>
              </div>

              {sessionsLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading sessions...
                </div>
              ) : sessions?.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No active sessions found.
                </div>
              ) : (
                <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
                  {sessions?.map((session: Record<string, unknown>) => (
                    <div
                      key={session.id as string}
                      className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {(session.userAgent as string) || "Unknown Device"}
                          </p>
                          {session.isCurrent && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          IP: {(session.ipAddress as string) || "Unknown"} •
                          Last active:{" "}
                          {new Date(
                            (session.lastActiveAt ||
                              session.createdAt) as string
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            handleRevokeSession(session.id as string)
                          }
                          disabled={revokeSession.isPending}
                        >
                          <HugeiconsIcon
                            icon={Logout02Icon}
                            className="mr-2 h-4 w-4"
                          />
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
