import {
  BookOpen01Icon,
  Briefcase02Icon,
  CheckmarkSquare02Icon,
  Clock01Icon,
  DashboardSquare01Icon,
  HelpCircleIcon,
  Shield01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ReactNode } from "react"

export type SidebarNavItem = {
  title: string
  path?: string
  icon?: ReactNode
  isActive?: boolean
  subItems?: SidebarNavItem[]
}

export type SidebarNavGroup = {
  label?: string
  items: SidebarNavItem[]
}

export const getNavGroups = (
  workspaceSlug: string,
  hasNoWorkspaces: boolean,
  permissions: {
    canReadProjects: boolean
    isOwnerOrAdmin: boolean
    canReadRoles: boolean
  }
): SidebarNavGroup[] => [
  {
    label: "Your Work",
    items: [
      {
        title: "Dashboard",
        path: `/${workspaceSlug}/dashboard`,
        icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
        isActive: false,
      },
      {
        title: "My Tasks",
        path: `/${workspaceSlug}/tasks`,
        icon: <HugeiconsIcon icon={CheckmarkSquare02Icon} strokeWidth={2} />,
        isActive: false,
      },
      {
        title: "Timesheets",
        path: `/${workspaceSlug}/timesheets`,
        icon: <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />,
        isActive: false,
      },
      {
        title: "Projects",
        path: `/${workspaceSlug}/projects`,
        icon: <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />,
        isActive: false,
      },
    ].filter((item) => {
      if (hasNoWorkspaces) return false
      if (item.title === "Dashboard" || item.title === "Projects") return permissions.canReadProjects
      return true
    }),
  },
  {
    label: "Administration",
    items: [
      {
        title: "Members",
        path: "/members",
        icon: <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />,
        isActive: false,
      },
      {
        title: "Workspaces",
        path: "/workspaces",
        icon: <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />,
        isActive: false,
      },
      {
        title: "Roles & Permissions",
        path: "/roles",
        icon: <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} />,
        isActive: false,
      },
    ].filter((item) => {
      if (item.title === "Members") return permissions.isOwnerOrAdmin
      if (item.title === "Roles & Permissions") return permissions.canReadRoles
      return true
    }),
  },
].filter((group) => group.items.length > 0)

export const footerNavLinks: SidebarNavItem[] = [
  {
    title: "Help Center",
    path: "/help",
    icon: <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />,
  },
  {
    title: "Documentation",
    path: "/documentation",
    icon: <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />,
  },
]

export const getNavLinks = (
  workspaceSlug: string,
  hasNoWorkspaces: boolean,
  permissions: {
    canReadProjects: boolean
    isOwnerOrAdmin: boolean
    canReadRoles: boolean
  }
): SidebarNavItem[] => [
  ...getNavGroups(workspaceSlug, hasNoWorkspaces, permissions).flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item]
    )
  ),
  ...footerNavLinks,
]
