"use client"
import {
  CustomFieldDefinition,
  Epic,
  Label,
  Milestone,
  Project,
  ProjectMember,
  ProjectTemplate,
  Sprint,
  TaskStatus,
} from "@/types/models"

import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { axiosInstance } from "@/lib/axios"
import { cn } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { CheckCircle2, ChevronRight, Circle, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"
import React, { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { IconPicker } from "@/components/shared/icon-picker"
import { ProjectIcon } from "@/components/shared/project-icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getThumbUrl } from "@/lib/utils"

import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog"
import { TaskDetailsDrawer } from "@/features/tasks/components/task-details-drawer"
import {
  useProjectCustomFields,
  useProjectEpics,
  useProjectLabels,
  useProjectMilestones,
  useProjectSprints,
  useProjectStatuses,
  useProjectTasks,
} from "@/features/tasks/hooks/use-tasks"
import {
  AlertDiamondIcon,
  ArrowLeft01Icon,
  ArrowReloadHorizontalIcon,
  ChevronRightIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface TemplateConfig {
  guidance?: {
    welcome?: string
    firstStep?: string
  }
}

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
  const { data: selectedProject, isLoading: isProjectDetailLoading } = useQuery<
    Project & { members?: ProjectMember[] }
  >({
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

  // Permissions Check
  const { hasPermission } = usePermissions()
  const isWorkspaceAdmin = hasPermission("project:update") // Leaving this intact for backward compatibility if needed elsewhere
  const canCreateTask = hasPermission("task:create")
  const canUpdateProject = hasPermission("project:update")
  const canReadMembers = hasPermission("project-member:read")
  const canReadVault = hasPermission("project-vault:read")
  const canReadFields = hasPermission("project-custom-field:read")
  const canReadStatuses = hasPermission("project-status:read")
  const canReadLabels = hasPermission("project-label:read")
  const canReadWebhooks = hasPermission("project-webhook:read")
  const canReadAutomation = hasPermission("project-automation:read")
  const canReadEpics = hasPermission("project-epic:read")

  const onboardingSteps = [
    ...(canCreateTask
      ? [
          {
            id: "task",
            label: "Add your first task",
            completed: hasTasks,
            href: null,
            action: () => setIsCreateTaskOpen(true),
          },
        ]
      : []),
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

  const config = templateDetails?.config as TemplateConfig | undefined
  const welcomeMessage =
    config?.guidance?.welcome || "Welcome to your new workspace!"
  const firstStepMessage =
    config?.guidance?.firstStep ||
    "Complete these quick setup tasks to onboard your team."

  const showOnboarding = !isOnboardingDismissed && !allCompleted
  const completedCount = onboardingSteps.filter((s) => s.completed).length
  const totalCount = onboardingSteps.length
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0

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


  if (isWorkspaceLoading || isProjectDetailLoading) {
    return (
      <div className="flex w-full flex-col space-y-4 p-6">
        <Skeleton className="h-12 w-62.5" />
        <Skeleton className="h-8 w-37.5" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (!activeWorkspace) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4">
        <HugeiconsIcon
          icon={AlertDiamondIcon}
          className="mb-4 h-12 w-12 animate-bounce text-muted-foreground"
        />
        <h2 className="text-xl font-semibold">No Workspace Selected</h2>
        <p className="mt-2 max-w-md text-center text-muted-foreground">
          Please select or create a workspace to view projects.
        </p>
      </div>
    )
  }

  // Navigation Setup
  const basePath = `/${workspaceSlug}/projects/${projectId}`
  const isSoftware = selectedProject?.teamMode === "software"
  const isGeneral = selectedProject?.teamMode === "general"
  const isHybrid =
    selectedProject?.teamMode === "hybrid" || !selectedProject?.teamMode

  const navLinks = [
    { name: "Overview", path: basePath },
    { name: "List", path: `${basePath}/list` },
    { name: "Board", path: `${basePath}/board` },
    ...(isGeneral || isHybrid
      ? [{ name: "Calendar", path: `${basePath}/calendar` }]
      : []),
    ...(isScrum && (isSoftware || isHybrid)
      ? [{ name: "Backlog", path: `${basePath}/backlog` }]
      : []),
    { name: "Timeline", path: `${basePath}/timeline` },
    ...((isSoftware || isHybrid) && canReadEpics
      ? [{ name: "Epics", path: `${basePath}/epics` }]
      : []),
    { name: "Workload", path: `${basePath}/workload` },
    { name: "Reports", path: `${basePath}/reports` },
    { name: "Files", path: `${basePath}/files` },
    { name: "Docs", path: `${basePath}/docs` },
    // Settings tab will be appended dynamically below based on settingsLinks
  ]

  const settingsLinks = [
    ...(canUpdateProject
      ? [{ name: "General", path: `${basePath}/settings/general` }]
      : []),
    ...(canReadMembers
      ? [{ name: "Members", path: `${basePath}/settings/members` }]
      : []),
    ...(canReadVault
      ? [{ name: "Vault", path: `${basePath}/settings/vault` }]
      : []),
    ...(canReadFields
      ? [{ name: "Fields", path: `${basePath}/settings/fields` }]
      : []),
    ...(canReadStatuses
      ? [{ name: "Statuses", path: `${basePath}/settings/statuses` }]
      : []),
    ...(canReadLabels
      ? [{ name: "Labels", path: `${basePath}/settings/labels` }]
      : []),
    ...(canReadWebhooks
      ? [{ name: "Webhooks", path: `${basePath}/settings/webhooks` }]
      : []),
    ...(canReadAutomation
      ? [{ name: "Automation", path: `${basePath}/settings/automation` }]
      : []),
  ]

  if (settingsLinks.length > 0) {
    navLinks.push({ name: "Settings", path: settingsLinks[0].path })
  }

  const isLinkActive = (linkPath: string) => {
    if (linkPath === basePath) {
      return pathname === basePath
    }
    if (linkPath.includes("/settings")) {
      return pathname.includes("/settings")
    }
    return pathname === linkPath
  }

  const doneStatusIds = (statuses || [])
    .filter((s: { name: string; progressWeight?: number }) => {
      if (typeof s.progressWeight === "number") {
        return s.progressWeight === 100
      }
      return s.name.toLowerCase() === "done"
    })
    .map((s: { id: string }) => s.id)

  const totalTasksCount = projectTasks?.length || 0
  const doneTasksCount =
    projectTasks?.filter(
      (t: { statusId?: string | null }) =>
        t.statusId && doneStatusIds.includes(t.statusId)
    ).length || 0
  const activeSprint = sprints?.find(
    (s: { status: string }) => s.status === "active"
  )

  const activeNavTab = navLinks.find((link) => isLinkActive(link.path))?.path
  const activeSettingsTab = settingsLinks.find(
    (link) => pathname === link.path
  )?.path

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
      <Card
        plain
        className="flex min-h-[calc(100vh-4rem)] w-full min-w-0 flex-col overflow-x-hidden"
      >
        {/* Main Content Area */}
        <Card
          plain
          className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden"
        >
          {/* Header */}
          <header className="mb-5 flex shrink-0 flex-col">
            <div className="px-6 pb-4">
              {/* Breadcrumb section */}
              <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Link
                  href={`/${workspaceSlug}/projects`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" })
                  )}
                  aria-label="Back to projects"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
                </Link>
                <Link
                  href={`/${workspaceSlug}/projects`}
                  className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Projects
                </Link>
                <HugeiconsIcon
                  icon={ChevronRightIcon}
                  className="size-3 shrink-0"
                />
                <span className="font-medium">{selectedProject?.title}</span>
              </div>

              {/* Title & Metadata row */}
              <div className="flex items-start justify-between">
                {/* Left side: Project icon, title, status and sprint metadata */}
                <div className="flex items-center gap-3">
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
                          <ProjectIcon
                            icon={updateProjectIconMutation.isPending ? null : selectedProject?.icon}
                            size="h-9 w-9"
                            iconSize="h-4.5 w-4.5"
                            className="rounded-lg shadow-md"
                          />
                        </div>
                      </IconPicker>
                    ) : (
                      <ProjectIcon
                        icon={selectedProject?.icon}
                        size="h-9 w-9"
                        iconSize="h-4.5 w-4.5"
                        className="rounded-lg shadow-md"
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="font-headings text-2xl leading-none font-semibold text-foreground">
                        {selectedProject?.title}
                      </h1>
                      <Badge variant="outline" size="sm">
                        {isScrum ? "Scrum" : "Simple"}
                      </Badge>
                      <Badge
                        variant={
                          projectStatus === "on_track"
                            ? "success-outline"
                            : projectStatus === "at_risk"
                              ? "warning-outline"
                              : "destructive-outline"
                        }
                        size="sm"
                        className="gap-1.5"
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            projectStatus === "on_track"
                              ? "bg-success"
                              : projectStatus === "at_risk"
                                ? "bg-warning"
                                : "bg-destructive"
                          )}
                        />
                        <span>
                          {projectStatus === "on_track"
                            ? "On Track"
                            : projectStatus === "at_risk"
                              ? "At Risk"
                              : "Off Track"}
                        </span>
                      </Badge>
                    </div>
                    {isScrum && (
                      <div className="mt-1.5 flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <HugeiconsIcon
                            icon={ArrowReloadHorizontalIcon}
                            strokeWidth={3}
                            className="size-3 shrink-0"
                          />
                          <span>{activeSprint?.name || "Sprint 4"}</span>
                          <span className="text-border">·</span>
                          <span>
                            {activeSprint
                              ? `${format(new Date(activeSprint.startDate), "MMM d")} – ${format(new Date(activeSprint.endDate), "MMM d, yyyy")}`
                              : "Jul 8 – Jul 22, 2026"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Sprint progress bar, members, and New Task CTA */}
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <div className="mb-1 flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        Sprint Progress
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {totalTasksCount > 0
                          ? Math.round((doneTasksCount / totalTasksCount) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-1.5 w-36 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {doneTasksCount} of {totalTasksCount} tasks done
                    </div>
                  </div>
                  <div className="flex items-center">
                    {(selectedProject?.members || [])
                      .slice(0, 4)
                      .map((member: ProjectMember, idx: number) => (
                        <div
                          key={member.id}
                          className="border-surface -ml-2 rounded-full border-2 border-card first:ml-0"
                        >
                          <Avatar className="h-7 w-7 transition-all hover:scale-105">
                            <AvatarImage src={member.user?.image || ""} />
                            <AvatarFallback className="bg-muted text-2xs font-extrabold text-muted-foreground">
                              {member.user?.name
                                ? member.user?.name.charAt(0).toUpperCase()
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ))}
                    {(selectedProject?.members || []).length > 4 && (
                      <div className="border-surface -ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-medium text-muted-foreground">
                        +{(selectedProject?.members || []).length - 4}
                      </div>
                    )}
                  </div>
                  {canCreateTask && (
                    <Button
                      onClick={() => setIsCreateTaskOpen(true)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/95"
                    >
                      <HugeiconsIcon
                        icon={PlusSignIcon}
                        className="size-3.5 shrink-0"
                      />
                      <span>New Task</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs Row */}
            <div className="flex items-center gap-0.5 px-6">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link.path)
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={cn(
                      "mb-2 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-secondary text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span>{link.name}</span>
                  </Link>
                )
              })}
            </div>
          </header>

          {/* Settings Sub-Navbar (only when on a settings subpage) */}
          {pathname.includes("/settings") && (
            <div className="flex scrollbar-none items-center gap-1.5 overflow-x-auto border-b border-border bg-card/45 px-8 py-2">
              <span className="mr-3 text-2xs font-extrabold tracking-wider text-muted-foreground uppercase">
                Settings Module:
              </span>
              {settingsLinks.map((link) => {
                const isActive = pathname === link.path
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={cn(
                      buttonVariants({
                        variant: isActive ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "h-7 cursor-pointer px-3 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </div>
          )}
          {/* Children View Content */}
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-background">
            <Card
              plain
              className={cn(
                "mx-auto w-full max-w-full min-w-0",
                pathname.includes("/list") ||
                  pathname.includes("/board") ||
                  pathname.includes("/calendar")
                  ? ""
                  : "space-y-6"
              )}
            >
              <CardContent className="p-0">
                {showOnboarding && (
                  <Card className="relative mt-2 overflow-hidden p-6 shadow-xs backdrop-blur-md transition-all duration-300">
                    {/* Background glowing gradient using theme colors */}
                    <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />

                    <div className="relative">
                      <CardHeader className="p-0 pr-12 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                          <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            Getting Started Guide
                          </span>
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground">
                          {welcomeMessage}
                        </CardTitle>
                        <CardDescription className="max-w-xl text-xs text-muted-foreground">
                          {firstStepMessage}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex flex-col justify-between gap-6 p-0 md:flex-row md:items-center">
                        {/* Progress Bar */}
                        <div className="flex-grow space-y-1.5">
                          <div className="flex justify-between text-2xs font-semibold text-muted-foreground uppercase">
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

                        {/* Onboarding steps list */}
                        <div className="flex min-w-70 flex-col gap-2">
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
                                  className={cn(
                                    buttonVariants({ variant: "outline" }),
                                    buttonStyles
                                  )}
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
                              <Button
                                key={step.id}
                                type="button"
                                variant="outline"
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
                              </Button>
                            )
                          })}
                        </div>
                      </CardContent>
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
                  </Card>
                )}
                {children}
              </CardContent>
            </Card>
          </main>
        </Card>
      </Card>

      {/* Global Drawers & Dialogs */}
      {activeTaskId && (
        <TaskDetailsDrawer
          taskId={activeTaskId}
          projectId={projectId!}
          projectMembers={
            (selectedProject?.members || []) as (ProjectMember & {
              user: { id: string; name: string; image?: string | null }
            })[]
          }
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
          projectMembers={
            (selectedProject?.members || []) as (ProjectMember & {
              user: { id: string; name: string; image?: string | null }
            })[]
          }
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
