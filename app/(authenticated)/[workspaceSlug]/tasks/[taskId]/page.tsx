"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import {
  ArrowLeft,
  Trash,
  Plus,
  Clock,
  FileText,
  Activity,
  MessageSquare,
  CheckCircle2,
  Calendar as CalendarIcon,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import {
  useTaskDetails,
  useUpdateTask,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
  useProjectCustomFields,
  useTaskDependencies,
  useCreateTaskDependency,
  useDeleteTaskDependency,
  useProjectStatuses,
  useProjectSprints,
} from "@/features/tasks/hooks/use-tasks";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const taskId = params.taskId as string;

  const { data: currentUser } = useCurrentUser();
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const { data: task, isLoading: isTaskLoading } = useTaskDetails(taskId);
  const projectId = task?.projectId;

  // Project details for members and template
  const { data: selectedProject } = useQuery<any>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}`);
      return response.data.data;
    },
    enabled: !!projectId,
  });

  const { data: customFieldDefinitions } = useProjectCustomFields(projectId || "");
  const { data: projectStatuses = [] } = useProjectStatuses(projectId || "");
  const { data: projectSprints = [] } = useProjectSprints(projectId || "");
  const projectMembers = selectedProject?.members || [];
  const projectTemplate = selectedProject?.template || "simple";

  const updateTaskMutation = useUpdateTask(projectId || "", taskId);
  const createSubtaskMutation = useCreateSubtask(taskId);
  const updateSubtaskMutation = useUpdateSubtask(taskId);
  const deleteSubtaskMutation = useDeleteSubtask(taskId);
  const createCommentMutation = useCreateComment(taskId);
  const deleteCommentMutation = useDeleteComment(taskId);
  const updateCommentMutation = useUpdateComment(taskId);

  const { data: dependencies = { blockedBy: [], blocking: [] }, isLoading: isDepsLoading } = useTaskDependencies(taskId);
  const createDepMutation = useCreateTaskDependency(taskId);
  const deleteDepMutation = useDeleteTaskDependency(taskId);

  const [isLinking, setIsLinking] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState("");
  const [targetTaskId, setTargetTaskId] = useState("");
  const [depDirection, setDepDirection] = useState<"blocks" | "blocked_by">("blocked_by");

  // Fetch workspace projects for linking dependencies
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", workspaceSlug],
    queryFn: async () => {
      const response = await axiosInstance.get(`/workspaces/slug/${workspaceSlug}/projects`);
      return response.data.data;
    },
    enabled: isLinking,
  });

  // Fetch tasks of selected target project
  const { data: projectTasks = [] } = useQuery({
    queryKey: ["project-tasks", targetProjectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${targetProjectId}/tasks`);
      return response.data.data;
    },
    enabled: !!targetProjectId && isLinking,
  });

  // Filter tasks: exclude current task and already linked tasks
  const linkedTaskIds = new Set([
    ...(dependencies.blockedBy || []).map((d: any) => d.task.id),
    ...(dependencies.blocking || []).map((d: any) => d.task.id),
    taskId,
  ]);
  const availableTasks = projectTasks.filter((t: any) => !linkedTaskIds.has(t.id) && !t.deletedAt);

  const handleLinkDependency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTaskId) return;

    createDepMutation.mutate(
      { dependencyTaskId: targetTaskId, direction: depDirection },
      {
        onSuccess: () => {
          setTargetTaskId("");
          setIsLinking(false);
        },
      }
    );
  };

  // Local state
  const [localTitle, setLocalTitle] = useState("");
  const [localDesc, setLocalDesc] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (task) {
      setLocalTitle(task.title || "");
      setLocalDesc(task.description || "");
    }
  }, [task]);

  const handleFieldChange = (field: string, value: any) => {
    updateTaskMutation.mutate({ [field]: value });
  };

  const handleCustomFieldChange = (fieldKey: string, value: any) => {
    const existingCustomFields = task?.customFields || {};
    const updated = { ...existingCustomFields, [fieldKey]: value };
    handleFieldChange("customFields", updated);
  };

  const handleTitleBlur = () => {
    if (localTitle.trim() && localTitle !== task?.title) {
      handleFieldChange("title", localTitle.trim());
    }
  };

  const handleDescBlur = () => {
    if (localDesc !== task?.description) {
      handleFieldChange("description", localDesc);
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    createSubtaskMutation.mutate({ title: newSubtaskTitle.trim() });
    setNewSubtaskTitle("");
  };

  const handleAddComment = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const cleanContent = newComment.replace(/<[^>]*>/g, "").trim();
    if (!cleanContent && !newComment.includes("<img")) return;
    createCommentMutation.mutate({ content: newComment.trim() });
    setNewComment("");
  };

  const handleAddReply = (parentId: string) => {
    const cleanContent = replyContent.replace(/<[^>]*>/g, "").trim();
    if (!cleanContent && !replyContent.includes("<img")) return;
    createCommentMutation.mutate(
      { content: replyContent.trim(), parentId },
      {
        onSuccess: () => {
          setReplyContent("");
          setReplyingToCommentId(null);
        },
      }
    );
  };

  const handleUpdateComment = (commentId: string) => {
    const cleanContent = editingContent.replace(/<[^>]*>/g, "").trim();
    if (!cleanContent && !editingContent.includes("<img")) return;
    updateCommentMutation.mutate(
      { commentId, content: editingContent.trim() },
      {
        onSuccess: () => {
          setEditingContent("");
          setEditingCommentId(null);
        },
      }
    );
  };

  const copyTaskUrl = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast.success("Task link copied to clipboard");
  };

  if (isTaskLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></span>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-4 text-foreground bg-background">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-bold">Task not found</h3>
        <p className="text-sm text-muted-foreground">The task you are looking for does not exist or has been deleted.</p>
        <Button onClick={() => router.push(`/${workspaceSlug}/dashboard`)}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground min-h-screen">
      {/* Top Breadcrumbs & Action Bar */}
      <div className="border-b border-border bg-card/40 py-4 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}`)}
              title="Back to project"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>Projects</span>
                <span>/</span>
                <span className="truncate max-w-[150px]">{selectedProject?.title || "Project"}</span>
                <span>/</span>
                <span>Task Details</span>
              </div>
              <h2 className="text-xs font-semibold text-muted-foreground mt-0.5 truncate">
                ID: {task.id}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs flex items-center gap-1.5"
              onClick={copyTaskUrl}
            >
              <Copy size={13} /> Copy Link
            </Button>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Columns (Main content) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title */}
            <div>
              <Input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-2xl font-bold bg-transparent border-transparent hover:border-border focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1 h-auto text-foreground w-full focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="bg-card/30 p-5 rounded-xl border border-border">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <FileText size={14} /> Description
              </label>
              <RichTextEditor
                placeholder="Describe this task... (Use @ to mention, / for blocks, paste images)"
                value={localDesc}
                onChange={setLocalDesc}
                onBlur={handleDescBlur}
                projectMembers={projectMembers}
                minHeight="200px"
              />
            </div>

            {/* Subtasks checklist */}
            <div className="bg-card/30 p-5 rounded-xl border border-border">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <CheckCircle2 size={14} /> Subtask Checklist
              </label>
              <div className="space-y-2 mb-3">
                {task.subtasks?.map((subtask: any) => (
                  <div key={subtask.id} className="flex items-center justify-between gap-3 group bg-muted/20 p-2.5 rounded-lg border border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        checked={subtask.isCompleted}
                        onCheckedChange={(checked) =>
                          updateSubtaskMutation.mutate({
                            id: subtask.id,
                            data: { isCompleted: !!checked },
                          })
                        }
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <span className={`text-sm ${subtask.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {subtask.title}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  className="bg-background border-border text-xs h-8 focus:outline-none"
                />
                <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs">
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </form>
            </div>

            {/* Comments & Discussion */}
            <div className="bg-card/30 p-5 rounded-xl border border-border space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
                <MessageSquare size={14} /> Discussion / Comments
              </label>
              
              <div className="flex flex-col gap-2">
                <RichTextEditor
                  placeholder="Write a comment... (Supports rich text, @mentions, /commands, paste images)"
                  value={newComment}
                  onChange={setNewComment}
                  projectMembers={projectMembers}
                  minHeight="80px"
                  onSubmit={handleAddComment}
                />
                <div className="flex justify-end">
                  <Button type="button" onClick={() => handleAddComment()} size="sm" className="text-xs">
                    Post Comment
                  </Button>
                </div>
              </div>

              <div className="space-y-6 mt-4">
                {buildCommentThreads(task.comments || []).map((comment: any) => (
                  <CommentNode
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    projectMembers={projectMembers}
                    replyingToCommentId={replyingToCommentId}
                    setReplyingToCommentId={setReplyingToCommentId}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    handleAddReply={handleAddReply}
                    editingCommentId={editingCommentId}
                    setEditingCommentId={setEditingCommentId}
                    editingContent={editingContent}
                    setEditingContent={setEditingContent}
                    handleUpdateComment={handleUpdateComment}
                    deleteCommentMutation={deleteCommentMutation}
                  />
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-card/30 p-5 rounded-xl border border-border space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
                <Activity size={14} /> Activity Feed
              </label>
              <div className="space-y-3 pl-2">
                {task.activityLogs?.map((activity: any) => (
                  <div key={activity.id} className="text-xs text-muted-foreground flex items-start gap-2.5">
                    <Clock size={13} className="mt-0.5 text-muted-foreground/60 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">{activity.user.name} </span>
                      <span>{formatActivityText(activity)}</span>
                      <span className="text-[10px] text-muted-foreground/80 block mt-0.5">
                        {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar Columns (Metadata Parameters) */}
          <div className="lg:col-span-1 bg-card/30 p-5 rounded-xl border border-border space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Metadata Settings
            </h3>

            {/* Status */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Status</span>
              <select
                value={task.statusId}
                onChange={(e) => handleFieldChange("statusId", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary h-9"
              >
                {projectStatuses.map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Assignee</span>
              <select
                value={task.assigneeId || ""}
                onChange={(e) => handleFieldChange("assigneeId", e.target.value || null)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary h-9"
              >
                <option value="">Unassigned</option>
                {projectMembers.map((m: any) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sprint (Scrum Only) */}
            {projectTemplate === "scrum" && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Work Cycle / Sprint</span>
                <select
                  value={task.sprintId || ""}
                  onChange={(e) => handleFieldChange("sprintId", e.target.value || null)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary h-9"
                >
                  <option value="">Backlog</option>
                  {projectSprints.map((sp: any) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Task Type */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Type</span>
              <select
                value={task.type}
                onChange={(e) => handleFieldChange("type", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary h-9"
              >
                <option value="task">Task</option>
                <option value="bug">Bug (Defect)</option>
                <option value="feature">Feature</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Priority</span>
              <select
                value={task.priority}
                onChange={(e) => handleFieldChange("priority", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary h-9"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Estimate (Hours / Points) */}
            {projectTemplate !== "simple" && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Estimate (Points/Hours)</span>
                <Input
                  type="number"
                  value={task.estimate ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "estimate",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  className="bg-background border-border text-xs h-9 text-foreground focus:outline-none"
                  placeholder="Estimate value..."
                />
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Due Date</span>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs h-9 bg-background border-border text-foreground px-3",
                        !task.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : <span>No due date</span>}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={task.dueDate ? new Date(task.dueDate) : undefined}
                    onSelect={(date) =>
                      handleFieldChange(
                        "dueDate",
                        date ? date.toISOString() : null
                      )
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Custom Fields Editor */}
            {customFieldDefinitions && customFieldDefinitions.length > 0 && (
              <div className="space-y-4 border-t border-border pt-4">
                <span className="text-[10px] uppercase font-bold text-primary block">Custom Properties</span>
                {customFieldDefinitions.map((fieldDef: any) => {
                  const fieldValue = task.customFields?.[fieldDef.id] ?? "";
                  return (
                    <div key={fieldDef.id} className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground block">{fieldDef.name}</span>
                      {fieldDef.type === "checkbox" ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Checkbox
                            checked={!!fieldValue}
                            onCheckedChange={(checked) => handleCustomFieldChange(fieldDef.id, !!checked)}
                            className="border-border"
                          />
                          <span className="text-xs text-muted-foreground">Yes / Active</span>
                        </div>
                      ) : fieldDef.type === "select" ? (
                        <select
                          value={fieldValue}
                          onChange={(e) => handleCustomFieldChange(fieldDef.id, e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary h-9"
                        >
                          <option value="">Choose Option</option>
                          {fieldDef.options?.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={fieldDef.type === "number" ? "number" : fieldDef.type === "date" ? "date" : "text"}
                          value={
                            fieldDef.type === "date" && fieldValue
                              ? format(new Date(fieldValue), "yyyy-MM-dd")
                              : fieldValue
                          }
                          onChange={(e) =>
                            handleCustomFieldChange(
                              fieldDef.id,
                              fieldDef.type === "number"
                                ? parseFloat(e.target.value) || 0
                                : fieldDef.type === "date"
                                ? e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : ""
                                : e.target.value
                            )
                          }
                          className="bg-background border-border text-xs h-9 text-foreground focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
          </div>
          
        </div>
      </div>
    </div>
  );
}

const formatActivityText = (activity: any) => {
  const action = activity.action;
  const oldValue = activity.oldValue;
  const newValue = activity.newValue;

  if (action === "comment_added") {
    return "added a comment";
  }
  if (action === "description_changed") {
    return "updated the description";
  }
  if (action === "title_changed") {
    return `renamed this task to "${newValue}"`;
  }
  if (action === "status_changed") {
    return `changed status from "${oldValue}" to "${newValue}"`;
  }
  if (action === "priority_changed") {
    return `changed priority from "${oldValue}" to "${newValue}"`;
  }
  if (action === "assignee_changed") {
    return newValue ? `assigned to ${newValue}` : "unassigned this task";
  }
  if (action === "created") {
    return "created this task";
  }
  if (action === "deleted") {
    return "deleted this task";
  }

  // Fallback
  const actionText = action.replace("_", " ");
  let valueText = "";
  if (oldValue && newValue) {
    valueText = ` from "${oldValue}" to "${newValue}"`;
  } else if (newValue) {
    valueText = ` to "${newValue}"`;
  } else if (oldValue) {
    valueText = ` (previously "${oldValue}")`;
  }
  return `${actionText}${valueText}`;
};

const CommentNode = ({
  comment,
  currentUser,
  projectMembers,
  replyingToCommentId,
  setReplyingToCommentId,
  replyContent,
  setReplyContent,
  handleAddReply,
  editingCommentId,
  setEditingCommentId,
  editingContent,
  setEditingContent,
  handleUpdateComment,
  deleteCommentMutation,
}: {
  comment: any;
  currentUser: any;
  projectMembers: any[];
  replyingToCommentId: string | null;
  setReplyingToCommentId: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  handleAddReply: (parentId: string) => void;
  editingCommentId: string | null;
  setEditingCommentId: (id: string | null) => void;
  editingContent: string;
  setEditingContent: (content: string) => void;
  handleUpdateComment: (commentId: string) => void;
  deleteCommentMutation: any;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="space-y-3">
      {/* Comment Card */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 border border-border flex-shrink-0">
          <AvatarImage src={comment.user?.image || ""} />
          <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
            {comment.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 bg-muted/40 p-3.5 rounded-xl border border-border/40">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-foreground">
              {comment.user?.name}
              {comment.isEdited && (
                <span className="text-[10px] text-muted-foreground ml-1.5 font-normal italic">
                  (edited)
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-medium">
                {format(new Date(comment.createdAt), "MMM d, h:mm a")}
              </span>
            </div>
          </div>
          
          {editingCommentId === comment.id ? (
            <div className="space-y-2 mt-2">
              <RichTextEditor
                placeholder="Edit comment..."
                value={editingContent}
                onChange={setEditingContent}
                projectMembers={projectMembers}
                minHeight="80px"
                onSubmit={() => handleUpdateComment(comment.id)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-7 px-2.5"
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditingContent("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="text-[10px] h-7 px-2.5"
                  onClick={() => handleUpdateComment(comment.id)}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="text-xs text-foreground ProseMirror max-w-full overflow-hidden mb-2" 
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
              {/* Actions bar inside comment card */}
              <div className="flex items-center gap-3 border-t border-border/40 pt-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToCommentId(comment.id);
                    setReplyContent("");
                  }}
                  className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors"
                >
                  Reply
                </button>
                {comment.user?.id === currentUser?.user?.id && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditingContent(comment.content);
                      }}
                      className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-[10px] font-bold text-muted-foreground hover:text-destructive uppercase tracking-wider transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inline Reply Editor specifically for this comment */}
      {replyingToCommentId === comment.id && (
        <div className="ml-8 pl-3 border-l-2 border-border/60 space-y-2">
          <RichTextEditor
            placeholder={`Reply to ${comment.user?.name}...`}
            value={replyContent}
            onChange={setReplyContent}
            projectMembers={projectMembers}
            minHeight="60px"
            onSubmit={() => handleAddReply(comment.id)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[10px] h-7 px-2.5"
              onClick={() => setReplyingToCommentId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-[10px] h-7 px-2.5"
              onClick={() => handleAddReply(comment.id)}
            >
              Reply
            </Button>
          </div>
        </div>
      )}

      {/* View replies button */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 mt-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-all"
          >
            <MessageSquare size={10} className={isCollapsed ? "" : "opacity-60"} />
            {isCollapsed ? `Show ${comment.replies.length} replies` : "Hide replies"}
          </button>
        </div>
      )}

      {/* Nested Replies - Recursive Rendering */}
      {!isCollapsed && comment.replies && comment.replies.length > 0 && (
        <div className="relative ml-6 mt-2 space-y-4 before:absolute before:left-0 before:top-0 before:bottom-[28px] before:w-[2px] before:bg-border/40">
          {comment.replies.map((reply: any) => (
            <div key={reply.id} className="relative pl-6">
              {/* Elbow connector */}
              <div className="absolute left-0 top-0 h-[16px] w-[16px] border-l-[2px] border-b-[2px] border-border/40 rounded-bl-md" />
              <CommentNode
                comment={reply}
                currentUser={currentUser}
                projectMembers={projectMembers}
                replyingToCommentId={replyingToCommentId}
                setReplyingToCommentId={setReplyingToCommentId}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                handleAddReply={handleAddReply}
                editingCommentId={editingCommentId}
                setEditingCommentId={setEditingCommentId}
                editingContent={editingContent}
                setEditingContent={setEditingContent}
                handleUpdateComment={handleUpdateComment}
                deleteCommentMutation={deleteCommentMutation}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const buildCommentThreads = (comments: any[]) => {
  if (!comments) return [];
  const commentMap = new Map();
  const roots: any[] = [];

  comments.forEach((c) => {
    commentMap.set(c.id, { ...c, replies: [] });
  });

  comments.forEach((c) => {
    const mapped = commentMap.get(c.id);
    if (c.parentId && commentMap.has(c.parentId)) {
      commentMap.get(c.parentId).replies.push(mapped);
    } else {
      roots.push(mapped);
    }
  });

  roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  roots.forEach((root) => {
    root.replies.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  return roots;
};
