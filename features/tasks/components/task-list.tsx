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
        return (
          <Badge
            variant="destructive-light"
            size="sm"
            radius="default"
            className="px-2.5 py-0.5 text-xs font-medium tracking-normal border-none"
          >
            Urgent
          </Badge>
        );
      case "high":
        return (
          <Badge
            variant="rose-light"
            size="sm"
            radius="default"
            className="px-2.5 py-0.5 text-xs font-medium tracking-normal border-none"
          >
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="info-light"
            size="sm"
            radius="default"
            className="px-2.5 py-0.5 text-xs font-medium tracking-normal border-none"
          >
            Medium
          </Badge>
        );
      default:
        return (
          <Badge
            variant="invert-light"
            size="sm"
            radius="default"
            className="px-2.5 py-0.5 text-xs font-medium tracking-normal border-none text-muted-foreground/75"
          >
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
            size="sm"
            radius="default"
            className="gap-1 px-2.5 py-0.5 text-xs font-medium border-none"
          >
            <Bug size={11} className="text-destructive shrink-0" />
            <span>Bug</span>
          </Badge>
        );
      case "feature":
        return (
          <Badge
            variant="info-light"
            size="sm"
            radius="default"
            className="gap-1 px-2.5 py-0.5 text-xs font-medium border-none"
          >
            <Sparkles size={11} className="text-info shrink-0" />
            <span>Feature</span>
          </Badge>
        );
      default:
        return (
          <Badge
            variant="invert-light"
            size="sm"
            radius="default"
            className="gap-1 px-2.5 py-0.5 text-xs font-medium border-none text-muted-foreground/80"
          >
            <ChevronRight size={11} className="shrink-0 text-muted-foreground/50" />
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
          "flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium transition-colors h-5",
          past
            ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Calendar
          size={11}
          className={cn("shrink-0", past ? "text-destructive" : "text-muted-foreground/60")}
        />
        <span>{format(date, "MMM d")}</span>
      </div>
    );
  };

  const taskLabels = (task.labels || [])
    .map((tl) => projectLabels.find((pl) => pl.id === tl.labelId))
    .filter(Boolean) as { id: string; name: string; color?: string }[];

  const plainDescription = task.description
    ? task.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
    : "";

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
        "group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/30 hover:border-border/80 shadow-xs hover:shadow-sm cursor-pointer transition-all duration-200 select-none mb-2.5 outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-muted/50"
      )}
    >
      {/* Left Column: Status check and Task Title, Description preview & Labels */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Status checkbox */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectTask(task.id);
          }}
          className="shrink-0 cursor-pointer mt-0.5 p-0.5 rounded-full hover:bg-muted/85 transition-colors"
        >
          {isDone ? (
            <CheckCircle2
              size={18}
              className="text-success hover:scale-105 transition-transform duration-100"
            />
          ) : (
            <Circle
              size={18}
              className="text-muted-foreground hover:text-primary hover:scale-105 transition-all duration-100"
            />
          )}
        </div>

        {/* Title, Description and Labels column */}
        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <span
            className={cn(
              "text-base font-semibold tracking-tight text-foreground truncate",
              isDone ? "line-through text-muted-foreground/60 font-normal" : ""
            )}
          >
            {task.title}
          </span>

          {/* Description Preview */}
          {plainDescription && (
            <p className="text-sm text-muted-foreground/80 line-clamp-1 max-w-[650px] font-normal leading-relaxed">
              {plainDescription}
            </p>
          )}

          {/* Labels stack */}
          {taskLabels.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap pt-1">
              {taskLabels.map((lbl) => (
                <span
                  key={lbl.id}
                  className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide transition-all"
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
      </div>

      {/* Right Column: Metadata stack */}
      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end self-stretch sm:self-auto pt-2 sm:pt-0 border-t border-border/20 sm:border-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {/* Estimate */}
          {projectTemplate !== "simple" && task.estimate !== undefined && task.estimate !== null && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border/40 bg-muted/20 text-xs text-muted-foreground font-mono h-5">
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
          <Avatar className="h-5.5 w-5.5 border border-border shadow-xs shrink-0 transition-transform duration-100 hover:scale-110">
            <AvatarImage src={task.assignee?.image || ""} />
            <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">
              {task.assignee?.name ? task.assignee.name.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Hover Action Indicator */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pl-2 shrink-0 hidden sm:block">
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 hover:bg-primary/20">
            Open
          </span>
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
    <div className="flex flex-col gap-2 mb-6">
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
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 group-hover:text-foreground transition-colors duration-150">
            {status.name}
          </h3>
          <span className="text-xs bg-muted/60 text-muted-foreground font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center ml-1">
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
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-dashed border-border/30 rounded-xl bg-muted/5 my-1.5">
                <p className="text-sm font-medium text-muted-foreground/70">
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
