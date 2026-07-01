"use client"

import { ProjectDescription } from "./components/project-description"
import { ProjectHistory } from "./components/project-history"
import { ProjectMilestones } from "./components/project-milestones"
import { ProjectResources } from "./components/project-resources"
import { ProjectStatusPicker } from "./components/project-status-picker"
import { ProjectTeam } from "./components/project-team"
import { useProject } from "./layout"

export default function ProjectOverviewPage() {
  const { projectId, workspaceSlug, selectedProject } = useProject()

  if (!projectId || !selectedProject) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="grid animate-in grid-cols-1 gap-8 duration-300 fade-in lg:grid-cols-3">
      {/* Left Columns - Project Info & Resources */}
      <div className="space-y-8 lg:col-span-2">
        {/* Project Description */}
        <ProjectDescription
          projectId={projectId}
          initialDescription={selectedProject.description}
        />

        {/* Project Roles & Members */}
        <ProjectTeam
          members={(selectedProject.members || []).map((m) => ({
            ...m,
            user: {
              id: m.user?.id || "",
              name: m.user?.name || "",
              email: m.user?.email || "",
              image: m.user?.image || null,
            },
          }))}
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
          members={
            (selectedProject.members || []).filter(
              (m) => m.user
            ) as (import("@/types/models").ProjectMember & {
              user: {
                id: string
                name: string
                email: string
                image: string | null
              }
            })[]
          }
          projectCreatedAt={selectedProject.createdAt}
        />
      </div>
    </div>
  )
}
