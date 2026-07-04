"use client";

import React from "react";
import { useProject } from "../layout";
import { ProjectTimeline } from "@/features/tasks/components/project-timeline";

export default function TimelinePage() {
  const { handleSelectTask, projectId, selectedProject } = useProject();

  return (
    <ProjectTimeline
      key={projectId}
      workspaceId={selectedProject?.workspaceId || ""}
      projectId={projectId}
      onSelectTask={handleSelectTask}
    />
  );
}
