import type { FileWithPreview } from "@/hooks/use-file-upload"
import {
  LaptopProgrammingIcon,
  Logout02Icon,
  SecurityPasswordIcon,
} from "@hugeicons/core-free-icons"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Pattern as AvatarUpload } from "@/components/reui/avatar-upload"
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
  useUpdateMemberProfile,
} from "../api/use-member-actions"

export interface MemberProps {
  user: {
    id: string
    name?: string | null
    firstName?: string | null
    lastName?: string | null
    email: string
    image?: string | null
  }
}

interface SessionData {
  id: string
  userAgent?: string
  isCurrent?: boolean
  ipAddress?: string
  lastActiveAt?: string
  createdAt: string
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
    hasPermission("member:change-password") || hasPermission("*")

  const [activeTab, setActiveTab] = useState("profile")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  const { data: sessions, isLoading: sessionsLoading } = useMemberSessions(
    member?.user?.id as string
  )
  const revokeSession = useRevokeSpecificSession(member?.user?.id as string)
  const changePassword = useChangeMemberPassword(member?.user?.id as string)
  const updatePhoto = useUpdateMemberPhoto(member?.user?.id as string)
  const updateProfile = useUpdateMemberProfile(member?.user?.id as string)

  useEffect(() => {
    if (member) {
      setTimeout(() => {
        setFirstName(
          member.user.firstName || member.user.name?.split(" ")[0] || ""
        )
        setLastName(
          member.user.lastName ||
            member.user.name?.split(" ").slice(1).join(" ") ||
            ""
        )
        setEmail(member.user.email || "")
      }, 0)
    }
  }, [member])

  const handlePhotoUpload = (fileData: FileWithPreview | null) => {
    if (!fileData || !(fileData.file instanceof File)) return

    toast.promise(updatePhoto.mutateAsync(fileData.file), {
      loading: "Uploading photo...",
      success: "Profile photo updated successfully!",
      error: "Failed to update profile photo",
    })
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile.mutateAsync({
        firstName,
        lastName,
        email,
      })
      toast.success("Profile updated successfully")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message || "Failed to update profile")
    }
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
    } catch {
      toast.error("Failed to revoke session")
    }
  }

  if (!member) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden border-border/50 p-0 shadow-lg sm:max-w-160">
        <DialogHeader className="px-8 pt-8 pb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Edit Member
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border/40 px-8">
            <TabsList className="flex h-auto w-full justify-start gap-8 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="profile"
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-1 pt-2 pb-4 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                disabled={!canChangePassword}
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-1 pt-2 pb-4 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground disabled:opacity-30 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Security
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                disabled={!canUpdate}
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-1 pt-2 pb-4 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground disabled:opacity-30 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Sessions
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-8">
            <TabsContent value="profile" className="mt-0">
              <div className="flex flex-col gap-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-6 rounded-xl border border-border/50 bg-muted/20 p-5 transition-colors hover:bg-muted/30">
                  <AvatarUpload
                    defaultAvatar={member?.user?.image || undefined}
                    onFileChange={handlePhotoUpload}
                    className="flex-row items-center justify-start gap-6"
                  />
                </div>

                {/* Info Section */}
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-muted-foreground">
                        First Name
                      </Label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                        disabled={!canUpdate}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-muted-foreground">Last Name</Label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last Name"
                        disabled={!canUpdate}
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-muted-foreground">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      disabled={!canUpdate}
                    />
                  </div>

                  {canUpdate && (
                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="transition-all"
                      >
                        {updateProfile.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="mb-2 flex items-start gap-4 rounded-xl border border-border/50 bg-muted/20 p-5">
                  <div className="rounded-lg border border-border/50 bg-background/50 p-2.5 shadow-sm">
                    <HugeiconsIcon
                      icon={SecurityPasswordIcon}
                      className="h-5 w-5 text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm leading-none font-medium">
                      Change Password
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Force a password update for this user.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label className="text-muted-foreground">
                      New Password
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-muted-foreground">
                      Confirm Password
                    </Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={
                      changePassword.isPending || !password || !confirmPassword
                    }
                    className="transition-all"
                  >
                    {changePassword.isPending
                      ? "Updating..."
                      : "Update Password"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="sessions" className="mt-0 space-y-6">
              <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-muted/20 p-5">
                <div className="rounded-lg border border-border/50 bg-background/50 p-2.5 shadow-sm">
                  <HugeiconsIcon
                    icon={LaptopProgrammingIcon}
                    className="h-5 w-5 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm leading-none font-medium">
                    Active Sessions
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Manage and revoke active sessions.
                  </p>
                </div>
              </div>

              {sessionsLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading sessions...
                </div>
              ) : sessions?.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No active sessions found.
                </div>
              ) : (
                <div className="max-h-75 space-y-3 overflow-y-auto pr-2">
                  {sessions?.map((session: SessionData) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-background p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {session.userAgent || "Unknown Device"}
                          </p>
                          {session.isCurrent && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-medium text-primary">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          IP: {session.ipAddress || "Unknown"} • Last active:{" "}
                          {new Date(
                            session.lastActiveAt || session.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRevokeSession(session.id)}
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
