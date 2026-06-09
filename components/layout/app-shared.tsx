import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSquare01Icon, Analytics02Icon, Briefcase02Icon, UserMultipleIcon, Plug01Icon, Key01Icon, Settings01Icon, CreditCardIcon, HelpCircleIcon, BookOpen01Icon } from "@hugeicons/core-free-icons";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		label: "Product",
		items: [
			{
				title: "Dashboard",
				path: "#/dashboard",
				icon: (
					<HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
				),
				isActive: true,
			},
			{
				title: "Analytics",
				path: "#/analytics",
				icon: (
					<HugeiconsIcon icon={Analytics02Icon} strokeWidth={2} />
				),
			},
			{
				title: "Projects",
				path: "#/projects",
				icon: (
					<HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />
				),
			},
		],
	},
	{
		label: "Workspace",
		items: [
			{
				title: "Team",
				path: "#/team",
				icon: (
					<HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />
				),
			},
			{
				title: "Integrations",
				path: "#/integrations",
				icon: (
					<HugeiconsIcon icon={Plug01Icon} strokeWidth={2} />
				),
			},
			{
				title: "API Keys",
				path: "#/api-keys",
				icon: (
					<HugeiconsIcon icon={Key01Icon} strokeWidth={2} />
				),
			},
		],
	},
	{
		label: "Administration",
		items: [
			{
				title: "Settings",
				path: "#/settings",
				icon: (
					<HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
				),
			},
			{
				title: "Billing",
				path: "#/billing",
				icon: (
					<HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
				),
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Help Center",
		path: "#/help",
		icon: (
			<HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
		),
	},
	{
		title: "Documentation",
		path: "#/documentation",
		icon: (
			<HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />
		),
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
	...footerNavLinks,
];
