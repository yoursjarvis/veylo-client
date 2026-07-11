"use client"

import { footerNavLinks, getNavGroups } from "@/components/layout/app-shared"
import { LatestChange } from "@/components/layout/latest-change"
import { NavGroup } from "@/components/layout/nav-group"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"
import { Logo, LogoIcon } from "@/components/shared/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { usePermissions } from "@/hooks/use-permissions"

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const { workspaces, activeWorkspace } = useWorkspaceContext()
  const workspaceSlug = activeWorkspace?.slug || ""
  const { hasPermission } = usePermissions()
  const isOwnerOrAdmin = hasPermission("member:read")
  const canReadProjects = hasPermission("project:read")
  const canReadRoles = hasPermission("role:read")

  const hasNoWorkspaces = workspaces && workspaces.length === 0
  const isCollapsed = state === "collapsed"

  const navGroups = getNavGroups(workspaceSlug, !!hasNoWorkspaces, {
    canReadProjects,
    isOwnerOrAdmin,
    canReadRoles,
  })

  return (
    <Sidebar
      className={cn("*:data-[slot=sidebar-inner]:bg-card")}
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-14 justify-center border-b border-border/50 px-4 group-data-[collapsible=icon]:px-0">
        <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isCollapsed ? (
              <motion.div
                key="collapsed-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="flex h-8 w-8 items-center justify-center text-foreground"
              >
                <LogoIcon className="h-8 w-8" />
              </motion.div>
            ) : (
              <motion.div
                key="expanded-logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="flex h-8 w-auto items-center text-foreground"
              >
                <Logo className="h-8 w-auto" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {!hasNoWorkspaces && (
          <SidebarGroup className="pb-0">
            <WorkspaceSwitcher />
          </SidebarGroup>
        )}
        {navGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-0 p-0">
        <LatestChange />
        <SidebarMenu className="border-t border-border/50 p-2">
          {footerNavLinks.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={!!(item.path && pathname.startsWith(item.path))}
                size="sm"
                render={<Link href={item.path || "#"} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
          <p className="text-[10px] text-nowrap text-muted-foreground">
            © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME} LLC
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
