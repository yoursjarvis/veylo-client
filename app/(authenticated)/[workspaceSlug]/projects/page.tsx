"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useWorkspaceContext } from "@/components/providers/workspace-provider";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, FileText, Loader2, AlertCircle, Layers, Kanban, UserPlus, Megaphone, DollarSign, Map, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { IconPicker } from "@/components/shared/icon-picker";
import { getThumbUrl, cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  workspaceId: string;
  createdAt: string;
  _count?: {
    members: number;
  };
}

interface WorkspaceMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface ProjectTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  category: string;
  isSystem: boolean;
  config: Record<string, unknown>;
}

const getTemplateIcon = (iconName: string | null) => {
  switch (iconName) {
    case "Layers":
      return <Layers className="h-5 w-5" />;
    case "Kanban":
      return <Kanban className="h-5 w-5" />;
    case "UserPlus":
      return <UserPlus className="h-5 w-5" />;
    case "Megaphone":
      return <Megaphone className="h-5 w-5" />;
    case "DollarSign":
      return <DollarSign className="h-5 w-5" />;
    case "Map":
      return <Map className="h-5 w-5" />;
    case "ClipboardList":
    default:
      return <ClipboardList className="h-5 w-5" />;
  }
};

export default function ProjectsPage() {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeWorkspace, isLoading: isWorkspaceLoading } = useWorkspaceContext();
  const { data: auth } = useCurrentUser();
  const currentUser = auth?.user as { id?: string; name?: string; email?: string } | undefined;
  const { data: activeMember } = authClient.useActiveMember();

  // Create Project state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectIcon, setNewProjectIcon] = useState<string | File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("general-project");

  // Queries
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["projects", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      const response = await axiosInstance.get(`/workspaces/${activeWorkspace.id}/projects`);
      return response.data.data;
    },
    enabled: !!activeWorkspace,
  });

  const { data: workspaceMembers } = useQuery<WorkspaceMember[]>({
    queryKey: ["workspace-members", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      const response = await axiosInstance.get(`/workspaces/${activeWorkspace.id}/members`);
      return response.data.data;
    },
    enabled: !!activeWorkspace,
  });

  const { data: templates } = useQuery<ProjectTemplate[]>({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const response = await axiosInstance.get("/project-templates");
      return response.data.data;
    },
  });

  // Permissions Check
  const userRole = activeMember?.role;
  const isOrgAdmin = userRole === "owner" || userRole === "admin";
  const myWorkspaceMember = workspaceMembers?.find((m) => m.userId === currentUser?.id);
  const isWorkspaceAdmin = isOrgAdmin || myWorkspaceMember?.role === "admin";

  // Upload project icon helper
  const uploadProjectIcon = async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append("icon", file);
    const response = await axiosInstance.post(`/media/project/${projectId}/icon`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data.url;
  };

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; icon?: string | File | null; template: string }) => {
      const isFile = data.icon instanceof File;
      const res = await axiosInstance.post(`/workspaces/${activeWorkspace?.id}/projects`, {
        title: data.title,
        description: data.description,
        icon: !isFile ? (data.icon as string | null) : undefined,
        template: data.template,
      });
      const createdProject = res.data.data;
      if (isFile && data.icon) {
        const iconUrl = await uploadProjectIcon(createdProject.id, data.icon as File);
        createdProject.icon = iconUrl;
      }
      return createdProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", activeWorkspace?.id] });
      toast.success("Project created successfully");
      setIsCreateOpen(false);
      setNewProjectTitle("");
      setNewProjectDesc("");
      setNewProjectIcon(null);
      setSelectedTemplate("general-project");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to create project");
    },
  });

  const renderProjectIcon = (icon?: string | null, sizeClass = "h-12 w-12", textClass = "text-2xl") => {
    const baseClasses = `flex items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110`;
    if (!icon) {
      return (
        <span className={`${baseClasses} ${sizeClass} bg-secondary ${textClass}`}>
          📁
        </span>
      );
    }
    if (icon.startsWith("http") || icon.startsWith("/") || icon.startsWith("blob:")) {
      const thumbUrl = icon.startsWith("blob:") ? icon : getThumbUrl(icon) || icon;
      return (
        <div className={`${baseClasses} ${sizeClass} overflow-hidden border bg-background relative`}>
          <Image src={thumbUrl} alt="Project Icon" fill className="object-cover" />
        </div>
      );
    }
    return (
      <span className={`${baseClasses} ${sizeClass} bg-secondary ${textClass} leading-none`}>
        {icon}
      </span>
    );
  };

  if (isWorkspaceLoading || isProjectsLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4">
        <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Workspace Selected</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          Please select or create a workspace to view projects.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your workspace projects, secure keys vaults, and document drives.
            </p>
          </div>
          {isWorkspaceAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger
                render={
                  <Button className="font-semibold shadow-sm transition-all duration-200">
                    <Plus className="mr-2 h-4 w-4" /> New Project
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[650px] bg-card border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                  <DialogDescription>
                    Add a new project to the workspace. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  {/* Identity Fields */}
                  <div className="space-y-4">
                    <div className="grid gap-1.5">
                      <label htmlFor="title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Title <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="title"
                        placeholder="e.g. Payment Gateway Integration"
                        value={newProjectTitle}
                        onChange={(e) => setNewProjectTitle(e.target.value)}
                        className="bg-background border-border text-xs h-9"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label htmlFor="desc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Description
                      </label>
                      <Textarea
                        id="desc"
                        placeholder="Project description, objectives, or helpful details..."
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        className="bg-background border-border text-xs min-h-[100px]"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label htmlFor="icon" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Project Icon
                      </label>
                      <div className="flex items-center gap-3">
                        <IconPicker
                          value={newProjectIcon instanceof File ? URL.createObjectURL(newProjectIcon) : (newProjectIcon as string | null)}
                          onChange={(val) => setNewProjectIcon(val)}
                        />
                        <span className="text-[11px] text-muted-foreground leading-normal">
                          Choose an emoji or upload an image logo.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Template Picker Grid */}
                  <div className="space-y-3 flex flex-col min-h-0">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Select Project Template
                    </label>
                    <div className="flex-1 overflow-y-auto max-h-[260px] pr-1 space-y-2">
                      {templates?.map((tpl) => {
                        const isSelected = selectedTemplate === tpl.slug;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setSelectedTemplate(tpl.slug)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border text-xs transition-all flex items-start gap-3",
                              isSelected
                                ? "bg-primary/10 border-primary shadow-sm"
                                : "bg-background border-border hover:bg-muted/50"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg border",
                              isSelected ? "bg-primary/20 border-primary/30" : "bg-card border-border"
                            )}>
                              {getTemplateIcon(tpl.icon)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground text-xs leading-none">{tpl.name}</span>
                                <Badge variant="outline" className="text-[9px] uppercase py-0 leading-none">
                                  {tpl.category}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                {tpl.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                      {templates?.length === 0 && (
                        <div className="py-6 text-center text-xs text-muted-foreground italic border rounded-lg border-dashed">
                          No project templates found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className="border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs h-9">
                    Cancel
                  </Button>
                  <Button
                    disabled={!newProjectTitle.trim() || createProjectMutation.isPending}
                    onClick={() =>
                      createProjectMutation.mutate({
                        title: newProjectTitle,
                        description: newProjectDesc,
                        icon: newProjectIcon || "📁",
                        template: selectedTemplate,
                      })
                    }
                    className="text-xs h-9"
                  >
                    {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {projects && projects.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-card shadow-sm">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No Projects Found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Get started by creating your very first project inside the active workspace.
            </p>
            {isWorkspaceAdmin && (
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => (
              <Card
                key={project.id}
                onClick={() => router.push(`/${params.workspaceSlug}/projects/${project.id}`)}
                className="group relative flex flex-col justify-between overflow-hidden cursor-pointer hover:border-foreground/35 hover:shadow-md transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-start gap-4 pb-4">
                  {renderProjectIcon(project.icon, "h-12 w-12", "text-2xl")}
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors duration-200">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {project.description || "No description provided."}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardFooter className="border-t bg-muted/30 px-6 py-3 text-xs text-muted-foreground flex justify-between">
                  <span>
                    Created: {new Date(project.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                  <Badge variant="secondary" className="px-2 py-0.5 rounded-md">
                    {project._count?.members || 0} members
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
