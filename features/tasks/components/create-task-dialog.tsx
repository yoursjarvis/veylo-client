"use client";

import React, { useState, useEffect } from "react";
import { useCreateTask, useProjectCustomFields } from "../hooks/use-tasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { axiosInstance } from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

interface CreateTaskDialogProps {
  open: boolean;
  projectId: string;
  projectMembers: any[];
  projectStatuses: any[];
  projectSprints: any[];
  projectTemplate: string;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({
  open,
  projectId,
  projectMembers,
  projectStatuses,
  projectSprints,
  projectTemplate,
  onOpenChange,
}: CreateTaskDialogProps) {
  const createTaskMutation = useCreateTask(projectId);
  const { data: customFieldDefinitions } = useProjectCustomFields(projectId);
  const queryClient = useQueryClient();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState("");
  const [type, setType] = useState<"task" | "bug" | "feature">("task");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [isInitializing, setIsInitializing] = useState(false);

  // Auto-initialize statuses if none exist
  useEffect(() => {
    if (open && projectId && projectStatuses && projectStatuses.length === 0 && !isInitializing) {
      setIsInitializing(true);
      const defaults = [
        { name: "To Do", category: "todo", order: 0 },
        { name: "In Progress", category: "in_progress", order: 1 },
        { name: "Done", category: "done", order: 2 },
      ];
      Promise.all(
        defaults.map((status) =>
          axiosInstance.post(`/projects/${projectId}/statuses`, status)
        )
      )
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["statuses", projectId] });
        })
        .finally(() => {
          setIsInitializing(false);
        });
    }
  }, [projectStatuses, open, projectId, isInitializing, queryClient]);

  // Reset form status when opened/statuses are available
  useEffect(() => {
    if (projectStatuses && projectStatuses.length > 0) {
      setStatusId(projectStatuses[0].id);
    }
  }, [projectStatuses, open]);

  // Reset all other fields on close/open
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setType("task");
      setPriority("medium");
      setSprintId(null);
      setAssigneeId(null);
      setEstimate(null);
      setDueDate("");
      setCustomFields({});
    }
  }, [open]);

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFields((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !statusId) return;

    createTaskMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        statusId,
        type,
        priority,
        sprintId: sprintId || null,
        assigneeId: assigneeId || null,
        estimate: estimate,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        customFields,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground p-6 max-h-[85vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-semibold">Title *</label>
            <Input
              required
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border-border text-foreground text-xs h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-semibold">Description</label>
            <RichTextEditor
              placeholder="Provide a description... (Use @ to mention, / for blocks, paste images)"
              value={description}
              onChange={setDescription}
              projectMembers={projectMembers}
              minHeight="100px"
            />
          </div>

          {/* Status & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
                Status * {isInitializing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary h-9"
              >
                {projectStatuses.length === 0 ? (
                  <option value="">
                    {isInitializing ? "Initializing..." : "No statuses available"}
                  </option>
                ) : (
                  projectStatuses.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary h-9"
              >
                <option value="task">Task</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
              </select>
            </div>
          </div>

          {/* Priority & Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary h-9"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">Assignee</label>
              <select
                value={assigneeId || ""}
                onChange={(e) => setAssigneeId(e.target.value || null)}
                className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary h-9"
              >
                <option value="">Unassigned</option>
                {projectMembers.map((m: any) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sprint & Estimate & Due Date */}
          <div className="grid grid-cols-3 gap-3">
            {projectTemplate === "scrum" ? (
              <div className="space-y-1 col-span-1">
                <label className="text-xs text-muted-foreground font-semibold">Sprint</label>
                <select
                  value={sprintId || ""}
                  onChange={(e) => setSprintId(e.target.value || null)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary h-9"
                >
                  <option value="">Backlog</option>
                  {projectSprints.map((sp: any) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.status})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="col-span-1 hidden"></div>
            )}

            {projectTemplate !== "simple" ? (
              <div className="space-y-1 col-span-1">
                <label className="text-xs text-muted-foreground font-semibold">Estimate</label>
                <Input
                  type="number"
                  placeholder="Points"
                  value={estimate ?? ""}
                  onChange={(e) =>
                    setEstimate(e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="bg-background border-border text-foreground text-xs h-9"
                />
              </div>
            ) : (
              <div className="col-span-1 hidden"></div>
            )}

            <div className={`space-y-1 ${projectTemplate === "simple" ? "col-span-3" : projectTemplate === "kanban" ? "col-span-2" : "col-span-1"}`}>
              <label className="text-xs text-muted-foreground font-semibold block">Due Date</label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs h-9 bg-background border-border text-foreground",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {dueDate ? format(new Date(dueDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => setDueDate(date ? date.toISOString() : "")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Dynamic Custom Fields Section */}
          {customFieldDefinitions && customFieldDefinitions.length > 0 && (
            <div className="space-y-3 border-t border-border pt-3">
              <span className="text-xs uppercase font-bold text-primary block">Custom Properties</span>
              {customFieldDefinitions.map((fieldDef: any) => {
                const fieldValue = customFields[fieldDef.id] ?? "";
                return (
                  <div key={fieldDef.id} className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">{fieldDef.name}</label>
                    {fieldDef.type === "checkbox" ? (
                      <div className="flex items-center gap-2 mt-1.5">
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
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary h-9"
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
                        value={fieldValue}
                        onChange={(e) =>
                          handleCustomFieldChange(
                            fieldDef.id,
                            fieldDef.type === "number"
                              ? parseFloat(e.target.value) || 0
                              : e.target.value
                          )
                        }
                        className="bg-background border-border text-foreground text-xs h-9"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground text-xs h-9"
            >
              Cancel
            </Button>
            <Button type="submit" className="text-xs h-9 font-semibold">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
