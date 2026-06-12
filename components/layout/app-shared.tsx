import {
  Analytics02Icon,
  BookOpen01Icon,
  Briefcase02Icon,
  DashboardSquare01Icon,
  HelpCircleIcon,
  Key01Icon,
  Plug01Icon,
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

export const navGroups: SidebarNavGroup[] = [
  {
    label: "WorkSpace",
    items: [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
      },
      {
        title: "Analytics",
        path: "/analytics",
        icon: <HugeiconsIcon icon={Analytics02Icon} strokeWidth={2} />,
      },
      {
        title: "Projects",
        path: "/projects",
        icon: <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />,
      },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        title: "Members",
        path: "/members",
        icon: <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />,
      },
      {
        title: "Workspaces",
        path: "/members/workspaces",
        icon: <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />,
      },
      {
        title: "Integrations",
        path: "/integrations",
        icon: <HugeiconsIcon icon={Plug01Icon} strokeWidth={2} />,
      },
      {
        title: "API Keys",
        path: "/api-keys",
        icon: <HugeiconsIcon icon={Key01Icon} strokeWidth={2} />,
      },
    ],
  },
]

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

export const navLinks: SidebarNavItem[] = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item]
    )
  ),
  ...footerNavLinks,
]
