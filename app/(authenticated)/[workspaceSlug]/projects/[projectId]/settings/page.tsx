"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function SettingsRedirectPage() {
  const router = useRouter();
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();

  useEffect(() => {
    router.replace(`/${workspaceSlug}/projects/${projectId}/settings/general`);
  }, [router, workspaceSlug, projectId]);

  return null;
}
