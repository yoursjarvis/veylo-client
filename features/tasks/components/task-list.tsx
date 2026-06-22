"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
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
  Clock,
} from "lucide-react";

interface TaskListProps {
  tasks: any[];
  statuses: any[];
  projectMembers: any[];
  projectTemplate: string;
  onSelectTask: (taskId: string) => void;
}

export function TaskList({
  tasks,
  statuses,
  projectMembers,
  projectTemplate,
  onSelectTask,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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
        return <Badge className="bg-red-950 text-red-400 border border-red-800 text-[10px] uppercase font-bold py-0.5">Urgent</Badge>;
      case "high":
        return <Badge className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] uppercase font-bold py-0.5">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-950 text-yellow-500 border border-yellow-800/40 text-[10px] uppercase font-bold py-0.5">Medium</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground text-[10px] uppercase font-bold py-0.5">Low</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "bug":
        return (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
            <Bug size={12} /> <span>Bug</span>
          </div>
        );
      case "feature":
        return (
          <div className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold">
            <Sparkles size={12} /> <span>Feature</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
            <ChevronRight size={12} /> <span>Task</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-3 items-center bg-card p-3 rounded-xl border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border text-xs text-foreground"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          {statuses.map((st: any) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All Types</option>
          <option value="task">Task</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
        </select>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto border border-border rounded-xl bg-background">
        <Table>
          <TableHeader className="bg-card sticky top-0 border-b border-border">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground font-semibold text-xs">Title</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-xs w-[120px]">Type</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-xs w-[120px]">Status</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-xs w-[110px]">Priority</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-xs w-[140px]">Assignee</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-xs w-[110px]">Due Date</TableHead>
              {projectTemplate !== "simple" && (
                <TableHead className="text-muted-foreground font-semibold text-xs w-[80px]">Est.</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={projectTemplate === "simple" ? 6 : 7}
                  className="h-28 text-center text-muted-foreground text-xs"
                >
                  No tasks match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className="hover:bg-muted border-border cursor-pointer"
                >
                  <TableCell className="font-semibold text-foreground text-xs py-3 max-w-[200px] truncate">
                    {task.title}
                  </TableCell>
                  <TableCell className="py-3">{getTypeBadge(task.type)}</TableCell>
                  <TableCell className="py-3">
                    <Badge className="bg-muted text-foreground border border-border text-[10px] px-2 py-0">
                      {task.status.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 border border-border">
                        <AvatarImage src={task.assignee?.image || ""} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-bold">
                          {task.assignee?.name ? task.assignee.name.charAt(0).toUpperCase() : "-"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground truncate max-w-[100px]">
                        {task.assignee?.name || <span className="text-muted-foreground text-[10px]">Unassigned</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {task.dueDate ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={12} className="text-muted-foreground/60" />
                        <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60 text-xs">-</span>
                    )}
                  </TableCell>
                  {projectTemplate !== "simple" && (
                    <TableCell className="py-3 font-mono text-xs text-foreground">
                      {task.estimate ?? "-"}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
