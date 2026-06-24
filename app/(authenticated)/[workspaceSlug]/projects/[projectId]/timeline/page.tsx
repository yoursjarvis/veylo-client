"use client";

import React from "react";
import { useProject } from "../layout";
import { ProjectTimeline } from "@/features/tasks/components/project-timeline";
import { useWorkspaceContext } from "@/components/providers/workspace-provider";

export default function TimelinePage() {
  const { handleSelectTask } = useProject();
  const { activeWorkspace } = useWorkspaceContext();

  return (
    <ProjectTimeline
      workspaceId={activeWorkspace?.id || ""}
      onSelectTask={handleSelectTask}
    />
  );
}
