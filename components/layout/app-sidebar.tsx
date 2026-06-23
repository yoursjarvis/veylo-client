"use client";

import { footerNavLinks, navGroups } from "@/components/layout/app-shared";
import { LatestChange } from "@/components/layout/latest-change";
import { NavGroup } from "@/components/layout/nav-group";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { useWorkspaceContext } from "@/components/providers/workspace-provider";
import { authClient } from "@/lib/auth-client";

export function AppSidebar() {
	const pathname = usePathname();
	const { workspaces } = useWorkspaceContext();
	const { data: activeMember } = authClient.useActiveMember();
	const userRole = activeMember?.role;
	const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

	const hasNoWorkspaces = workspaces && workspaces.length === 0;

	// Filter navigation groups based on workspace access and role
	const filteredNavGroups = navGroups.map(group => {
		if (hasNoWorkspaces) {
			if (group.label === "WorkSpace") {
				// Regular user with no workspaces has no workspace dashboard/projects
				return null;
			}
			if (group.label === "Organization") {
				// Regular user with no workspace should only see "Workspaces" to get the empty state page
				// Admin/Owner can also see "Members"
				const filteredItems = group.items.filter(item => {
					if (item.title === "Workspaces") return true;
					if (item.title === "Members" && isOwnerOrAdmin) return true;
					return false;
				});
				return { ...group, items: filteredItems };
			}
		}
		return group;
	}).filter(Boolean) as typeof navGroups;

	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
				"**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
			)}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-16 justify-center border-b px-2">
				<WorkspaceSwitcher />
			</SidebarHeader>
			<SidebarContent>
				{filteredNavGroups.map((group, index) => (
					<NavGroup key={`sidebar-group-${index}`} {...group} />
				))}
			</SidebarContent>
			<SidebarFooter className="gap-0 p-0">
				<LatestChange />
				<SidebarMenu className="border-t p-2">
					{footerNavLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								className="text-muted-foreground"
								isActive={item.path === pathname}
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
					<p className="text-nowrap text-[9px] text-muted-foreground">
						© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME} LLC
					</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
