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
import { CommandCenter } from "@/components/layout/command-center"
import { useState } from "react"
import { Search } from "lucide-react"

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

  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      
      {/* Left */}
      <div className="flex flex-1 items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs page={activeItem} />
      </div>

      {/* Center */}
      <div className="flex flex-1 items-center justify-center">
        <Button
          variant="outline"
          className="relative h-8 w-full max-w-sm justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12"
          onClick={() => setCommandOpen(true)}
        >
          <span className="hidden lg:inline-flex">Search...</span>
          <span className="inline-flex lg:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <CommandCenter open={commandOpen} onOpenChange={setCommandOpen} />
      </div>

      {/* Right */}
      <div className="flex flex-1 items-center justify-end gap-3">
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
