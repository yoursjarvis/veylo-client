import {
  Analytics02Icon,
  BookOpen01Icon,
  Briefcase02Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  HelpCircleIcon,
  Key01Icon,
  Plug01Icon,
  Settings01Icon,
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
    label: "Product",
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
    label: "Workspace",
    items: [
      {
        title: "Members",
        path: "/members",
        icon: <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />,
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
  {
    label: "Administration",
    items: [
      {
        title: "Settings",
        path: "/settings",
        icon: <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />,
      },
      {
        title: "Billing",
        path: "/billing",
        icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
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
