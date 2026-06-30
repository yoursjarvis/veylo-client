"use client";

import React from "react";
import { useProject } from "../layout";
import { ProjectTimeline } from "@/features/tasks/components/project-timeline";
import { useWorkspaceContext } from "@/components/providers/workspace-provider";

export default function TimelinePage() {
  const { handleSelectTask, projectId } = useProject();
  const { activeWorkspace } = useWorkspaceContext();

  return (
    <ProjectTimeline
      key={projectId}
      workspaceId={activeWorkspace?.id || ""}
      projectId={projectId}
      onSelectTask={handleSelectTask}
    />
  );
}
