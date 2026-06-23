"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  useTaskDetails,
  useUpdateTask,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
  useToggleCommentReaction,
  useProjectCustomFields,
  useTaskDependencies,
  useCreateTaskDependency,
  useDeleteTaskDependency,
} from "../hooks/use-tasks";
import { useWorkspaceContext } from "@/components/providers/workspace-provider";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Trash,
  Plus,
  Clock,
  FileText,
  Activity,
  MessageSquare,
  CheckCircle2,
  Calendar as CalendarIcon,
  AlertTriangle,
  Copy,
  ExternalLink,
  SmilePlus,
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";

interface TaskDetailsDrawerProps {
  taskId: string | null;
  projectId: string;
  projectMembers: LooseRecord[];
  projectStatuses: LooseRecord[];
  projectSprints: LooseRecord[];
  projectTemplate: string;
  onClose: () => void;
}

export function TaskDetailsDrawer({
  taskId,
  projectId,
  projectMembers,
  projectStatuses,
  projectSprints,
  projectTemplate,
  onClose,
}: TaskDetailsDrawerProps) {
  const { data: task, isLoading } = useTaskDetails(taskId);
  const { data: customFieldDefinitions } = useProjectCustomFields(projectId);

  const updateTaskMutation = useUpdateTask(projectId, taskId || "");
  const createSubtaskMutation = useCreateSubtask(taskId || "");
  const updateSubtaskMutation = useUpdateSubtask(taskId || "");
  const deleteSubtaskMutation = useDeleteSubtask(taskId || "");
  const createCommentMutation = useCreateComment(taskId || "");
  const deleteCommentMutation = useDeleteComment(taskId || "");
  const updateCommentMutation = useUpdateComment(taskId || "");
  const toggleReactionMutation = useToggleCommentReaction(taskId || "");

  const { activeWorkspace } = useWorkspaceContext();
  const workspaceId = activeWorkspace?.id;
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();

  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const { data: dependencies = { blockedBy: [], blocking: [] }, isLoading: isDepsLoading } = useTaskDependencies(taskId);
  const createDepMutation = useCreateTaskDependency(taskId || "");
  const deleteDepMutation = useDeleteTaskDependency(taskId || "");

  const [isLinking, setIsLinking] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState(projectId);
  const [targetTaskId, setTargetTaskId] = useState("");
  const [depDirection, setDepDirection] = useState<"blocks" | "blocked_by">("blocked_by");

  // Fetch workspace projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/projects`);
      return response.data.data;
    },
    enabled: !!workspaceId && isLinking,
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
    ...(dependencies.blockedBy || []).map((d: LooseRecord) => d.task.id),
    ...(dependencies.blocking || []).map((d: LooseRecord) => d.task.id),
    taskId
  ]);
  const availableTasks = projectTasks.filter((t: LooseRecord) => !linkedTaskIds.has(t.id) && !t.deletedAt);

  const handleLinkDependency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTaskId) return;

    createDepMutation.mutate(
      { dependencyTaskId: targetTaskId, direction: depDirection },
      {
        onSuccess: () => {
          setTargetTaskId("");
          setIsLinking(false);
        }
      }
    );
  };

  // Local state for descriptions/titles to avoid lagging DB calls
  const [localTitle, setLocalTitle] = useState("");
  const [localDesc, setLocalDesc] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- required to sync local state
      setLocalTitle(task.title || "");
      setLocalDesc(task.description || "");
    }
  }, [task]);

  if (!taskId) return null;

  const handleFieldChange = (field: string, value: LooseAny) => {
    updateTaskMutation.mutate({ [field]: value });
  };

  const handleCustomFieldChange = (fieldKey: string, value: LooseAny) => {
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

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full data-[side=right]:sm:max-w-[85vw] data-[side=right]:md:max-w-[75vw] data-[side=right]:lg:max-w-[65vw] data-[side=right]:xl:max-w-[55vw] p-0 flex flex-col h-full bg-card border-l border-border text-foreground">
        <SheetHeader className="p-6 border-b border-border flex flex-row items-center justify-between">
          <div>
            <SheetTitle className="text-lg font-bold text-foreground">Task Details</SheetTitle>
            <SheetDescription className="text-muted-foreground text-xs">
              ID: {task?.id || "Loading..."}
            </SheetDescription>
          </div>
          {task && (
            <div className="flex items-center gap-2 pr-6">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
                onClick={async () => {
                  const url = `${window.location.origin}/${activeWorkspace?.slug}/tasks/${task.id}`;
                  await navigator.clipboard.writeText(url);
                  toast.success("Task link copied to clipboard");
                }}
              >
                <Copy size={13} /> Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
                onClick={() => {
                  router.push(`/${activeWorkspace?.slug}/tasks/${task.id}`);
                  onClose();
                }}
              >
                <ExternalLink size={13} /> Open Page
              </Button>
            </div>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-row">
            {/* Left Main Scrollable Content */}
            <ScrollArea className="flex-1 h-full p-6 border-r border-border">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <Input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="text-xl font-bold bg-transparent border-transparent hover:border-border focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1 h-auto text-foreground"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                    <FileText size={14} /> Description
                  </label>
                  <RichTextEditor
                    placeholder="Describe this task... (Use @ to mention, / for blocks, paste images)"
                    value={localDesc}
                    onChange={setLocalDesc}
                    onBlur={handleDescBlur}
                    projectMembers={projectMembers}
                    minHeight="150px"
                  />
                </div>

                {/* Checklist / Subtasks */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                    <CheckCircle2 size={14} /> Subtask Checklist
                  </label>
                  <div className="space-y-2 mb-3">
                    {task?.subtasks?.map((subtask: LooseRecord) => (
                      <div key={subtask.id} className="flex items-center justify-between gap-3 group bg-muted/30 p-2 rounded-lg border border-border">
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
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <Input
                      placeholder="Add subtask checklist item..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="bg-background border-border text-foreground text-sm h-8"
                    />
                    <Button type="submit" size="sm" className="h-8">
                      <Plus size={14} />
                    </Button>
                  </form>
                </div>

                {/* Task Dependencies Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-500" /> Linked Issues (Dependencies)
                    </label>
                    {!isLinking && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="text-xs text-primary hover:bg-primary/10 h-7"
                        onClick={() => {
                          setTargetProjectId(projectId);
                          setIsLinking(true);
                        }}
                      >
                        <Plus size={14} className="mr-1" /> Link Issue
                      </Button>
                    )}
                  </div>

                  {/* Linking Form */}
                  {isLinking && (
                    <form onSubmit={handleLinkDependency} className="bg-muted/30 p-3 rounded-lg border border-border space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground font-semibold">Relationship</label>
                          <select
                            value={depDirection}
                            onChange={(e) => setDepDirection(e.target.value as "blocks" | "blocked_by")}
                            className="w-full bg-background border border-border rounded p-1 text-xs text-foreground focus:outline-none focus:border-primary h-8"
                          >
                            <option value="blocked_by">is blocked by</option>
                            <option value="blocks">blocks</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground font-semibold">Project</label>
                          <select
                            value={targetProjectId}
                            onChange={(e) => {
                              setTargetProjectId(e.target.value);
                              setTargetTaskId("");
                            }}
                            className="w-full bg-background border border-border rounded p-1 text-xs text-foreground focus:outline-none focus:border-primary h-8"
                          >
                            {projects.map((p: LooseRecord) => (
                              <option key={p.id} value={p.id}>
                                {p.title} {p.id === projectId ? "(Current)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">Target Task</label>
                        <select
                          value={targetTaskId}
                          onChange={(e) => setTargetTaskId(e.target.value)}
                          className="w-full bg-background border border-border rounded p-1 text-xs text-foreground focus:outline-none focus:border-primary h-8"
                          required
                        >
                          <option value="">Select task...</option>
                          {availableTasks.map((t: LooseRecord) => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.priority})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 text-xs">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="text-muted-foreground"
                          onClick={() => {
                            setIsLinking(false);
                            setTargetTaskId("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="xs"
                          disabled={!targetTaskId || createDepMutation.isPending}
                        >
                          Link
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Dependencies List */}
                  <div className="space-y-2">
                    {/* Blocked By */}
                    {dependencies.blockedBy?.map((d: LooseRecord) => (
                      <div key={d.dependencyId} className="flex items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-lg border border-border text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="bg-destructive/10 text-destructive text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                            Blocked By
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block">
                              {d.task.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {d.task.project.title} • {d.task.status?.name}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => deleteDepMutation.mutate(d.dependencyId)}
                        >
                          <Trash size={12} />
                        </Button>
                      </div>
                    ))}

                    {/* Blocking */}
                    {dependencies.blocking?.map((d: LooseRecord) => (
                      <div key={d.dependencyId} className="flex items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-lg border border-border text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="bg-teal-500/10 text-teal-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                            Blocks
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block">
                              {d.task.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {d.task.project.title} • {d.task.status?.name}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => deleteDepMutation.mutate(d.dependencyId)}
                        >
                          <Trash size={12} />
                        </Button>
                      </div>
                    ))}

                    {!isDepsLoading &&
                      dependencies.blockedBy?.length === 0 &&
                      dependencies.blocking?.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No linked issues.</p>
                      )}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
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
                    {buildCommentThreads(task?.comments || []).map((comment: LooseRecord) => (
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
                        toggleReactionMutation={toggleReactionMutation}
                      />
                    ))}
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2">
                    <Activity size={14} /> Activity Feed
                  </label>
                  <div className="space-y-3">
                    {task?.activityLogs?.map((activity: LooseRecord) => (
                      <div key={activity.id} className="text-xs text-muted-foreground flex items-start gap-2">
                        <Clock size={12} className="mt-0.5 text-muted-foreground/60 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-foreground">{activity.user.name} </span>
                          <span>{formatActivityText(activity)}</span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Right Side Settings Panel */}
            <div className="w-[220px] bg-background p-4 space-y-5 h-full overflow-y-auto">
              {/* Status */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Status</span>
                <select
                  value={task?.statusId}
                  onChange={(e) => handleFieldChange("statusId", e.target.value)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  {projectStatuses.map((st: LooseRecord) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Assignee</span>
                <select
                  value={task?.assigneeId || ""}
                  onChange={(e) => handleFieldChange("assigneeId", e.target.value || null)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m: LooseRecord) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sprint (Scrum Only) */}
              {projectTemplate === "scrum" && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Work Cycle / Sprint</span>
                  <select
                    value={task?.sprintId || ""}
                    onChange={(e) => handleFieldChange("sprintId", e.target.value || null)}
                    className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Backlog</option>
                    {projectSprints.map((sp: LooseRecord) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name} ({sp.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Task Type */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Type</span>
                <select
                  value={task?.type}
                  onChange={(e) => handleFieldChange("type", e.target.value)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug (Defect)</option>
                  <option value="feature">Feature</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Priority</span>
                <select
                  value={task?.priority}
                  onChange={(e) => handleFieldChange("priority", e.target.value)}
                  className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Estimate (Hours / Points) */}
              {projectTemplate !== "simple" && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Estimate (Points/Hours)</span>
                  <Input
                    type="number"
                    value={task?.estimate ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "estimate",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="bg-card border-border text-xs h-7 text-foreground"
                    placeholder="Estimate value..."
                  />
                </div>
              )}

              {/* Due Date */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Due Date</span>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-xs h-7 bg-background border-border text-foreground px-2.5",
                          !task?.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        {task?.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : <span>No due date</span>}
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={task?.dueDate ? new Date(task.dueDate) : undefined}
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
                  {customFieldDefinitions.map((fieldDef: LooseRecord) => {
                    const fieldValue = task?.customFields?.[fieldDef.id] ?? "";
                    return (
                      <div key={fieldDef.id} className="space-y-1">
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
                            className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
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
                            className="bg-card border-border text-xs h-7 text-foreground"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export const formatActivityText = (activity: LooseRecord) => {
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
  toggleReactionMutation,
}: {
  comment: LooseRecord;
  currentUser: LooseRecord;
  projectMembers: LooseRecord[];
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
  deleteCommentMutation: LooseAny;
  toggleReactionMutation: LooseAny;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { resolvedTheme } = useTheme();

  // Group reactions by emoji
  const reactionsMap = new Map<string, { count: number; userHasReacted: boolean }>();
  if (comment.reactions) {
    comment.reactions.forEach((reaction: LooseRecord) => {
      const existing = reactionsMap.get(reaction.emoji) || { count: 0, userHasReacted: false };
      reactionsMap.set(reaction.emoji, {
        count: existing.count + 1,
        userHasReacted: existing.userHasReacted || reaction.userId === currentUser?.user?.id,
      });
    });
  }

  const handleToggleReaction = (emoji: string) => {
    toggleReactionMutation.mutate({ commentId: comment.id, emoji });
    setShowEmojiPicker(false);
  };

  return (
    <div className="space-y-3">
      {/* Comment Card */}
      <div className="flex gap-3">
        <Avatar className="h-7 w-7 border border-border flex-shrink-0">
          <AvatarImage src={comment.user?.image || ""} />
          <AvatarFallback className="bg-muted text-foreground text-xs">
            {comment.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 bg-muted/60 p-3 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-foreground">
              {comment.user?.name}
              {comment.isEdited && (
                <span className="text-[10px] text-muted-foreground ml-1.5 font-normal italic">
                  (edited)
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
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
            <div className="relative group">
              {/* Floating Reaction Bar (visible on hover) */}
              <div className={cn(
                "absolute -top-7 right-0 transition-opacity bg-background border border-border shadow-sm rounded-full flex items-center p-0.5 gap-0.5 z-10",
                showEmojiPicker ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                {["❤️", "👍", "🙏", "👎"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleToggleReaction(emoji)}
                    className="hover:bg-muted p-1.5 rounded-full transition-colors text-sm leading-none"
                  >
                    {emoji}
                  </button>
                ))}
                <div className="w-px h-4 bg-border mx-1" />
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger className="hover:bg-muted p-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <SmilePlus size={14} />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-transparent border-none shadow-none" side="top" align="end">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => handleToggleReaction(emojiData.emoji)}
                      theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                      skinTonesDisabled
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div 
                className="text-xs text-foreground ProseMirror max-w-full overflow-hidden mb-2" 
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />

              {/* Reactions display */}
              {Array.from(reactionsMap.entries()).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {Array.from(reactionsMap.entries()).map(([emoji, data]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleToggleReaction(emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border transition-colors",
                        data.userHasReacted 
                          ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" 
                          : "bg-muted/50 border-border hover:bg-muted"
                      )}
                    >
                      <span>{emoji}</span>
                      <span className="text-[10px]">{data.count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Actions bar inside comment card */}
              <div className="flex items-center gap-3 border-t border-border/40 pt-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToCommentId(comment.id);
                    setReplyContent("");
                  }}
                  className="text-[9px] font-bold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors"
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
                      className="text-[9px] font-bold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-[9px] font-bold text-muted-foreground hover:text-destructive uppercase tracking-wider transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline Reply Editor specifically for this comment */}
      {replyingToCommentId === comment.id && (
        <div className="ml-6 pl-3 border-l-2 border-border/60 space-y-2">
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
        <div className="relative ml-6 mt-2 space-y-4 before:absolute before:left-0 before:top-0 before:bottom-[24px] before:w-[2px] before:bg-border/40">
          {comment.replies.map((reply: LooseRecord) => (
            <div key={reply.id} className="relative pl-6">
              {/* Elbow connector */}
              <div className="absolute left-0 top-0 h-[14px] w-[14px] border-l-[2px] border-b-[2px] border-border/40 rounded-bl-md" />
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
                toggleReactionMutation={toggleReactionMutation}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const buildCommentThreads = (comments: LooseRecord[]) => {
  if (!comments) return [];
  const commentMap = new Map();
  const roots: LooseRecord[] = [];

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
    root.replies.sort((a: LooseRecord, b: LooseRecord) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  return roots;
};
