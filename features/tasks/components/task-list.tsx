"use client";

import React, { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Bug,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle
} from "lucide-react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";

interface TaskListProps {
  tasks: {
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
  }[];
  statuses: { id: string; name: string }[];
  projectMembers?: unknown[];
  projectTemplate: string;
  onSelectTask: (taskId: string) => void;
}

export function TaskList({
  tasks,
  statuses,
  projectTemplate,
  onSelectTask,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Track collapsed status sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (statusId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [statusId]: !prev[statusId],
    }));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter ? task.statusId === statusFilter : true;
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
    const matchesType = typeFilter ? task.type === typeFilter : true;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "urgent":
        return (
          <Badge
            variant="destructive"
            size="xs"
            radius="full"
            className="uppercase font-bold text-[10px] px-2 py-0.5 leading-none"
          >
            Urgent
          </Badge>
        );
      case "high":
        return (
          <Badge
            variant="warning-light"
            size="xs"
            radius="full"
            className="uppercase font-bold text-[10px] px-2 py-0.5 leading-none border border-warning/20"
          >
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="info-light"
            size="xs"
            radius="full"
            className="uppercase font-bold text-[10px] px-2 py-0.5 leading-none border border-info/20"
          >
            Medium
          </Badge>
        );
      default:
        return (
          <Badge
            variant="invert-light"
            size="xs"
            radius="full"
            className="uppercase font-bold text-[10px] px-2 py-0.5 leading-none border border-border text-muted-foreground"
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
          <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold">
            <Bug size={12} className="text-destructive" /> <span>Bug</span>
          </div>
        );
      case "feature":
        return (
          <div className="flex items-center gap-1.5 text-xs text-info font-semibold">
            <Sparkles size={12} className="text-info" /> <span>Feature</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <ChevronRight size={12} /> <span>Task</span>
          </div>
        );
    }
  };

  const getDueDateDisplay = (dueDateStr?: string) => {
    if (!dueDateStr) return <span className="text-muted-foreground">-</span>;
    const date = new Date(dueDateStr);
    const past = isPast(date) && !isToday(date);
    return (
      <div className={`flex items-center gap-1.5 text-xs font-medium ${past ? "text-destructive" : "text-muted-foreground"}`}>
        <Calendar size={12} className={past ? "text-destructive" : "text-muted-foreground"} />
        <span>{format(date, "MMM d")}</span>
      </div>
    );
  };

  const activeStatuses = statuses.length > 0 ? statuses : [{ id: "unknown", name: "Backlog" }];

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0">

      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-3 items-center bg-card p-3 rounded-xl border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border text-xs text-foreground placeholder-muted-foreground focus-visible:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <Combobox
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val ?? "")}
        >
          <ComboboxInput
            placeholder="All Statuses"
            className="w-[140px] bg-background border border-border text-xs"
            showTrigger
          />
          <ComboboxContent className="bg-popover border border-border">
            <ComboboxList>
              <ComboboxItem value="">All Statuses</ComboboxItem>
              {statuses.map((st) => (
                <ComboboxItem key={st.id} value={st.id}>
                  {st.name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {/* Priority Filter */}
        <Combobox
          value={priorityFilter}
          onValueChange={(val) => setPriorityFilter(val ?? "")}
        >
          <ComboboxInput
            placeholder="All Priorities"
            className="w-[140px] bg-background border border-border text-xs"
            showTrigger
          />
          <ComboboxContent className="bg-popover border border-border">
            <ComboboxList>
              <ComboboxItem value="">All Priorities</ComboboxItem>
              <ComboboxItem value="low">Low</ComboboxItem>
              <ComboboxItem value="medium">Medium</ComboboxItem>
              <ComboboxItem value="high">High</ComboboxItem>
              <ComboboxItem value="urgent">Urgent</ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {/* Type Filter */}
        <Combobox
          value={typeFilter}
          onValueChange={(val) => setTypeFilter(val ?? "")}
        >
          <ComboboxInput
            placeholder="All Types"
            className="w-[130px] bg-background border border-border text-xs"
            showTrigger
          />
          <ComboboxContent className="bg-popover border border-border">
            <ComboboxList>
              <ComboboxItem value="">All Types</ComboboxItem>
              <ComboboxItem value="task">Task</ComboboxItem>
              <ComboboxItem value="bug">Bug</ComboboxItem>
              <ComboboxItem value="feature">Feature</ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* Grouped Table Sections */}
      <div className="space-y-4 overflow-y-auto pr-1">
        {activeStatuses.map((status) => {
          const statusTasks = filteredTasks.filter((t) => t.statusId === status.id || (!t.statusId && status.id === activeStatuses[0].id));
          const isCollapsed = collapsedSections[status.id];
          const hasTasks = statusTasks.length > 0;

          // Don't show empty statuses if we are filtering, unless it's the only status
          if (statusFilter && statusFilter !== status.id && !hasTasks) return null;

          return (
            <div key={status.id} className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">

              {/* Group Header */}
              <div
                onClick={() => toggleSection(status.id)}
                className="flex items-center gap-2.5 px-4 py-3 bg-muted/50 border-b border-border cursor-pointer select-none group"
              >
                {isCollapsed ? (
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
                <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">{status.name}</span>
                <span className="text-[10px] bg-muted border border-border text-muted-foreground font-bold px-2 py-0.5 rounded-full">
                  {statusTasks.length}
                </span>
              </div>

              {/* Group Table View */}
              {!isCollapsed && (
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader className="bg-muted/10 border-b border-border">
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider pl-4">Task Name</TableHead>
                        <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider w-[140px]">Assignee</TableHead>
                        <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider w-[120px]">Due Date</TableHead>
                        <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider w-[110px]">Priority</TableHead>
                        <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider w-[110px]">Category</TableHead>
                        {projectTemplate !== "simple" && (
                          <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider w-[80px]">Est.</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusTasks.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={projectTemplate === "simple" ? 5 : 6}
                            className="h-14 text-center text-muted-foreground text-xs italic"
                          >
                            No tasks in this section.
                          </TableCell>
                        </TableRow>
                      ) : (
                        statusTasks.map((task) => {
                          const isDone = task.status?.name?.toLowerCase() === "done" || task.status?.name?.toLowerCase() === "completed";
                          return (
                            <TableRow
                              key={task.id}
                              onClick={() => onSelectTask(task.id)}
                              className="hover:bg-muted/30 border-border cursor-pointer transition-colors"
                            >
                              {/* Task Title with Checkbox */}
                              <TableCell className="font-semibold text-foreground text-xs py-3 pl-4 max-w-[280px]">
                                <div className="flex items-center gap-2.5">
                                  {isDone ? (
                                    <CheckCircle2 size={16} className="text-success shrink-0" />
                                  ) : (
                                    <Circle size={16} className="text-muted-foreground hover:text-primary transition-colors shrink-0" />
                                  )}
                                  <span className={`truncate ${isDone ? "line-through text-muted-foreground font-normal" : "text-foreground"}`}>
                                    {task.title}
                                  </span>
                                </div>
                              </TableCell>

                              {/* Assignee */}
                              <TableCell className="py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5.5 w-5.5 border border-border">
                                    <AvatarImage src={task.assignee?.image || ""} />
                                    <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-bold">
                                      {task.assignee?.name ? task.assignee.name.charAt(0).toUpperCase() : "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-foreground truncate max-w-[100px]">
                                    {task.assignee?.name || <span className="text-muted-foreground italic">Unassigned</span>}
                                  </span>
                                </div>
                              </TableCell>

                              {/* Due Date */}
                              <TableCell className="py-3">
                                {getDueDateDisplay(task.dueDate)}
                              </TableCell>

                              {/* Priority */}
                              <TableCell className="py-3">
                                {getPriorityBadge(task.priority)}
                              </TableCell>

                              {/* Category */}
                              <TableCell className="py-3">
                                {getTypeBadge(task.type)}
                              </TableCell>

                              {/* Estimate */}
                              {projectTemplate !== "simple" && (
                                <TableCell className="py-3 font-mono text-xs text-foreground">
                                  {task.estimate ?? <span className="text-muted-foreground">-</span>}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-semibold text-muted-foreground">No tasks match your search criteria</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Try clearing filters or checking other task boards.</p>
          </div>
        )}
      </div>

    </div>
  );
}

