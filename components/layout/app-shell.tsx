"use client"

import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
	const { data: sessionData } = authClient.useSession();
	const isImpersonating = !!sessionData?.session?.impersonatedBy;
	const user = sessionData?.user;

	const handleStopImpersonating = async () => {
		try {
			await authClient.admin.stopImpersonating();
			toast.success("Stopped impersonating");
			window.location.reload();
		} catch (err) {
			toast.error("Failed to stop impersonating");
		}
	};

	return (
		<SidebarProvider className={cn("[--app-wrapper-max-width:80rem]")}>
			<AppSidebar />
			<SidebarInset>
				{isImpersonating && (
					<div className="z-[100] flex w-full items-center justify-between bg-warning-background px-4 py-2.5 text-xs font-semibold text-warning-foreground border-b border-warning/20">
						<div className="flex items-center gap-2">
							<span className="flex h-2 w-2 rounded-full bg-warning animate-pulse" />
							<span>
								Impersonation Mode Active: Viewing Veylo as {user?.name || user?.email}
							</span>
						</div>
						<button
							onClick={handleStopImpersonating}
							className="rounded border border-warning-foreground/20 bg-warning-foreground/5 px-2 py-1 text-2xs uppercase tracking-wider text-warning-foreground hover:bg-warning-foreground/10 transition-colors cursor-pointer"
						>
							Exit Impersonation
						</button>
					</div>
				)}
				<AppHeader />
				<div
					className={cn(
						"flex flex-1 flex-col p-4 sm:p-6 md:p-8",
						"mx-auto w-full min-w-0"
					)}
				>
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
