"use client"
import { Project, ProjectMember, TaskStatus, Sprint, Epic, Milestone, Label, CustomFieldDefinition, ProjectTemplate } from "@/types/models";

import Image from "next/image"
import React, { createContext, useContext, useState, useEffect } from "react"
import {
  useParams,
  useRouter,
  useSearchParams,
  usePathname,
} from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import Link from "next/link"
import {
  Plus,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status"
import { IconPicker } from "@/components/shared/icon-picker"
import { getThumbUrl } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  useProjectStatuses,
  useProjectSprints,
  useProjectCustomFields,
  useProjectEpics,
  useProjectLabels,
  useProjectMilestones,
  useProjectTasks,
} from "@/features/tasks/hooks/use-tasks"
import { TaskDetailsDrawer } from "@/features/tasks/components/task-details-drawer"
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog"

interface ProjectContextType {
  workspaceSlug: string
  projectId: string
  selectedProject: (Project & { members?: ProjectMember[] }) | null
  statuses: TaskStatus[] | undefined
  sprints: Sprint[] | undefined
  customFields: CustomFieldDefinition[] | undefined
  epics: Epic[] | undefined
  labels: Label[] | undefined
  milestones: Milestone[] | undefined
  isWorkspaceAdmin: boolean
  activeTaskId: string | null
  handleSelectTask: (taskId: string | null) => void
  isCreateTaskOpen: boolean
  setIsCreateTaskOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProject must be used within a ProjectLayout")
  }
  return context
}

interface WorkspaceMember {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { workspaceSlug, projectId } = useParams<{
    workspaceSlug: string
    projectId: string
  }>()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { activeWorkspace, isLoading: isWorkspaceLoading } =
    useWorkspaceContext()
  const { data: auth } = useCurrentUser()
  const currentUser = auth?.user as
    | { id?: string; name?: string; email?: string }
    | undefined
  const { data: activeMember } = authClient.useActiveMember()

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const [projectStatus, setProjectStatus] = useState<string>("on_track")
  useEffect(() => {
    const updateStatus = () => {
      if (projectId) {
        const saved = localStorage.getItem(`veylo-project-status-${projectId}`)
        if (saved) setProjectStatus(saved)
      }
    }
    updateStatus()
    window.addEventListener("storage", updateStatus)
    window.addEventListener("project-status-updated", updateStatus)
    return () => {
      window.removeEventListener("storage", updateStatus)
      window.removeEventListener("project-status-updated", updateStatus)
    }
  }, [projectId])

  const urlTaskId = searchParams.get("taskId")
  useEffect(() => {
    const timer = setTimeout(() => {
      if (urlTaskId) {
        setActiveTaskId(urlTaskId)
      } else {
        setActiveTaskId(null)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [urlTaskId])

  const handleSelectTask = (taskId: string | null) => {
    setActiveTaskId(taskId)
    const params = new URLSearchParams(window.location.search)
    if (taskId) {
      params.set("taskId", taskId)
    } else {
      params.delete("taskId")
    }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname
    router.push(newUrl, { scroll: false })
  }

  // Queries
  const { data: selectedProject, isLoading: isProjectDetailLoading } =
    useQuery<Project & { members?: ProjectMember[] }>({
      queryKey: ["project", projectId],
      queryFn: async () => {
        const response = await axiosInstance.get(`/projects/${projectId}`)
        return response.data.data
      },
      enabled: !!projectId,
    })

  const { data: statuses } = useProjectStatuses(projectId || "")
  const { data: sprints } = useProjectSprints(projectId || "")
  const { data: customFields } = useProjectCustomFields(projectId || "")
  const { data: epics } = useProjectEpics(projectId || "")
  const { data: labels } = useProjectLabels(projectId || "")
  const { data: milestones } = useProjectMilestones(projectId || "")

  const { data: workspaceMembers } = useQuery<WorkspaceMember[]>({
    queryKey: ["workspace-members", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return []
      const response = await axiosInstance.get(
        `/workspaces/${activeWorkspace.id}/members`
      )
      return response.data.data
    },
    enabled: !!activeWorkspace,
  })

  const { data: templateDetails } = useQuery<ProjectTemplate>({
    queryKey: ["project-template", selectedProject?.template],
    queryFn: async () => {
      if (!selectedProject?.template) return null
      const response = await axiosInstance.get(
        `/project-templates/${selectedProject.template}`
      )
      return response.data.data
    },
    enabled: !!selectedProject?.template,
  })

  const { data: projectTasks } = useProjectTasks(projectId || "")

  const hasTasks = (projectTasks || []).length > 0
  const hasMembers = (selectedProject?.members || []).length > 0
  const isScrum =
    selectedProject?.template === "scrum" ||
    selectedProject?.template === "software-scrum"
  const hasActiveSprint =
    isScrum &&
    (sprints || []).some((s: { status?: string }) => s.status === "active")

  const onboardingSteps = [
    {
      id: "task",
      label: "Add your first task",
      completed: hasTasks,
      href: null,
      action: () => setIsCreateTaskOpen(true),
    },
    {
      id: "member",
      label: "Invite a team member",
      completed: hasMembers,
      href: `/${workspaceSlug}/projects/${projectId}/settings/members`,
      action: null,
    },
    ...(isScrum
      ? [
          {
            id: "sprint",
            label: "Start your first sprint",
            completed: hasActiveSprint,
            href: `/${workspaceSlug}/projects/${projectId}/backlog`,
            action: null,
          },
        ]
      : []),
  ]

  const allCompleted = onboardingSteps.every((step) => step.completed)

  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(false)

  useEffect(() => {
    if (projectId) {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem(
          `veylo-onboarding-dismissed-${projectId}`
        )
        setIsOnboardingDismissed(dismissed === "true")
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [projectId])

  const handleDismissOnboarding = () => {
    localStorage.setItem(`veylo-onboarding-dismissed-${projectId}`, "true")
    setIsOnboardingDismissed(true)
  }

  const showOnboarding = !isOnboardingDismissed && !allCompleted
  const completedCount = onboardingSteps.filter((s) => s.completed).length
  const totalCount = onboardingSteps.length
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Permissions Check
  const userRole = activeMember?.role
  const isOrgAdmin = userRole === "owner" || userRole === "admin"
  const myWorkspaceMember = workspaceMembers?.find(
    (m) => m.userId === currentUser?.id
  )
  const isWorkspaceAdmin = isOrgAdmin || myWorkspaceMember?.role === "admin"

  // Upload project icon helper
  const uploadProjectIcon = async (projId: string, file: File) => {
    const formData = new FormData()
    formData.append("icon", file)
    const response = await axiosInstance.post(
      `/media/project/${projId}/icon`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    )
    return response.data.data.url
  }

  // Mutation for project icon update
  const updateProjectIconMutation = useMutation({
    mutationFn: async (icon: string | File | null) => {
      const isFile = icon instanceof File
      const patchData = {
        icon: !isFile ? (icon as string | null) : undefined,
      }
      const res = await axiosInstance.patch(`/projects/${projectId}`, patchData)
      const updatedProject = res.data.data
      if (isFile && icon) {
        const iconUrl = await uploadProjectIcon(projectId!, icon as File)
        updatedProject.icon = iconUrl
      }
      return updatedProject
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", activeWorkspace?.id],
      })
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Project icon updated")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err.response?.data?.message || "Failed to update project icon"
      )
    },
  })

  const renderProjectIcon = (
    icon?: string | null,
    sizeClass = "h-14 w-14",
    textClass = "text-3xl"
  ) => {
    const baseClasses = `flex items-center justify-center rounded-xl transition-all duration-300 shadow-md backdrop-blur`
    if (!icon) {
      return (
        <span className={`${baseClasses} ${sizeClass} ${textClass}`}>📁</span>
      )
    }
    if (
      icon.startsWith("http") ||
      icon.startsWith("/") ||
      icon.startsWith("blob:")
    ) {
      const imageUrl = icon.startsWith("blob:")
        ? icon
        : getThumbUrl(icon) || icon
      return (
        <div className={`${baseClasses} ${sizeClass} relative overflow-hidden`}>
          <Image
            src={imageUrl}
            onError={(e) => {
              if (imageUrl !== icon && icon) {
                e.currentTarget.src = icon
              }
            }}
            alt="Project Icon"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )
    }
    return (
      <span className={`${baseClasses} ${sizeClass} ${textClass} leading-none`}>
        {icon}
      </span>
    )
  }

  if (isWorkspaceLoading || isProjectDetailLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!activeWorkspace) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4">
        <AlertCircle className="mb-4 h-12 w-12 animate-bounce text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Workspace Selected</h2>
        <p className="mt-2 max-w-md text-center text-muted-foreground">
          Please select or create a workspace to view projects.
        </p>
      </div>
    )
  }

  // Navigation Setup
  const basePath = `/${workspaceSlug}/projects/${projectId}`
  const navLinks = [
    { name: "Overview", path: basePath },
    { name: "List", path: `${basePath}/list` },
    { name: "Board", path: `${basePath}/board` },
    ...(isScrum
      ? [{ name: "Backlog", path: `${basePath}/backlog` }]
      : []),
    { name: "Timeline", path: `${basePath}/timeline` },
    { name: "Epics", path: `${basePath}/epics` },
    { name: "Reports", path: `${basePath}/reports` },
    { name: "Files", path: `${basePath}/files` },
    ...(isWorkspaceAdmin
      ? [{ name: "Settings", path: `${basePath}/settings/general` }]
      : []),
  ]

  const settingsLinks = [
    { name: "General", path: `${basePath}/settings/general` },
    { name: "Members", path: `${basePath}/settings/members` },
    { name: "Vault", path: `${basePath}/settings/vault` },
    { name: "Fields", path: `${basePath}/settings/fields` },
    { name: "Labels", path: `${basePath}/settings/labels` },
    { name: "Webhooks", path: `${basePath}/settings/webhooks` },
  ]

  const isLinkActive = (linkPath: string) => {
    if (linkPath === basePath) {
      return pathname === basePath
    }
    if (linkPath.includes("/settings/general")) {
      return pathname.includes("/settings")
    }
    return pathname === linkPath
  }

  return (
    <ProjectContext.Provider
      value={{
        workspaceSlug,
        projectId,
        selectedProject: selectedProject ?? null,
        statuses,
        sprints,
        customFields,
        epics,
        labels,
        milestones,
        isWorkspaceAdmin,
        activeTaskId,
        handleSelectTask,
        isCreateTaskOpen,
        setIsCreateTaskOpen,
      }}
    >
      <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col min-w-0 bg-background text-foreground overflow-x-hidden">
        {/* Main Content Area */}
        <div className="ml-2 flex min-h-screen flex-1 min-w-0 flex-col overflow-x-hidden">
          {/* Header */}
          <header className="flex shrink-0 flex-col gap-4 border-b border-border bg-card/85 px-8 pt-5 pb-0 backdrop-blur-md">
            {/* Top Row: Back Navigation, Breadcrumb, Project Title, Status & Actions */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Left Side: Back Navigation, Breadcrumb, Project Icon, Project name, Project status badge */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/${workspaceSlug}/projects`}
                  className="group flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                  aria-label="Back to projects"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </Link>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Projects</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                </div>

                <div className="flex items-center gap-2">
                  <div className="group relative shrink-0">
                    {isWorkspaceAdmin ? (
                      <IconPicker
                        value={
                          updateProjectIconMutation.isPending
                            ? null
                            : selectedProject?.icon
                        }
                        onChange={(val) => {
                          updateProjectIconMutation.mutate(val)
                        }}
                      >
                        <div className="cursor-pointer transition-opacity hover:opacity-85">
                          {renderProjectIcon(
                            selectedProject?.icon,
                            "h-8 w-8 rounded-md",
                            "text-base"
                          )}
                        </div>
                      </IconPicker>
                    ) : (
                      renderProjectIcon(
                        selectedProject?.icon,
                        "h-8 w-8 rounded-md",
                        "text-base"
                      )
                    )}
                  </div>

                  <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    {selectedProject?.title}
                  </h1>

                  {isScrum && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
                      Scrum
                    </span>
                  )}

                  {/* Status Badge */}
                  <Status
                    variant={
                      projectStatus === "on_track"
                        ? "success"
                        : projectStatus === "at_risk"
                          ? "warning"
                          : "destructive"
                    }
                    className="rounded-full border border-border/20 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground/90 shadow-xs"
                  >
                    <StatusIndicator />
                    <StatusLabel className="py-0.5 uppercase font-bold text-[9px] tracking-wide">
                      {projectStatus === "on_track"
                        ? "On Track"
                        : projectStatus === "at_risk"
                          ? "At Risk"
                          : "Off Track"}
                    </StatusLabel>
                  </Status>
                </div>
              </div>

              {/* Right Side: Member Avatars and Single "New Task" primary CTA */}
              <div className="flex items-center gap-3">
                {/* Overlapping member avatars stack */}
                <div className="flex items-center -space-x-1.5">
                  {(selectedProject?.members || [])
                    .slice(0, 5)
                    .map((member: ProjectMember) => (
                      <Avatar
                        key={member.id}
                        className="h-6.5 w-6.5 border-2 border-background transition-all hover:scale-105"
                      >
                        <AvatarImage src={member.user?.image || ""} />
                        <AvatarFallback className="bg-muted text-[9px] font-extrabold text-muted-foreground">
                          {member.user?.name
                            ? member.user?.name.charAt(0).toUpperCase()
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  {(selectedProject?.members || []).length > 5 && (
                    <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-extrabold text-muted-foreground">
                      +{(selectedProject?.members || []).length - 5}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setIsCreateTaskOpen(true)}
                  variant="default"
                  size="sm"
                  className="h-8.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-xs"
                >
                  <Plus size={14} className="h-3.5 w-3.5" />
                  <span>New Task</span>
                </Button>
              </div>
            </div>

            {/* Navigation Tabs Row */}
            <div className="-mx-8 mt-2 flex scrollbar-none items-center justify-between overflow-x-auto border-t border-border/20 px-8 pt-1">
              <nav className="flex items-center gap-5">
                {navLinks.map((link) => {
                  const isActive = isLinkActive(link.path)
                  return (
                    <Link key={link.path} href={link.path}>
                      <span
                        className={`flex cursor-pointer items-center gap-1 border-b-2 pt-2.5 pb-3 text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? "border-primary font-semibold text-primary"
                            : "border-transparent text-muted-foreground hover:border-border/60 hover:text-foreground"
                        }`}
                      >
                        {link.name}
                      </span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </header>

          {/* Settings Sub-Navbar (only when on a settings subpage) */}
          {pathname.includes("/settings") && (
            <div className="flex scrollbar-none items-center gap-2 overflow-x-auto border-b border-border bg-card/45 px-8 py-2">
              <span className="mr-3 text-[10px] font-extrabold tracking-wider text-muted-foreground uppercase">
                Settings Module:
              </span>
              <div className="flex gap-2">
                {settingsLinks.map((link) => {
                  const isActive = pathname === link.path
                  return (
                    <Link key={link.path} href={link.path}>
                      <span
                        className={`cursor-pointer rounded-md border px-3 py-1 text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? "border-border bg-muted text-foreground shadow-sm"
                            : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        {link.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Children View Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 bg-background p-8">
            <div className="mx-auto space-y-6 min-w-0 w-full max-w-full">
              {showOnboarding && (
                <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs backdrop-blur-md transition-all duration-300">
                  {/* Background glowing gradient using theme colors */}
                  <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />

                  <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                        <h3 className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                          Getting Started Guide
                        </h3>
                      </div>
                      <h2 className="text-lg font-bold text-foreground">
                        {(templateDetails?.config as { guidance?: { welcome?: string } })?.guidance?.welcome ||
                          "Welcome to your new workspace!"}
                      </h2>
                      <p className="max-w-xl text-xs text-muted-foreground">
                        {(templateDetails?.config as { guidance?: { firstStep?: string } })?.guidance?.firstStep ||
                          "Complete these quick setup tasks to onboard your team."}
                      </p>

                      {/* Progress Bar */}
                      <div className="max-w-sm space-y-1.5 pt-2">
                        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase">
                          <span>Setup Progress</span>
                          <span>
                            {completedCount}/{totalCount} completed
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-background">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Onboarding steps list */}
                    <div className="flex min-w-[280px] flex-col gap-2">
                      {onboardingSteps.map((step) => {
                        const Icon = step.completed ? CheckCircle2 : Circle
                        const buttonStyles = `flex items-center gap-3 p-3 rounded-lg border text-left text-xs font-medium transition-all ${
                          step.completed
                            ? "bg-success/5 border-success/20 text-success hover:bg-success/10"
                            : "bg-background border-border text-foreground hover:bg-muted"
                        }`
                        if (step.href) {
                          return (
                            <Link
                              key={step.id}
                              href={step.href}
                              className={buttonStyles}
                            >
                              <Icon
                                className={`h-4.5 w-4.5 shrink-0 ${step.completed ? "text-success" : "text-muted-foreground"}`}
                              />
                              <span className="flex-1">{step.label}</span>
                              {!step.completed && (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Link>
                          )
                        }
                        return (
                          <button
                            key={step.id}
                            type="button"
                            onClick={step.action || undefined}
                            className={buttonStyles}
                          >
                            <Icon
                              className={`h-4.5 w-4.5 shrink-0 ${step.completed ? "text-success" : "text-muted-foreground"}`}
                            />
                            <span className="flex-1">{step.label}</span>
                            {!step.completed && (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Close button */}
                  <Button
                    onClick={handleDismissOnboarding}
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Global Drawers & Dialogs */}
      {activeTaskId && (
        <TaskDetailsDrawer
          taskId={activeTaskId}
          projectId={projectId!}
          projectMembers={(selectedProject?.members || []) as (ProjectMember & { user: { id: string; name: string; image?: string | null } })[]}
          projectStatuses={statuses || []}
          projectSprints={sprints || []}
          projectTemplate={selectedProject?.template || "simple"}
          projectEpics={epics || []}
          projectMilestones={milestones || []}
          projectLabels={labels || []}
          onClose={() => handleSelectTask(null)}
        />
      )}

      {isCreateTaskOpen && (
        <CreateTaskDialog
          open={isCreateTaskOpen}
          projectId={projectId!}
          projectMembers={(selectedProject?.members || []) as (ProjectMember & { user: { id: string; name: string; image?: string | null } })[]}
          projectStatuses={statuses || []}
          projectSprints={sprints || []}
          projectTemplate={selectedProject?.template || "simple"}
          projectEpics={epics || []}
          projectMilestones={milestones || []}
          projectLabels={labels || []}
          onOpenChange={setIsCreateTaskOpen}
        />
      )}
    </ProjectContext.Provider>
  )
}
