"use client";

import React from "react";
import { useProject } from "./layout";
import { ProjectDescription } from "./components/project-description";
import { ProjectTeam } from "./components/project-team";
import { ProjectResources } from "./components/project-resources";
import { ProjectMilestones } from "./components/project-milestones";
import { ProjectStatusPicker } from "./components/project-status-picker";
import { ProjectHistory } from "./components/project-history";

export default function ProjectOverviewPage() {
  const { projectId, workspaceSlug, selectedProject } = useProject();

  if (!projectId || !selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
      {/* Left Columns - Project Info & Resources */}
      <div className="lg:col-span-2 space-y-8">
        {/* Project Description */}
        <ProjectDescription
          projectId={projectId}
          initialDescription={selectedProject.description}
        />

        {/* Project Roles & Members */}
        <ProjectTeam
          members={selectedProject.members || []}
          workspaceSlug={workspaceSlug || ""}
          projectId={projectId}
        />

        {/* Key Resources & Project Brief */}
        <ProjectResources projectId={projectId} />

        {/* Key Milestones */}
        <ProjectMilestones projectId={projectId} />
      </div>

      {/* Right Column - Status Card & Member Activity Timeline */}
      <div className="space-y-8">
        {/* Project Status Picker */}
        <ProjectStatusPicker projectId={projectId} />

        {/* Member Join Feed / Timeline */}
        <ProjectHistory
          members={selectedProject.members || []}
          projectCreatedAt={selectedProject.createdAt}
        />
      </div>
    </div>
  );
}
