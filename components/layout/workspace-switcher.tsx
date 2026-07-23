"use client"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { ProjectIcon } from "@/components/shared/project-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowDown01Icon,
  Briefcase02Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useState } from "react"

import { usePermissions } from "@/hooks/use-permissions"

export function WorkspaceSwitcher() {
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    isLoading,
    setIsCreateModalOpen,
  } = useWorkspaceContext()
  const [searchQuery, setSearchQuery] = useState("")

  const { hasPermission } = usePermissions()
  const isOwnerOrAdmin = hasPermission("workspace:create")

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  const filteredWorkspaces = workspaces?.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            nativeButton={false}
            render={(props) => (
              <SidebarMenuButton
                {...props}
                render={(sbProps) => <div {...sbProps} />}
                size="lg"
                className="border data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <ProjectIcon
                  icon={activeWorkspace?.icon}
                  size="h-10 w-10"
                  iconSize="h-7 w-7"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeWorkspace?.name || "Select Workspace"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Workspace
                  </span>
                </div>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={16}
                  className="ml-auto"
                />
              </SidebarMenuButton>
            )}
          />
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <div className="px-2 py-2">
              <Input
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="h-8"
              />
            </div>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {(filteredWorkspaces?.length ?? 0) > 0 ? (
                filteredWorkspaces?.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => setActiveWorkspace(workspace.id)}
                    className="gap-2 p-2"
                  >
                    <ProjectIcon
                      icon={workspace.icon}
                      size="h-8 w-8"
                      iconSize="h-6 w-6"
                    />
                    {workspace.name}
                    {activeWorkspace?.id === workspace.id && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={16}
                        className="ml-auto text-primary"
                      />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No workspaces found.
                </div>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isOwnerOrAdmin && (
                <DropdownMenuItem
                  className="cursor-pointer gap-2 p-2"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <HugeiconsIcon icon={PlusSignIcon} size={12} />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Create Workspace
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="cursor-pointer gap-2 p-2"
                onSelect={() => (window.location.href = "/workspaces")}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <HugeiconsIcon icon={Briefcase02Icon} size={12} />
                </div>
                <div className="font-medium text-muted-foreground">
                  <Link href="/workspaces">Manage Workspaces</Link>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
