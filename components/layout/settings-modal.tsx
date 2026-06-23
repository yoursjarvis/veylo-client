"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/sidebar";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  Logout01Icon,
  PaintBoardIcon,
  Shield01Icon,
  UserIcon,
  Building03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AppearanceTab } from "./settings/appearance-tab";
import { ProfileTab } from "./settings/profile-tab";
import { SecurityTab } from "./settings/security-tab";
import { OrganizationTab } from "./settings/organization-tab";

type Tab = "profile" | "security" | "appearance" | "organization";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logout = useLogout();
  const router = useRouter();
  
  const { data: activeOrg } = authClient.useActiveOrganization();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Logged out successfully");
      onOpenChange(false);
      router.push("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const menuItems = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "security", label: "Sessions & Security", icon: Shield01Icon },
    { id: "appearance", label: "Appearance", icon: PaintBoardIcon },
  ];

  if (activeOrg) {
    menuItems.splice(1, 0, { id: "organization", label: "Organization", icon: Building03Icon });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[50vw] p-0 overflow-hidden h-[650px] gap-0">
          <SidebarProvider className="flex h-full w-full overflow-hidden min-h-0">
            <Sidebar
              collapsible="icon"
              className={cn(
                "border-r hidden md:flex flex-col h-full bg-sidebar",
                "*:data-[slot=sidebar-inner]:bg-background",
                "*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
                "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
              )}
            >
              <SidebarHeader className="h-14 justify-center border-b px-2 overflow-hidden">
                <SidebarMenuButton className="pointer-events-none transition-opacity group-data-[collapsible=icon]:opacity-0">
                  <span className="font-semibold text-foreground! px-2 text-lg tracking-tight whitespace-nowrap">Settings</span>
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
                          <HugeiconsIcon icon={item.icon} size={18} strokeWidth={2} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>
              </SidebarContent>

              <SidebarFooter className="gap-0 p-0 border-t">
                <SidebarMenu className="p-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowLogoutConfirm(true)}
                      tooltip="Log out"
                    >
                      <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={2} />
                      <span>Log out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-sidebar-inset">
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h2 className="text-sm font-medium capitalize">
                  {menuItems.find(i => i.id === activeTab)?.label}
                </h2>
              </header>
              <div className="flex-1 p-8 overflow-y-auto min-h-0">
                {activeTab === "profile" && <ProfileTab />}
                {activeTab === "organization" && <OrganizationTab />}
                {activeTab === "security" && <SecurityTab />}
                {activeTab === "appearance" && <AppearanceTab />}
              </div>
            </div>
          </SidebarProvider>
        </DialogContent>
      </Dialog>


      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to log back in to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleLogout}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
