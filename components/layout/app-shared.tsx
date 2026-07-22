import {
  Award01Icon,
  BookOpen01Icon,
  Briefcase02Icon,
  ChartBarLineIcon,
  CheckmarkSquare02Icon,
  Clock01Icon,
  DashboardSquare01Icon,
  Database01Icon,
  FileDatabaseIcon,
  HelpCircleIcon,
  SecurityLockIcon,
  Target02Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ReactNode } from "react"
import Image from "next/image"
import { getThumbUrl } from "@/lib/utils"

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

export function renderSidebarProjectIcon(icon?: string | null) {
  const baseClasses =
    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border/40 text-2xs leading-none shadow-2xs font-normal"

  if (!icon) {
    return (
      <span className={`${baseClasses} bg-secondary/50 text-[10px]`}>📁</span>
    )
  }

  if (
    icon.startsWith("http") ||
    icon.startsWith("/") ||
    icon.startsWith("blob:")
  ) {
    const imageUrl = icon.startsWith("blob:") ? icon : getThumbUrl(icon) || icon
    return (
      <div className={`${baseClasses} relative overflow-hidden bg-background`}>
        <Image
          src={imageUrl}
          alt="Project Icon"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    )
  }

  // Emoji or single character
  return (
    <span className={`${baseClasses} bg-secondary/50 text-[10px]`}>{icon}</span>
  )
}

export const getNavGroups = (
  workspaceSlug: string,
  hasNoWorkspaces: boolean,
  permissions: {
    canReadProjects: boolean
    isOwnerOrAdmin: boolean
    canReadRoles: boolean
    canViewAdminKpi?: boolean
    canViewMemberKpi?: boolean
    canReadTasks?: boolean
    canReadPortfolio?: boolean
    canReadOkrs?: boolean
    canReadWorkspaces?: boolean
    canReadAuditLogs?: boolean
  },
  kpiEnabled?: boolean,
  projects: any[] = []
): SidebarNavGroup[] =>
  [
    {
      label: "Your Work",
      items: [
        {
          title: "Dashboard",
          path: `/${workspaceSlug}/dashboard`,
          icon: (
            <HugeiconsIcon
              icon={DashboardSquare01Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
        {
          title: "My Tasks",
          path: `/${workspaceSlug}/tasks`,
          icon: (
            <HugeiconsIcon
              icon={CheckmarkSquare02Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
        {
          title: "Timesheets",
          path: `/${workspaceSlug}/timesheets`,
          icon: (
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
        {
          title: "Projects",
          path: `/${workspaceSlug}/projects`,
          icon: (
            <HugeiconsIcon
              icon={Briefcase02Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
          subItems: permissions.canReadProjects
            ? projects.map((p) => ({
                title: p.title,
                path: `/${workspaceSlug}/projects/${p.id}`,
                icon: renderSidebarProjectIcon(p.icon),
              }))
            : undefined,
        },
        {
          title: "Goals & OKRs",
          path: `/${workspaceSlug}/okrs`,
          icon: (
            <HugeiconsIcon
              icon={Target02Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
        {
          title: "Portfolio",
          path: `/${workspaceSlug}/portfolio`,
          icon: (
            <HugeiconsIcon
              icon={ChartBarLineIcon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
      ].filter((item) => {
        if (hasNoWorkspaces) return false
        if (item.title === "Dashboard" || item.title === "Projects")
          return permissions.canReadProjects
        if (item.title === "My Tasks") return permissions.canReadTasks
        if (item.title === "Portfolio") return permissions.canReadPortfolio
        if (item.title === "Goals & OKRs") return permissions.canReadOkrs
        return true
      }),
    },
    {
      label: "Genernal",
      items: [
        {
          title: "KPIs",
          path: `/${workspaceSlug}/kpi`,
          icon: (
            <HugeiconsIcon
              icon={Award01Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
        {
          title: "Manage Projects",
          path: `/manage-projects`,
          icon: (
            <HugeiconsIcon
              icon={Briefcase02Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
        {
          title: "Audit Logs",
          path: `/${workspaceSlug}/audit-logs`,
          icon: (
            <HugeiconsIcon
              icon={FileDatabaseIcon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
      ].filter((item) => {
        if (item.title === "KPIs") {
          return (
            !!kpiEnabled &&
            (permissions.canViewAdminKpi || permissions.canViewMemberKpi)
          )
        }
        if (item.title === "Gamification & KPIs") return !!kpiEnabled
        if (item.title === "Audit Logs") return permissions.canReadAuditLogs
        if (item.title === "Manage Projects")
          return permissions.isOwnerOrAdmin || permissions.canReadProjects
        return true
      }),
    },
    {
      label: "Administration",
      items: [
        {
          title: "Members",
          path: "/members",
          icon: (
            <HugeiconsIcon
              icon={UserMultipleIcon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
        {
          title: "Workspaces",
          path: "/workspaces",
          icon: (
            <HugeiconsIcon
              icon={Briefcase02Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
        {
          title: "Roles & Permissions",
          path: "/roles",
          icon: (
            <HugeiconsIcon
              icon={SecurityLockIcon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
        {
          title: "Organization Logs",
          path: "/audit-logs",
          icon: (
            <HugeiconsIcon
              icon={Database01Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          ),
          isActive: false,
        },
      ].filter((item) => {
        if (item.title === "Members") return permissions.isOwnerOrAdmin
        if (item.title === "Organization Logs")
          return permissions.canReadAuditLogs
        if (item.title === "Workspaces") return permissions.canReadWorkspaces
        if (item.title === "Roles & Permissions")
          return permissions.canReadRoles
        if (item.title === "Gamification & KPIs") return !!kpiEnabled
        return true
      }),
    },
  ].filter((group) => group.items.length > 0)

export const footerNavLinks: SidebarNavItem[] = [
  {
    title: "Help Center",
    path: "/help",
    icon: (
      <HugeiconsIcon
        icon={HelpCircleIcon}
        strokeWidth={2}
        className="h-4 w-4"
      />
    ),
  },
  {
    title: "Documentation",
    path: "/documentation",
    icon: (
      <HugeiconsIcon
        icon={BookOpen01Icon}
        strokeWidth={2}
        className="h-4 w-4"
      />
    ),
  },
]

export const getNavLinks = (
  workspaceSlug: string,
  hasNoWorkspaces: boolean,
  permissions: {
    canReadProjects: boolean
    isOwnerOrAdmin: boolean
    canReadRoles: boolean
    canViewAdminKpi?: boolean
    canViewMemberKpi?: boolean
    canReadTasks?: boolean
    canReadPortfolio?: boolean
    canReadOkrs?: boolean
    canReadWorkspaces?: boolean
    canReadAuditLogs?: boolean
  },
  kpiEnabled?: boolean,
  projects: any[] = []
): SidebarNavItem[] => [
  ...getNavGroups(
    workspaceSlug,
    hasNoWorkspaces,
    permissions,
    kpiEnabled,
    projects
  ).flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item]
    )
  ),
  ...footerNavLinks,
]
