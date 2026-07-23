"use client"
import { useWorkspaceContext } from "@/components/providers/workspace-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { axiosInstance } from "@/lib/axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import React, { useState } from "react"
import { toast } from "sonner"

import { IconPicker } from "@/components/shared/icon-picker"
import { ProjectIcon } from "@/components/shared/project-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { getThumbUrl } from "@/lib/utils"
import {
  AlertDiamondIcon,
  ClipboardListIcon,
  DocumentValidationIcon,
  DollarSignIcon,
  KanbanIcon,
  Layers01Icon,
  MapsIcon,
  Megaphone01Icon,
  PlusSignIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface Project {
  id: string
  title: string
  projectKey: string
  description: string | null
  icon: string | null
  workspaceId: string
  createdAt: string
  _count?: {
    members: number
  }
}

interface ProjectTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  category: string
  isSystem: boolean
  config: Record<string, unknown>
}

const getTemplateIcon = (iconName: string | null) => {
  switch (iconName) {
    case "Layers":
      return <HugeiconsIcon icon={Layers01Icon} className="h-4 w-4" />
    case "Kanban":
      return <HugeiconsIcon icon={KanbanIcon} className="h-4 w-4" />
    case "UserPlus":
      return <HugeiconsIcon icon={UserAdd01Icon} className="h-4 w-4" />
    case "Megaphone":
      return <HugeiconsIcon icon={Megaphone01Icon} className="h-4 w-4" />
    case "DollarSign":
      return <HugeiconsIcon icon={DollarSignIcon} className="h-4 w-4" />
    case "Map":
      return <HugeiconsIcon icon={MapsIcon} className="h-4 w-4" />
    case "ClipboardList":
    default:
      return <HugeiconsIcon icon={ClipboardListIcon} className="h-4 w-4" />
  }
}

export default function ProjectsPage() {
  const params = useParams<{ workspaceSlug: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activeWorkspace, isLoading: isWorkspaceLoading } =
    useWorkspaceContext()

  // Create Project state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState("")
  const [newProjectKey, setNewProjectKey] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")
  const [newProjectIcon, setNewProjectIcon] = useState<string | File | null>(
    null
  )
  const [selectedTemplate, setSelectedTemplate] = useState("general-project")

  const handleProjectKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase()
    if (val.length <= 10) {
      setNewProjectKey(val)
    }
  }

  // Queries
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["projects", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return []
      const response = await axiosInstance.get(
        `/workspaces/${activeWorkspace.id}/projects`
      )
      return response.data.data
    },
    enabled: !!activeWorkspace,
  })

  const { data: templates } = useQuery<ProjectTemplate[]>({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const response = await axiosInstance.get("/project-templates")
      return response.data.data
    },
  })

  // Permissions Check
  const { hasPermission } = usePermissions()
  const isWorkspaceAdmin = hasPermission("project:create")

  // Upload project icon helper
  const uploadProjectIcon = async (projectId: string, file: File) => {
    const formData = new FormData()
    formData.append("icon", file)
    const response = await axiosInstance.post(
      `/media/project/${projectId}/icon`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    )
    return response.data.data.url
  }

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: {
      title: string
      projectKey: string
      description?: string
      icon?: string | File | null
      template: string
    }) => {
      const isFile = data.icon instanceof File
      const res = await axiosInstance.post(
        `/workspaces/${activeWorkspace?.id}/projects`,
        {
          title: data.title,
          projectKey: data.projectKey,
          description: data.description,
          icon: !isFile ? (data.icon as string | null) : undefined,
          template: data.template,
        }
      )
      const createdProject = res.data.data
      if (isFile && data.icon) {
        const iconUrl = await uploadProjectIcon(
          createdProject.id,
          data.icon as File
        )
        createdProject.icon = iconUrl
      }
      return createdProject
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", activeWorkspace?.id],
      })
      toast.success("Project created successfully")
      setIsCreateOpen(false)
      setNewProjectTitle("")
      setNewProjectKey("")
      setNewProjectDesc("")
      setNewProjectIcon(null)
      setSelectedTemplate("general-project")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to create project")
    },
  })


  if (isWorkspaceLoading || isProjectsLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm"
              >
                <div className="flex flex-row items-start gap-4 p-6 pb-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
                <div className="flex justify-between border-t bg-muted/30 px-6 py-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!activeWorkspace) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center">
        <HugeiconsIcon
          icon={AlertDiamondIcon}
          className="mb-4 h-12 w-12 text-muted-foreground"
        />
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          No Workspace Selected
        </h2>
        <p className="mt-1.5 max-w-sm text-center text-sm text-muted-foreground">
          Please select or create a workspace to view projects.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Projects
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your workspace projects, secure keys vaults, and document
              drives.
            </p>
          </div>
          {isWorkspaceAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger
                render={
                  <Button className="font-semibold shadow-sm transition-all duration-200">
                    <HugeiconsIcon
                      icon={PlusSignIcon}
                      className="mr-2 h-4 w-4"
                    />{" "}
                    New Project
                  </Button>
                }
              />
              <DialogContent className="border border-border/50 bg-card p-6 text-foreground shadow-lg sm:max-w-112.5">
                <DialogHeader className="space-y-1.5 border-b border-border/50 pb-4">
                  <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                    Create Project
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Add a new project to the workspace. Fill in the details
                    below.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Title Field */}
                  <div className="grid gap-1.5">
                    <label
                      htmlFor="title"
                      className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="title"
                      placeholder="e.g. Payment Gateway Integration"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-background text-xs"
                    />
                  </div>

                  {/* Project Key Field */}
                  <div className="grid gap-1.5">
                    <label
                      htmlFor="projectKey"
                      className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      Project Key <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="projectKey"
                      placeholder="Example: DEV"
                      value={newProjectKey}
                      onChange={handleProjectKeyChange}
                      className="h-9 rounded-lg border border-border bg-background text-xs uppercase"
                    />
                    <p className="text-2xs text-muted-foreground">
                      This key will be used to generate task IDs such as DEV-1,
                      DEV-2, and DEV-3.
                    </p>
                    <div className="mt-1 flex items-start gap-2 rounded-md border border-warning/20 bg-warning/10 p-2.5 text-warning">
                      <HugeiconsIcon
                        icon={AlertDiamondIcon}
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold">
                          Project Key cannot be changed
                        </p>
                        <p className="text-2xs leading-relaxed opacity-90">
                          Once the project is created, its key becomes permanent
                          and cannot be edited later. Choose a short, meaningful
                          key carefully.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className="grid gap-1.5">
                    <label
                      htmlFor="desc"
                      className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      Description
                    </label>
                    <Textarea
                      id="desc"
                      placeholder="Project description, objectives, or helpful details..."
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      className="min-h-20 rounded-lg border border-border bg-background text-xs"
                    />
                  </div>

                  {/* Template Picker */}
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Project Template
                    </label>
                    <SearchableSelect
                      value={selectedTemplate}
                      onValueChange={(val) => {
                        if (val) setSelectedTemplate(val)
                      }}
                      options={(templates || []).map((tpl) => ({
                        value: tpl.slug,
                        label: tpl.name,
                      }))}
                      placeholder="Select a template..."
                      searchPlaceholder="Search templates..."
                      emptyText="No templates found"
                      triggerClassName="h-9 text-xs"
                    />
                  </div>

                  {/* Icon Selector */}
                  <div className="grid gap-1.5">
                    <label
                      htmlFor="icon"
                      className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      Project Icon
                    </label>
                    <div className="flex items-center gap-3">
                      <IconPicker
                        value={
                          newProjectIcon instanceof File
                            ? URL.createObjectURL(newProjectIcon)
                            : (newProjectIcon as string | null)
                        }
                        onChange={(val) => setNewProjectIcon(val)}
                      />
                      <span className="text-xs leading-normal text-muted-foreground">
                        Choose a predefined icon &amp; color, or upload a custom image.
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter className="border-t border-border/50 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="h-9 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={
                      !newProjectTitle.trim() ||
                      newProjectKey.trim().length < 2 ||
                      createProjectMutation.isPending
                    }
                    onClick={() =>
                      createProjectMutation.mutate({
                        title: newProjectTitle,
                        projectKey: newProjectKey,
                        description: newProjectDesc,
                        icon: newProjectIcon || "📁",
                        template: selectedTemplate,
                      })
                    }
                    className="h-9 bg-primary text-xs text-primary-foreground"
                  >
                    {createProjectMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {projects && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <HugeiconsIcon
              icon={DocumentValidationIcon}
              className="mb-6 h-12 w-12 text-muted-foreground"
            />
            <h3 className="text-lg font-semibold text-foreground">
              No Projects Found
            </h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Get started by creating your first project in this workspace.
            </p>
            {isWorkspaceAdmin && (
              <Button
                className="mt-6 font-semibold"
                onClick={() => setIsCreateOpen(true)}
              >
                <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />{" "}
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {projects?.map((project) => (
              <Card
                key={project.id}
                onClick={() =>
                  router.push(`/${params.workspaceSlug}/projects/${project.id}`)
                }
                className="group relative flex cursor-pointer flex-col overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="flex items-start gap-4">
                  <ProjectIcon
                    icon={project.icon}
                    size="h-12 w-12"
                    iconSize="h-6 w-6"
                    className="transition-transform duration-300 group-hover:scale-105 border border-border/20 shadow-xs"
                  />
                  <div className="flex-1 space-y-1">
                    <h3 className="line-clamp-1 font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
                      {project.title}
                    </h3>
                    <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                      {project.description || "No description provided."}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="text-2xs font-medium tracking-wider text-muted-foreground uppercase">
                    {project.projectKey}
                  </span>
                  <Badge variant="secondary" className="px-2 py-0.5">
                    {project._count?.members || 0} members
                  </Badge>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
