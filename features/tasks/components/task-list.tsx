"use client";

import React, { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bug,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  statusId?: string;
  priority: string;
  type: string;
  status: { name: string };
  assignee?: { image?: string; name?: string };
  dueDate?: string;
  estimate?: string | number;
  labels?: { labelId: string }[];
}

interface TaskRowProps {
  task: Task;
  projectTemplate: string;
  onSelectTask: (taskId: string) => void;
  projectLabels: { id: string; name: string; color?: string }[];
}

export function TaskRow({
  task,
  projectTemplate,
  onSelectTask,
  projectLabels,
}: TaskRowProps) {
  const isDone =
    task.status?.name?.toLowerCase() === "done" ||
    task.status?.name?.toLowerCase() === "completed" ||
    task.status?.name?.toLowerCase() === "closed";

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "urgent":
        return <Badge variant="destructive-light">Urgent</Badge>;
      case "high":
        return <Badge variant="rose-light">High</Badge>;
      case "medium":
        return (
          <Badge variant="info-light" className="font-bold uppercase">
            Medium
          </Badge>
        );
      default:
        return (
          <Badge variant="default" className="font-bold uppercase">
            Low
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "bug":
        return (
          <Badge
            variant="destructive-light"
            size="xs"
            radius="default"
            className="gap-1 px-1.5 py-0.5 text-[10px] font-semibold"
          >
            <Bug size={11} className="text-destructive shrink-0" />
            <span>Bug</span>
          </Badge>
        );
      case "feature":
        return (
          <Badge
            variant="info-light"
            size="xs"
            radius="default"
            className="gap-1 px-1.5 py-0.5 text-[10px] font-semibold"
          >
            <Sparkles size={11} className="text-info shrink-0" />
            <span>Feature</span>
          </Badge>
        );
      default:
        return (
          <Badge
            variant="invert-light"
            size="xs"
            radius="default"
            className="gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border/40"
          >
            <ChevronRight size={11} className="shrink-0" />
            <span>Task</span>
          </Badge>
        );
    }
  };

  const getDueDateDisplay = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const date = new Date(dueDateStr);
    const past = isPast(date) && !isToday(date);
    return (
      <div
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-colors border",
          past
            ? "bg-destructive/10 border-destructive/20 text-destructive font-semibold"
            : "bg-muted/30 border-border/40 text-muted-foreground"
        )}
      >
        <Calendar
          size={11}
          className={cn("shrink-0", past ? "text-destructive" : "text-muted-foreground")}
        />
        <span>{format(date, "MMM d")}</span>
      </div>
    );
  };

  const taskLabels = (task.labels || [])
    .map((tl) => projectLabels.find((pl) => pl.id === tl.labelId))
    .filter(Boolean) as { id: string; name: string; color?: string }[];

  return (
    <div
      onClick={() => onSelectTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectTask(task.id);
        }
      }}
      tabIndex={0}
      className={cn(
        "group flex items-center justify-between py-2.5 px-3 hover:bg-muted/30 border-b border-border/30 cursor-pointer select-none transition-all duration-150 rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-muted/50 mb-1"
      )}
    >
      {/* Left Column: Status check and Task Title & Labels */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Status checkbox */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectTask(task.id);
          }}
          className="shrink-0 cursor-pointer p-0.5 rounded-full hover:bg-muted/85 transition-colors"
        >
          {isDone ? (
            <CheckCircle2
              size={16}
              className="text-success hover:scale-110 transition-transform duration-100"
            />
          ) : (
            <Circle
              size={16}
              className="text-muted-foreground hover:text-primary hover:scale-110 transition-all duration-100"
            />
          )}
        </div>

        {/* Task Title */}
        <span
          className={cn(
            "text-sm font-medium tracking-tight truncate max-w-[400px]",
            isDone ? "line-through text-muted-foreground/60 font-normal" : "text-foreground"
          )}
        >
          {task.title}
        </span>

        {/* Labels stack */}
        {taskLabels.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {taskLabels.map((lbl) => (
              <span
                key={lbl.id}
                className="inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wide transition-all"
                style={{
                  backgroundColor: lbl.color ? `${lbl.color}12` : "rgba(59, 130, 246, 0.08)",
                  color: lbl.color || "#3b82f6",
                  borderColor: lbl.color ? `${lbl.color}25` : "rgba(59, 130, 246, 0.2)",
                }}
              >
                {lbl.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Metadata stack */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Estimate */}
        {projectTemplate !== "simple" && task.estimate !== undefined && task.estimate !== null && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-border/40 bg-muted/20 text-[11px] text-muted-foreground font-mono">
            <Clock size={11} className="shrink-0" />
            <span>{task.estimate}h</span>
          </div>
        )}

        {/* Category (Type) Badge */}
        {getTypeBadge(task.type)}

        {/* Due Date */}
        {getDueDateDisplay(task.dueDate)}

        {/* Priority Badge */}
        {getPriorityBadge(task.priority)}

        {/* Assignee Avatar */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 border border-border shadow-xs hover:scale-105 transition-transform duration-100">
            <AvatarImage src={task.assignee?.image || ""} />
            <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-extrabold">
              {task.assignee?.name ? task.assignee.name.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

interface StatusSectionProps {
  status: { id: string; name: string };
  tasks: Task[];
  projectTemplate: string;
  onSelectTask: (taskId: string) => void;
  projectLabels: { id: string; name: string; color?: string }[];
  isCollapsed: boolean;
  onToggle: () => void;
}

export function StatusSection({
  status,
  tasks,
  projectTemplate,
  onSelectTask,
  projectLabels,
  isCollapsed,
  onToggle,
}: StatusSectionProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Section Header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between py-2 px-1 hover:bg-muted/10 rounded-lg select-none cursor-pointer group transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <div className="p-0.5 rounded-md hover:bg-muted/30 text-muted-foreground group-hover:text-foreground transition-all duration-150">
            {isCollapsed ? (
              <ChevronRight size={14} className="transition-transform duration-150" />
            ) : (
              <ChevronDown size={14} className="transition-transform duration-150" />
            )}
          </div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80 group-hover:text-foreground transition-colors duration-150">
            {status.name}
          </h3>
          <span className="text-[10px] bg-muted/80 border border-border/40 text-muted-foreground/80 font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Rows Container with Collapsible Motion */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden pl-1 pr-1"
          >
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-dashed border-border/30 rounded-xl bg-card/10 my-1">
                <p className="text-xs font-semibold text-muted-foreground/60 italic">
                  No tasks in this section
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projectTemplate={projectTemplate}
                    onSelectTask={onSelectTask}
                    projectLabels={projectLabels}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TaskListProps {
  tasks: Task[];
  statuses: { id: string; name: string }[];
  projectMembers?: unknown[];
  projectTemplate: string;
  onSelectTask: (taskId: string) => void;
  projectLabels?: { id: string; name: string; color?: string }[];
}

export function TaskList({
  tasks,
  statuses,
  projectTemplate,
  onSelectTask,
  projectLabels = [],
}: TaskListProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (statusId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [statusId]: !prev[statusId],
    }));
  };

  const activeStatuses = statuses.length > 0 ? statuses : [{ id: "unknown", name: "Backlog" }];

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 px-4 border border-dashed border-border/60 rounded-2xl bg-muted/5 flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No tasks found</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          No tasks match your search query or filters in this view. Try adjusting your filters above or create a new task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-1">
      {activeStatuses.map((status) => {
        const statusTasks = tasks.filter(
          (t) => t.statusId === status.id || (!t.statusId && status.id === activeStatuses[0].id)
        );

        return (
          <StatusSection
            key={status.id}
            status={status}
            tasks={statusTasks}
            projectTemplate={projectTemplate}
            onSelectTask={onSelectTask}
            projectLabels={projectLabels}
            isCollapsed={!!collapsedSections[status.id]}
            onToggle={() => toggleSection(status.id)}
          />
        );
      })}
    </div>
  );
}
