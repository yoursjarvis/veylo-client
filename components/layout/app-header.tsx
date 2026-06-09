import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DecorIcon } from "@/components/shared/decor-icon";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { navLinks } from "@/components/layout/app-shared";
import { CustomSidebarTrigger } from "@/components/layout/custom-sidebar-trigger";
import { NavUser } from "@/components/layout/nav-user";
import { HugeiconsIcon } from "@hugeicons/react";
import { Navigation03Icon, Notification03Icon } from "@hugeicons/core-free-icons";

const activeItem = navLinks.find((item) => item.isActive);

export function AppHeader() {
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
				<Button aria-label="Notifications" size="icon-sm" variant="outline">
					<HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
				</Button>
				<Separator
					className="h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<NavUser />
			</div>
		</header>
	);
}
