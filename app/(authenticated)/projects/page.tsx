"use client";

import { useWorkspaceContext } from "@/components/providers/workspace-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullPageLoader } from "@/components/layout/loading";

export default function ProjectsRedirectPage() {
  const { activeWorkspace, isLoading, workspaces } = useWorkspaceContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (activeWorkspace) {
        router.replace(`/${activeWorkspace.slug}/projects`);
      } else if (workspaces && workspaces.length === 0) {
        router.replace("/workspaces");
      }
    }
  }, [isLoading, activeWorkspace, workspaces, router]);

  return <FullPageLoader />;
}
