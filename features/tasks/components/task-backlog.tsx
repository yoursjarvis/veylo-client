"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { useCreateSprint, useUpdateSprint, useCreateTask } from "../hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Plus,
  Play,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { axiosInstance } from "@/lib/axios";

interface TaskBacklogProps {
  projectId: string;
  tasks: any[];
  sprints: any[];
  projectMembers: any[];
  statuses: any[];
  onSelectTask: (taskId: string) => void;
}

export function TaskBacklog({
  projectId,
  tasks,
  sprints,
  projectMembers,
  statuses,
  onSelectTask,
}: TaskBacklogProps) {
  const createSprintMutation = useCreateSprint(projectId);
  const updateSprintMutation = useUpdateSprint(projectId);
  const createTaskMutation = useCreateTask(projectId);

  // States
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");
  const [newSprintStart, setNewSprintStart] = useState("");
  const [newSprintEnd, setNewSprintEnd] = useState("");

  const [activeQuickAddTaskSprintId, setActiveQuickAddTaskSprintId] = useState<string | null>(null);
  const [quickAddTaskTitle, setQuickAddTaskTitle] = useState("");

  // Sprint Completion Wizard state
  const [completingSprint, setCompletingSprint] = useState<any | null>(null);
  const [completeDestSprintId, setCompleteDestSprintId] = useState<string>("");

  // Toggle sprint card folding
  const [foldedSprints, setFoldedSprints] = useState<Record<string, boolean>>({});

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDropOnSprint = async (e: React.DragEvent, sprintId: string | null) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    // Call API patch dynamically and trigger reload/invalidate query client
    await axiosInstance.patch(`/tasks/${taskId}`, { sprintId });
    window.location.reload(); // Simple refetch fallback
  };

  const handleCreateSprintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    createSprintMutation.mutate({
      name: newSprintName.trim(),
      goal: newSprintGoal.trim() || null,
      startDate: newSprintStart ? new Date(newSprintStart).toISOString() : null,
      endDate: newSprintEnd ? new Date(newSprintEnd).toISOString() : null,
    }, {
      onSuccess: () => {
        setIsCreateSprintOpen(false);
        setNewSprintName("");
        setNewSprintGoal("");
        setNewSprintStart("");
        setNewSprintEnd("");
      }
    });
  };

  const handleStartSprint = (sprint: any) => {
    // Check if another sprint is active
    const activeSprint = sprints.find((s) => s.status === "active");
    if (activeSprint) {
      alert("A sprint is already active. Complete it first.");
      return;
    }

    updateSprintMutation.mutate({
      id: sprint.id,
      data: { status: "active", startDate: new Date().toISOString() },
    });
  };

  const triggerCompleteSprint = (sprint: any) => {
    setCompletingSprint(sprint);
    // Find default destination (first planned sprint or backlog)
    const plannedSprints = sprints.filter((s) => s.status === "planned" && s.id !== sprint.id);
    if (plannedSprints.length > 0) {
      setCompleteDestSprintId(plannedSprints[0].id);
    } else {
      setCompleteDestSprintId("");
    }
  };

  const handleCompleteSprintSubmit = () => {
    if (!completingSprint) return;

    updateSprintMutation.mutate({
      id: completingSprint.id,
      data: {
        status: "completed",
        uncompletedTasksDestination: completeDestSprintId || null,
      },
    }, {
      onSuccess: () => {
        setCompletingSprint(null);
      }
    });
  };

  const handleQuickAddTask = (e: React.FormEvent, sprintId: string | null) => {
    e.preventDefault();
    if (!quickAddTaskTitle.trim()) return;

    // Use first status for new tasks (usually To Do / Backlog)
    const defaultStatusId = statuses[0]?.id;

    createTaskMutation.mutate({
      title: quickAddTaskTitle.trim(),
      statusId: defaultStatusId,
      sprintId,
      type: "task",
      priority: "medium",
    }, {
      onSuccess: () => {
        setQuickAddTaskTitle("");
        setActiveQuickAddTaskSprintId(null);
      }
    });
  };

  const toggleFold = (sprintId: string) => {
    setFoldedSprints((prev) => ({ ...prev, [sprintId]: !prev[sprintId] }));
  };

  const renderTaskCard = (task: any) => (
    <div
      key={task.id}
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
      onClick={() => onSelectTask(task.id)}
      className="flex items-center justify-between gap-3 p-3 bg-background hover:bg-muted border border-border rounded-xl cursor-pointer hover:border-border transition"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Badge className={`text-[9px] uppercase font-bold py-0.5 ${task.type === 'bug' ? 'bg-red-950 text-red-400' : task.type === 'feature' ? 'bg-violet-950 text-violet-400' : 'bg-muted text-muted-foreground'}`}>
          {task.type}
        </Badge>
        <span className="text-xs text-foreground truncate font-medium">{task.title}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Status */}
        <Badge className="bg-muted border border-border text-[10px] text-muted-foreground py-0">
          {task.status.name}
        </Badge>

        {/* Estimate */}
        {task.estimate !== null && (
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
            {task.estimate}
          </span>
        )}

        {/* Assignee */}
        <Avatar className="h-5 w-5 border border-border">
          <AvatarImage src={task.assignee?.image || ""} />
          <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-bold">
            {task.assignee?.name ? task.assignee.name.charAt(0).toUpperCase() : "-"}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 flex-1 overflow-y-auto pr-2 pb-6">
      {/* Header action */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Sprint Backlog Planner</h3>
          <p className="text-[10px] text-muted-foreground">Plan sprints, assign estimations, drag items, and track velocity.</p>
        </div>
        <Button onClick={() => setIsCreateSprintOpen(true)} className="text-xs h-8">
          <Plus size={14} className="mr-1.5" /> Create Sprint
        </Button>
      </div>

      {/* Active & Planned Sprints */}
      <div className="space-y-4">
        {sprints.map((sprint) => {
          const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
          const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.estimate || 0), 0);
          const isFolded = !!foldedSprints[sprint.id];

          return (
            <Card
              key={sprint.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnSprint(e, sprint.id)}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-card flex items-center justify-between border-b border-border flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleFold(sprint.id)} className="text-muted-foreground hover:text-foreground">
                    {isFolded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    {sprint.name}
                    {sprint.status === "active" && (
                      <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] py-0">
                        Active
                      </Badge>
                    )}
                    {sprint.status === "completed" && (
                      <Badge className="bg-muted text-muted-foreground text-[9px] py-0">
                        Completed
                      </Badge>
                    )}
                  </CardTitle>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {sprintTasks.length} tasks • {totalPoints} pts
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Goal */}
                  {sprint.goal && (
                    <span className="text-[10px] text-muted-foreground italic max-w-[200px] truncate">
                      "{sprint.goal}"
                    </span>
                  )}

                  {/* Dates */}
                  {sprint.startDate && sprint.endDate && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-mono">
                      <CalendarIcon size={12} />
                      {format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d")}
                    </span>
                  )}

                  {/* Sprint Actions */}
                  {sprint.status === "planned" && (
                    <Button
                      onClick={() => handleStartSprint(sprint)}
                      size="sm"
                      className="text-[10px] h-7 px-2.5"
                    >
                      <Play size={10} className="mr-1" /> Start Sprint
                    </Button>
                  )}

                  {sprint.status === "active" && (
                    <Button
                      onClick={() => triggerCompleteSprint(sprint)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-[10px] h-7 px-2.5"
                    >
                      <CheckCircle size={10} className="mr-1" /> Complete Sprint
                    </Button>
                  )}
                </div>
              </div>

              {/* Tasks List */}
              {!isFolded && (
                <CardContent className="p-3 space-y-2">
                  {sprintTasks.length === 0 ? (
                    <div className="h-16 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                      No tasks inside this sprint. Drag backlog items here.
                    </div>
                  ) : (
                    sprintTasks.map(renderTaskCard)
                  )}

                  {/* Quick Add inside Sprint */}
                  {sprint.status !== "completed" && (
                    <form onSubmit={(e) => handleQuickAddTask(e, sprint.id)} className="flex gap-2 pt-1.5">
                      <Input
                        placeholder="Quick add task to this sprint..."
                        value={activeQuickAddTaskSprintId === sprint.id ? quickAddTaskTitle : ""}
                        onChange={(e) => {
                          setActiveQuickAddTaskSprintId(sprint.id);
                          setQuickAddTaskTitle(e.target.value);
                        }}
                        className="bg-background border-border text-xs h-8 text-foreground"
                      />
                      <Button type="submit" size="sm" className="text-xs h-8">
                        Add
                      </Button>
                    </form>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Product Backlog Section */}
      <Card
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDropOnSprint(e, null)}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="p-4 bg-card flex items-center justify-between border-b border-border">
          <CardTitle className="text-sm font-bold text-foreground">
            Product Backlog (Unscheduled)
          </CardTitle>
          <span className="text-[10px] text-muted-foreground font-mono">
            {tasks.filter((t) => t.sprintId === null).length} tasks
          </span>
        </div>
        <CardContent className="p-3 space-y-2">
          {tasks.filter((t) => t.sprintId === null).length === 0 ? (
            <div className="h-16 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground text-xs">
              No tasks in backlog. Add one below!
            </div>
          ) : (
            tasks.filter((t) => t.sprintId === null).map(renderTaskCard)
          )}

          {/* Quick Add in Backlog */}
          <form onSubmit={(e) => handleQuickAddTask(e, null)} className="flex gap-2 pt-2">
            <Input
              placeholder="Add unscheduled backlog task..."
              value={activeQuickAddTaskSprintId === null ? quickAddTaskTitle : ""}
              onChange={(e) => {
                setActiveQuickAddTaskSprintId(null);
                setQuickAddTaskTitle(e.target.value);
              }}
              className="bg-background border-border text-xs h-8 text-foreground"
            />
            <Button type="submit" size="sm" className="text-xs h-8">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* DIALOG 1: CREATE SPRINT MODAL */}
      {isCreateSprintOpen && (
        <Dialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen}>
          <DialogContent className="bg-card border border-border text-foreground p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">Create New Sprint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSprintSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Sprint Name</label>
                <Input
                  required
                  placeholder="e.g. Sprint 1 - Core MVP"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Goal</label>
                <Input
                  placeholder="What is this sprint's core objective?"
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Start Date</label>
                  <Input
                    type="datetime-local"
                    value={newSprintStart}
                    onChange={(e) => setNewSprintStart(e.target.value)}
                    className="bg-background border-border text-foreground text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">End Date</label>
                  <Input
                    type="datetime-local"
                    value={newSprintEnd}
                    onChange={(e) => setNewSprintEnd(e.target.value)}
                    className="bg-background border-border text-foreground text-xs"
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateSprintOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-xs">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 2: SPRINT COMPLETION WIZARD */}
      {completingSprint && (
        <Dialog open={!!completingSprint} onOpenChange={(open) => !open && setCompletingSprint(null)}>
          <DialogContent className="bg-card border border-border text-foreground p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Complete {completingSprint.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                This sprint will be closed. What should we do with all uncompleted tasks remaining in this sprint?
              </p>

              <div className="space-y-1.5">
                <label className="text-xs text-foreground font-semibold">Move uncompleted tasks to:</label>
                <select
                  value={completeDestSprintId}
                  onChange={(e) => setCompleteDestSprintId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Product Backlog (Unscheduled)</option>
                  {sprints
                    .filter((s) => s.status === "planned" && s.id !== completingSprint.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Planned)
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                variant="ghost"
                onClick={() => setCompletingSprint(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteSprintSubmit}
                className="text-xs font-semibold"
              >
                Complete & Rollover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
