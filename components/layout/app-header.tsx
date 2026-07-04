"use client"

import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs"
import { getNavLinks } from "@/components/layout/app-shared"
import { CustomSidebarTrigger } from "@/components/layout/custom-sidebar-trigger"
import { NavUser } from "@/components/layout/nav-user"
import { DecorIcon } from "@/components/shared/decor-icon"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Navigation03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { usePathname } from "next/navigation"

import { NotificationCenter } from "@/components/layout/notification-center"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { usePermissions } from "@/hooks/use-permissions"

export function AppHeader() {
  const pathname = usePathname()
  const { activeWorkspace, workspaces } = useWorkspaceContext()
  const { hasPermission } = usePermissions()

  const workspaceSlug = activeWorkspace?.slug || ""
  const hasNoWorkspaces = workspaces && workspaces.length === 0
  const isOwnerOrAdmin = hasPermission("member:read")
  const canReadProjects = hasPermission("project:read")
  const canReadRoles = hasPermission("role:read")

  const navLinks = getNavLinks(workspaceSlug, !!hasNoWorkspaces, {
    canReadProjects,
    isOwnerOrAdmin,
    canReadRoles,
  })

  const activeItem = navLinks.find((item) => item.path === pathname)

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs page={activeItem} />
      </div>
      <div className="flex items-center gap-3">
        <Button size="icon-sm" variant="outline">
          <HugeiconsIcon icon={Navigation03Icon} strokeWidth={2} />
        </Button>
        <NotificationCenter />
        <Separator
          className="h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <NavUser />
      </div>
    </header>
  )
}
