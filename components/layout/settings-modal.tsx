"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useLogout } from "@/features/auth/hooks/use-auth"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { AppearanceTab } from "./settings/appearance-tab"
import { NotificationsTab } from "./settings/notifications-tab"
import { OrganizationTab } from "./settings/organization-tab"
import { ProfileTab } from "./settings/profile-tab"
import { SecurityTab } from "./settings/security-tab"

import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import {
  Building03Icon,
  Logout01Icon,
  Notification01Icon,
  PaintBoardIcon,
  Shield01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"

type Tab =
  "profile" | "security" | "appearance" | "organization" | "notifications"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const logout = useLogout()
  const router = useRouter()

  const { data: activeOrg } = authClient.useActiveOrganization()

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
      toast.success("Logged out successfully")
      onOpenChange(false)
      router.push("/login")
    } catch {
      toast.error("Logout failed")
    }
  }

  const menuItems = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "security", label: "Sessions & Security", icon: Shield01Icon },
    { id: "notifications", label: "Notifications", icon: Notification01Icon },
    { id: "appearance", label: "Appearance", icon: PaintBoardIcon },
  ]

  if (activeOrg) {
    menuItems.splice(1, 0, {
      id: "organization",
      label: "Organization",
      icon: Building03Icon,
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-[650px] min-w-[50vw] gap-0 overflow-hidden p-0">
          <SidebarProvider className="flex h-full min-h-0 w-full overflow-hidden">
            <Sidebar
              collapsible="icon"
              className={cn(
                "hidden h-full flex-col border-r bg-sidebar md:flex",
                "*:data-[slot=sidebar-inner]:bg-background",
                "*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
                "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
              )}
            >
              <SidebarHeader className="h-14 justify-center overflow-hidden border-b px-2">
                <SidebarMenuButton className="pointer-events-none transition-opacity group-data-[collapsible=icon]:opacity-0">
                  <span className="px-2 text-lg font-semibold tracking-tight whitespace-nowrap text-foreground!">
                    Settings
                  </span>
                </SidebarMenuButton>
              </SidebarHeader>
              <SidebarContent>
                <div className="px-2 py-4">
                  <SidebarMenu>
                    {menuItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activeTab === item.id}
                          className="text-muted-foreground"
                          onClick={() => setActiveTab(item.id as Tab)}
                          tooltip={item.label}
                        >
                          <HugeiconsIcon
                            icon={item.icon}
                            size={18}
                            strokeWidth={2}
                          />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>
              </SidebarContent>

              <SidebarFooter className="gap-0 border-t p-0">
                <SidebarMenu className="p-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setShowLogoutConfirm(true)}
                      tooltip="Log out"
                    >
                      <HugeiconsIcon
                        icon={Logout01Icon}
                        size={18}
                        strokeWidth={2}
                      />
                      <span>Log out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>

            {/* Content Area */}
            <div className="bg-sidebar-inset flex min-h-0 min-w-0 flex-1 flex-col">
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h2 className="text-sm font-medium capitalize">
                  {menuItems.find((i) => i.id === activeTab)?.label}
                </h2>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto p-8">
                {activeTab === "profile" && <ProfileTab />}
                {activeTab === "organization" && <OrganizationTab />}
                {activeTab === "security" && <SecurityTab />}
                {activeTab === "appearance" && <AppearanceTab />}
                {activeTab === "notifications" && <NotificationsTab />}
              </div>
            </div>
          </SidebarProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to log out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will need to log back in to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant={"destructive"} onClick={handleLogout}>
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
