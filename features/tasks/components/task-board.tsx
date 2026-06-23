"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { useCreateTask } from "../hooks/use-tasks";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Bug,
  Sparkles,
  Clock,
  ChevronRight,
} from "lucide-react";

interface TaskBoardProps {
  projectId: string;
  tasks: { id: string; sprintId: string | null; statusId: string; type: string; title: string; priority: string; estimate?: number; dueDate?: string; assignee?: { name?: string; image?: string } }[];
  statuses: { id: string; name: string }[];
  projectMembers: Record<string, unknown>[];
  sprints: Record<string, unknown>[];
  projectTemplate: string;
  activeSprintId?: string | null;
  onSelectTask: (taskId: string) => void;
}

export function TaskBoard({
  projectId,
  tasks,
  statuses,
  projectTemplate,
  activeSprintId,
  onSelectTask,
}: TaskBoardProps) {
  const createTaskMutation = useCreateTask(projectId);

  // Tracks which column has an active "quick add" text field
  const [quickAddStatusId, setQuickAddStatusId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  // Filters tasks for the current board
  const boardTasks = tasks.filter((t) => {
    // If it's a Scrum template, filter by active sprint if passed
    if (projectTemplate === "scrum" && activeSprintId !== undefined) {
      return t.sprintId === activeSprintId;
    }
    return true;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleQuickAddSubmit = (e: React.FormEvent, statusId: string) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    createTaskMutation.mutate({
      title: quickAddTitle.trim(),
      statusId,
      sprintId: activeSprintId || null,
      type: "task",
      priority: "medium",
    });

    setQuickAddTitle("");
    setQuickAddStatusId(null);
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "urgent":
        return <Badge className="bg-red-950 text-red-400 border border-red-800 text-[10px] uppercase font-bold py-0">Urgent</Badge>;
      case "high":
        return <Badge className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] uppercase font-bold py-0">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-950 text-yellow-500 border border-yellow-800/40 text-[10px] uppercase font-bold py-0">Medium</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground text-[10px] uppercase font-bold py-0">Low</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="text-red-500 h-3.5 w-3.5" />;
      case "feature":
        return <Sparkles className="text-violet-400 h-3.5 w-3.5" />;
      default:
        return <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="flex-1 flex gap-4 overflow-x-auto min-h-0 py-2">
      {statuses.map((status: { id: string; name: string }) => {
        const columnTasks = boardTasks.filter((t) => t.statusId === status.id);
        return (
          <div
            key={status.id}
            onDragOver={handleDragOver}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/plain");
              if (!taskId) return;
              // Trigger local mutate for drag-and-drop
              axiosInstance.patch(`/tasks/${taskId}`, { statusId: status.id }).then(() => {
                // Invalidate query
                window.location.reload(); // Simple refetch fallback
              });
            }}
            className="w-[280px] flex-shrink-0 flex flex-col bg-card rounded-xl border border-border p-3 h-full max-h-[70vh] shadow-lg backdrop-blur-md"
          >
            {/* Column Header */}
            <div className="flex justify-between items-center mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground">{status.name}</span>
                <Badge className="bg-muted hover:bg-muted text-muted-foreground text-[10px] px-1.5 py-0">
                  {columnTasks.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickAddStatusId(status.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Plus size={14} />
              </Button>
            </div>

            {/* Quick Add Form */}
            {quickAddStatusId === status.id && (
              <form
                onSubmit={(e) => handleQuickAddSubmit(e, status.id)}
                className="mb-3 p-2 bg-background rounded-lg border border-border"
              >
                <Input
                  autoFocus
                  placeholder="Task title..."
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  className="bg-transparent border-none text-xs text-foreground focus-visible:ring-0 px-1 py-1 h-7 placeholder-muted-foreground/60"
                />
                <div className="flex justify-end gap-1 mt-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setQuickAddStatusId(null)}
                    className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-6 text-[10px]">
                    Add
                  </Button>
                </div>
              </form>
            )}

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {columnTasks.length === 0 ? (
                <div className="h-20 flex items-center justify-center border border-dashed border-border rounded-xl text-[10px] text-muted-foreground">
                  Drag tasks here
                </div>
              ) : (
                columnTasks.map((task: { id: string; sprintId: string | null; statusId: string; type: string; title: string; priority: string; estimate?: number; dueDate?: string; assignee?: { name?: string; image?: string } }) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectTask(task.id)}
                    className="bg-background border border-border hover:border-border/80 rounded-xl p-3.5 cursor-pointer shadow transition duration-150 flex flex-col gap-2.5 active:cursor-grabbing hover:bg-muted group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {task.title}
                      </span>
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(task.type)}
                      </div>
                    </div>

                    {/* Meta Section */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(task.priority)}
                        {task.estimate && (
                          <Badge className="bg-muted border border-border text-muted-foreground text-[9px] px-1 py-0 font-mono">
                            {task.estimate}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Due Date Indicator */}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <Clock size={10} />
                            <span>{format(new Date(task.dueDate), "MMM d")}</span>
                          </div>
                        )}

                        {/* Assignee Avatar */}
                        <Avatar className="h-5 w-5 border border-border">
                          <AvatarImage src={task.assignee?.image || ""} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-bold">
                            {task.assignee?.name ? task.assignee.name.charAt(0).toUpperCase() : "-"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { axiosInstance } from "@/lib/axios";
