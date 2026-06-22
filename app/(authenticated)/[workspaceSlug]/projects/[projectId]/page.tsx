"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useWorkspaceContext } from "@/components/providers/workspace-provider";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Plus,
  Trash,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  File as FileIcon,
  Upload,
  Download,
  ArrowLeft,
  Settings,
  Shield,
  FileText,
  UserPlus,
  MoreVertical,
  Search,
  Loader2,
  AlertCircle,
  Eye as ViewIcon,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { IconPicker } from "@/components/shared/icon-picker";
import { getThumbUrl } from "@/lib/utils";
import {
  useProjectTasks,
  useProjectStatuses,
  useProjectSprints,
  useProjectCustomFields,
  useCreateCustomField,
  useDeleteCustomField,
} from "@/features/tasks/hooks/use-tasks";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { TaskList } from "@/features/tasks/components/task-list";
import { TaskBacklog } from "@/features/tasks/components/task-backlog";
import { TaskReports } from "@/features/tasks/components/task-reports";
import { TaskDetailsDrawer } from "@/features/tasks/components/task-details-drawer";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { ProjectTimeline } from "@/features/tasks/components/project-timeline";
import { SlackWebhooksConfig } from "@/features/tasks/components/slack-webhooks-config";

// Disallowed client-side extensions to block malicious uploads
const DANGEROUS_EXTENSIONS = [
  "exe", "dll", "so", "elf", "dmg", "pkg", "app", "deb", "rpm", "msi", "msp",
  "sh", "bash", "bat", "cmd", "vbs", "vbe", "js", "ts", "html", "htm", "php",
  "py", "pl", "rb", "ps1", "jar", "lnk", "sys", "com", "scr"
];

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

interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface VaultItem {
  id: string;
  serviceId: string;
  key: string;
  value: string;
  note: string | null;
  createdAt: string;
}

interface VaultService {
  id: string;
  vaultId: string;
  name: string;
  items: VaultItem[];
}

interface Vault {
  id: string;
  projectId: string;
  services: VaultService[];
}

interface ProjectFile {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
}

export default function ProjectDetailsPage() {
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeWorkspace, isLoading: isWorkspaceLoading } = useWorkspaceContext();
  const { data: auth } = useCurrentUser();
  const currentUser = auth?.user as { id?: string; name?: string; email?: string } | undefined;
  const { data: activeMember } = authClient.useActiveMember();

  // Active view state
  const [activeTab, setActiveTab] = useState("overview");

  // Edit Project state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIcon, setEditIcon] = useState<string | File | null>(null);

  // Member Management Dialog state
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Add Service State
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");

  // Add Vault Item State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newNote, setNewNote] = useState("");

  // Masking state for Vault Items
  const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Queries
  const { data: selectedProject, isLoading: isProjectDetailLoading } = useQuery<any>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}`);
      return response.data.data;
    },
    enabled: !!projectId,
  });

  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get("taskId");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (urlTaskId) {
      setActiveTaskId(urlTaskId);
    }
  }, [urlTaskId]);

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const { data: tasks } = useProjectTasks(projectId || "");
  const { data: statuses } = useProjectStatuses(projectId || "");
  const { data: sprints } = useProjectSprints(projectId || "");
  const activeSprint = sprints?.find((s: any) => s.status === "active");

  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "date" | "select" | "checkbox">("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");

  const { data: customFields } = useProjectCustomFields(projectId || "");
  const createCustomFieldMutation = useCreateCustomField(projectId || "");
  const deleteCustomFieldMutation = useDeleteCustomField(projectId || "");

  const { data: workspaceMembers } = useQuery<WorkspaceMember[]>({
    queryKey: ["workspace-members", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      const response = await axiosInstance.get(`/workspaces/${activeWorkspace.id}/members`);
      return response.data.data;
    },
    enabled: !!activeWorkspace,
  });

  const { data: vault, isLoading: isVaultLoading } = useQuery<Vault>({
    queryKey: ["vault", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/vault`);
      return response.data.data;
    },
    enabled: !!projectId && activeTab === "vault",
  });

  const { data: files, isLoading: isFilesLoading } = useQuery<ProjectFile[]>({
    queryKey: ["files", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/files`);
      return response.data.data;
    },
    enabled: !!projectId && activeTab === "files",
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
  const updateProjectMutation = useMutation({
    mutationFn: async (data: { title?: string; description?: string; icon?: string | File | null }) => {
      const isFile = data.icon instanceof File;
      const patchData = {
        title: data.title,
        description: data.description,
        icon: !isFile ? (data.icon as string | null) : undefined,
      };
      const res = await axiosInstance.patch(`/projects/${projectId}`, patchData);
      const updatedProject = res.data.data;
      if (isFile && data.icon) {
        const iconUrl = await uploadProjectIcon(projectId!, data.icon as File);
        updatedProject.icon = iconUrl;
      }
      return updatedProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", activeWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Project details updated");
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update project");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      return axiosInstance.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", activeWorkspace?.id] });
      toast.success("Project deleted successfully");
      router.push(`/${workspaceSlug}/projects`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete project");
    },
  });

  const manageMembersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      return axiosInstance.post(`/projects/${projectId}/members`, { userIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Project members updated");
      setIsManageMembersOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to assign members");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return axiosInstance.delete(`/projects/${projectId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Member removed from project");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove member");
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: async (name: string) => {
      return axiosInstance.post(`/projects/${projectId}/vault/services`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", projectId] });
      toast.success("Service added to vault");
      setIsAddServiceOpen(false);
      setNewServiceName("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add service");
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return axiosInstance.delete(`/projects/${projectId}/vault/services/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", projectId] });
      toast.success("Service deleted");
    },
  });

  const saveVaultItemMutation = useMutation({
    mutationFn: async (data: { serviceId: string; key: string; value: string; note?: string }) => {
      return axiosInstance.post(`/projects/${projectId}/vault/services/${data.serviceId}/items`, {
        key: data.key,
        value: data.value,
        note: data.note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", projectId] });
      toast.success("Secret saved securely");
      setIsAddItemOpen(false);
      setNewKey("");
      setNewValue("");
      setNewNote("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save secret");
    },
  });

  const deleteVaultItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return axiosInstance.delete(`/projects/${projectId}/vault/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", projectId] });
      toast.success("Secret deleted");
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return axiosInstance.post(`/projects/${projectId}/files`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] });
      toast.success("File uploaded and secured");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Upload failed");
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return axiosInstance.delete(`/projects/${projectId}/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] });
      toast.success("File deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete file");
    },
  });

  // Handle Edit Dialog Prep
  useEffect(() => {
    if (selectedProject) {
      setEditTitle(selectedProject.title || "");
      setEditDesc(selectedProject.description || "");
      setEditIcon(selectedProject.icon || null);
      // Prep selected members
      const memberIds = selectedProject.members?.map((m: any) => m.userId) || [];
      setSelectedMembers(memberIds);
    }
  }, [selectedProject]);

  // Handle File Upload Change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext && DANGEROUS_EXTENSIONS.includes(ext)) {
      toast.error("Blocked: Uploading executable or script files is prohibited for security.", {
        duration: 5000,
      });
      return;
    }

    uploadFileMutation.mutate(file);
  };

  const handleCopy = (itemId: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedItemId(itemId);
    toast.success("Value copied to clipboard");
    setTimeout(() => setCopiedItemId(null), 2000);
  };

  const toggleReveal = (itemId: string) => {
    setRevealedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

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
        <div className={`${baseClasses} ${sizeClass} overflow-hidden border bg-background`}>
          <img src={thumbUrl} alt="Project Icon" className="h-full w-full object-cover" />
        </div>
      );
    }
    return (
      <span className={`${baseClasses} ${sizeClass} bg-secondary ${textClass} leading-none`}>
        {icon}
      </span>
    );
  };

  // Renderers
  if (isWorkspaceLoading || isProjectDetailLoading) {
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
        {/* Back button and title */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/${workspaceSlug}/projects`)}
              className="h-10 w-10 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              {renderProjectIcon(selectedProject?.icon, "h-14 w-14", "text-3xl")}
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{selectedProject?.title}</h1>
                <p className="text-muted-foreground text-sm">Active Workspace Project</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setIsCreateTaskOpen(true)} className="text-xs h-8">
              <Plus size={14} className="mr-1.5 h-4 w-4" /> Create Task
            </Button>

            {isWorkspaceAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>

                {/* Edit Project Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogContent className="sm:max-w-[550px] border border-slate-800 text-slate-100 p-6 max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-slate-100 font-bold">Project Settings</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Configure project settings and custom fields.
                      </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full mt-4">
                      <TabsList className="grid grid-cols-2 bg-slate-950 p-1 mb-4 border border-slate-800">
                        <TabsTrigger value="general">General Details</TabsTrigger>
                        <TabsTrigger value="custom-fields">Custom Properties</TabsTrigger>
                      </TabsList>

                      <TabsContent value="general" className="space-y-4">
                        <div className="grid gap-4 py-2">
                          <div className="grid gap-2">
                            <label htmlFor="edit-title" className="text-sm font-semibold">
                              Title
                            </label>
                            <Input
                              id="edit-title"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="bg-slate-950 border-slate-800 text-slate-200"
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="edit-desc" className="text-sm font-semibold">
                              Description
                            </label>
                            <Textarea
                              id="edit-desc"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="bg-slate-950 border-slate-800 text-slate-200"
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="edit-icon" className="text-sm font-semibold">
                              Project Icon
                            </label>
                            <div className="flex items-center gap-3">
                              <IconPicker
                                value={editIcon instanceof File ? URL.createObjectURL(editIcon) : (editIcon as string | null)}
                                onChange={(val) => setEditIcon(val)}
                              />
                              <span className="text-xs text-muted-foreground">
                                Choose an emoji or upload an image.
                              </span>
                            </div>
                          </div>
                        </div>
                        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between pt-4 border-t border-slate-800">
                          <Button
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Are you absolutely sure you want to delete this project? This will permanently delete its keys vault, members, and uploaded files.")) {
                                deleteProjectMutation.mutate();
                              }
                            }}
                            disabled={deleteProjectMutation.isPending}
                          >
                            Delete Project
                          </Button>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-200">
                              Cancel
                            </Button>
                            <Button
                              disabled={!editTitle.trim() || updateProjectMutation.isPending}
                              onClick={() =>
                                updateProjectMutation.mutate({
                                  title: editTitle,
                                  description: editDesc,
                                  icon: editIcon,
                                })
                              }
                            >
                              {updateProjectMutation.isPending ? "Saving..." : "Save Details"}
                            </Button>
                          </div>
                        </DialogFooter>
                      </TabsContent>

                      <TabsContent value="custom-fields" className="space-y-4">
                        <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
                          {customFields && customFields.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No custom fields defined for this project.</p>
                          ) : (
                            customFields?.map((field: any) => (
                              <div key={field.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                                <div className="text-xs">
                                  <p className="font-semibold text-slate-200">{field.name}</p>
                                  <p className="text-[10px] text-slate-500 capitalize">{field.type}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-red-400"
                                  onClick={() => deleteCustomFieldMutation.mutate(field.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!newFieldName.trim()) return;
                            const optionsList = newFieldOptions
                              ? newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean)
                              : [];
                            createCustomFieldMutation.mutate({
                              name: newFieldName.trim(),
                              type: newFieldType,
                              options: optionsList,
                            }, {
                              onSuccess: () => {
                                setNewFieldName("");
                                setNewFieldOptions("");
                                setNewFieldType("text");
                              }
                            });
                          }}
                          className="space-y-4 border-t border-slate-800 pt-4"
                        >
                          <span className="text-xs font-bold text-primary uppercase tracking-wider block">Add Custom Property</span>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-slate-400 font-semibold">Property Name</label>
                              <Input
                                placeholder="e.g. Campaign Budget"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-xs h-8 text-slate-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-slate-400 font-semibold">Type</label>
                              <select
                                value={newFieldType}
                                onChange={(e) => setNewFieldType(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary h-8"
                              >
                                <option value="text">Text (Single Line)</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="select">Dropdown Choice</option>
                                <option value="checkbox">Checkbox (Yes/No)</option>
                              </select>
                            </div>
                          </div>

                          {newFieldType === "select" && (
                            <div className="space-y-1">
                              <label className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                                <span>Options (Comma-separated)</span>
                                <span className="text-[9px] text-slate-500 font-normal">e.g. Pending, Approved, Blocked</span>
                              </label>
                              <Input
                                placeholder="Option 1, Option 2, Option 3..."
                                value={newFieldOptions}
                                onChange={(e) => setNewFieldOptions(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-xs h-8 text-slate-200"
                              />
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setIsEditOpen(false);
                                setNewFieldName("");
                                setNewFieldOptions("");
                                setNewFieldType("text");
                              }}
                              className="h-8 text-xs text-slate-400 hover:text-slate-200"
                            >
                              Close
                            </Button>
                            <Button
                              type="submit"
                              disabled={!newFieldName.trim() || createCustomFieldMutation.isPending}
                              className="h-8 text-xs font-semibold"
                            >
                              Add Property
                            </Button>
                          </div>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Board</TabsTrigger>
            <TabsTrigger value="list">Tasks List</TabsTrigger>
            {selectedProject?.template === "scrum" && (
              <TabsTrigger value="backlog">Backlog Planner</TabsTrigger>
            )}
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="vault">Secrets Vault</TabsTrigger>
            <TabsTrigger value="files">Secure Files</TabsTrigger>
            <TabsTrigger value="integrations">Slack Integrations</TabsTrigger>
          </TabsList>

          {/* TAB: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h4>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedProject?.description || "No description has been added to this project."}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Details</h4>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Created</span>
                        <span className="font-medium">
                          {selectedProject && new Date(selectedProject.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Workspace ID</span>
                        <span className="font-mono text-xs">{selectedProject?.workspaceId}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MEMBERS MANAGEMENT */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Project Members</CardTitle>
                  {isWorkspaceAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsManageMembersOpen(true)}
                      className="h-8 w-8 rounded-full hover:bg-muted"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProject?.members && selectedProject.members.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No assigned members. Use the button above to assign workspace members to this project.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedProject?.members?.map((member: ProjectMember) => (
                        <div key={member.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.user.image || ""} />
                              <AvatarFallback className="text-xs uppercase">
                                {member.user.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold leading-none">{member.user.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{member.user.email}</p>
                            </div>
                          </div>
                          {isWorkspaceAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm(`Remove ${member.user.name} from this project?`)) {
                                  removeMemberMutation.mutate(member.userId);
                                }
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Manage Members Dialog */}
            <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>Manage Project Members</DialogTitle>
                  <DialogDescription>
                    Assign members from this workspace to the project. Only users added to the workspace are listed.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[300px] overflow-y-auto py-4 space-y-3">
                  {workspaceMembers?.map((wMember) => {
                    const isChecked = selectedMembers.includes(wMember.userId);
                    return (
                      <div
                        key={wMember.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={wMember.user.image || ""} />
                            <AvatarFallback className="text-xs uppercase">
                              {wMember.user.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold leading-none">{wMember.user.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{wMember.user.email}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          onChange={() => {
                            if (isChecked) {
                              setSelectedMembers((prev) => prev.filter((id) => id !== wMember.userId));
                            } else {
                              setSelectedMembers((prev) => [...prev, wMember.userId]);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsManageMembersOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => manageMembersMutation.mutate(selectedMembers)}
                    disabled={manageMembersMutation.isPending}
                  >
                    Save Assignment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* TAB: SECRETS VAULT */}
          <TabsContent value="vault" className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Credentials & Keys Vault
                </h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  AES-256 encrypted server-side storage. Values are protected and decrypted only when requested.
                </p>
              </div>
              <Button onClick={() => setIsAddServiceOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </div>

            {isVaultLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner />
              </div>
            ) : vault?.services && vault.services.length === 0 ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center bg-card shadow-sm">
                <Lock className="h-8 w-8 text-muted-foreground mb-3" />
                <h4 className="font-bold">Vault Empty</h4>
                <p className="text-muted-foreground mt-1 text-sm max-w-xs">
                  Securely store credentials for chatgpt, aws, stripe or other services.
                </p>
                <Button variant="secondary" className="mt-3" onClick={() => setIsAddServiceOpen(true)}>
                  Add First Service
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {vault?.services?.map((service) => (
                  <Card key={service.id} className="overflow-hidden border border-border/80">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 py-3 px-6">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider">{service.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setActiveServiceId(service.id);
                            setIsAddItemOpen(true);
                          }}
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Secret
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`Delete the service "${service.name}" and all of its secrets permanently?`)) {
                              deleteServiceMutation.mutate(service.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {service.items.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                          No credentials stored. Click "Add Secret" above.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="border-b bg-muted/10 text-xs font-semibold text-muted-foreground">
                                <th className="p-3 pl-6">Key / Name</th>
                                <th className="p-3">Secret Value</th>
                                <th className="p-3">Notes</th>
                                <th className="p-3 pr-6 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {service.items.map((item) => {
                                const isRevealed = !!revealedItems[item.id];
                                const isCopied = copiedItemId === item.id;
                                return (
                                  <tr key={item.id} className="border-b hover:bg-muted/15 transition-colors">
                                    <td className="p-3 pl-6 font-mono text-xs font-semibold text-foreground/80">
                                      {item.key}
                                    </td>
                                    <td className="p-3 font-mono text-xs max-w-xs truncate">
                                      {isRevealed ? (
                                        <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/20 break-all whitespace-normal">
                                          {item.value}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground tracking-widest font-sans font-black select-none">
                                          ••••••••••••••••
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-xs max-w-xs truncate text-muted-foreground whitespace-pre-wrap leading-tight">
                                      {item.note || "—"}
                                    </td>
                                    <td className="p-3 pr-6 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => toggleReveal(item.id)}
                                        >
                                          {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => handleCopy(item.id, item.value)}
                                        >
                                          {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                          onClick={() => {
                                            if (confirm("Delete this secret credential?")) {
                                              deleteVaultItemMutation.mutate(item.id);
                                            }
                                          }}
                                        >
                                          <Trash className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB: SECURE FILES */}
          <TabsContent value="files" className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Project Drive
                </h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Store and share documents, CSVs, PDFs, images, spreadsheets, and presentation files.
                </p>
              </div>

              <div className="relative">
                <input
                  type="file"
                  id="project-file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadFileMutation.isPending}
                />
                <label htmlFor="project-file-upload">
                  <Button disabled={uploadFileMutation.isPending} className="cursor-pointer">
                    {uploadFileMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload File
                  </Button>
                </label>
              </div>
            </div>

            {isFilesLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner />
              </div>
            ) : files && files.length === 0 ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center bg-card shadow-sm">
                <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                <h4 className="font-bold">No Files Uploaded</h4>
                <p className="text-muted-foreground mt-1 text-sm max-w-xs">
                  Upload images, PDFs, docs, spreadsheets, or CSVs. Executable/script files are automatically blocked.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
                        <th className="p-3 pl-6">Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Uploaded</th>
                        <th className="p-3 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files?.map((file) => (
                        <tr key={file.id} className="border-b hover:bg-muted/15 transition-colors">
                          <td className="p-3 pl-6">
                            <div className="flex items-center gap-3">
                              <FileIcon className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{file.name}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">{file.mimeType}</td>
                          <td className="p-3 text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                render={<a href={file.url} download target="_blank" rel="noreferrer" />}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm(`Delete the file "${file.name}" permanently?`)) {
                                    deleteFileMutation.mutate(file.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB: ROADMAP TIMELINE */}
          <TabsContent value="timeline" className="space-y-6">
            <ProjectTimeline
              workspaceId={activeWorkspace?.id || ""}
              onSelectTask={setActiveTaskId}
            />
          </TabsContent>

          {/* TAB: SLACK INTEGRATIONS */}
          <TabsContent value="integrations" className="space-y-6">
            <SlackWebhooksConfig projectId={projectId!} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <TaskBoard
              projectId={projectId!}
              tasks={tasks || []}
              statuses={statuses || []}
              sprints={sprints || []}
              projectTemplate={selectedProject?.template || "simple"}
              projectMembers={selectedProject?.members || []}
              onSelectTask={setActiveTaskId}
            />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <TaskList
              tasks={tasks || []}
              statuses={statuses || []}
              projectMembers={selectedProject?.members || []}
              projectTemplate={selectedProject?.template || "simple"}
              onSelectTask={setActiveTaskId}
            />
          </TabsContent>

          {selectedProject?.template === "scrum" && (
            <TabsContent value="backlog" className="space-y-4">
              <TaskBacklog
                projectId={projectId!}
                tasks={tasks || []}
                sprints={sprints || []}
                statuses={statuses || []}
                projectMembers={selectedProject?.members || []}
                onSelectTask={setActiveTaskId}
              />
            </TabsContent>
          )}

          <TabsContent value="reports" className="space-y-4">
            <TaskReports
              tasks={tasks || []}
              sprints={sprints || []}
              projectMembers={selectedProject?.members || []}
              projectTemplate={selectedProject?.template || "simple"}
            />
          </TabsContent>
        </Tabs>
      </div>

      {activeTaskId && (
        <TaskDetailsDrawer
          taskId={activeTaskId}
          projectId={projectId!}
          projectMembers={selectedProject?.members || []}
          projectStatuses={statuses || []}
          projectSprints={sprints || []}
          projectTemplate={selectedProject?.template || "simple"}
          onClose={() => {
            setActiveTaskId(null);
            const params = new URLSearchParams(window.location.search);
            params.delete("taskId");
            const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
            router.push(newUrl);
          }}
        />
      )}

      {isCreateTaskOpen && (
        <CreateTaskDialog
          open={isCreateTaskOpen}
          projectId={projectId!}
          projectMembers={selectedProject?.members || []}
          projectStatuses={statuses || []}
          projectSprints={sprints || []}
          projectTemplate={selectedProject?.template || "simple"}
          onOpenChange={setIsCreateTaskOpen}
        />
      )}

      {/* Add Service Dialog */}
      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Vault Service</DialogTitle>
            <DialogDescription>
              Create a category like ChatGPT, AWS, or Stripe to group secret keys.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="service-name" className="text-sm font-semibold">
                Service Name
              </label>
              <Input
                id="service-name"
                placeholder="e.g. OpenAI / ChatGPT"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddServiceOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newServiceName.trim() || addServiceMutation.isPending}
              onClick={() => addServiceMutation.mutate(newServiceName)}
            >
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Secret Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Secret Credential</DialogTitle>
            <DialogDescription>
              Securely store keys, login usernames, passwords, or urls under this service.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="secret-key" className="text-sm font-semibold">
                Key Name
              </label>
              <Input
                id="secret-key"
                placeholder="e.g. API_SECRET_KEY, DB_PASSWORD"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="secret-value" className="text-sm font-semibold">
                Value (Confidential)
              </label>
              <Input
                id="secret-value"
                type="password"
                placeholder="Paste credential value here"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="secret-note" className="text-sm font-semibold">
                Note / Description (Optional)
              </label>
              <Textarea
                id="secret-note"
                placeholder="Additional details, connection notes, usage details..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newKey.trim() || !newValue.trim() || saveVaultItemMutation.isPending}
              onClick={() =>
                saveVaultItemMutation.mutate({
                  serviceId: activeServiceId!,
                  key: newKey,
                  value: newValue,
                  note: newNote,
                })
              }
            >
              Save Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
