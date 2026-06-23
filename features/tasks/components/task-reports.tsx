"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Users, BarChart3 } from "lucide-react";

interface TaskReportsProps {
  tasks: {
    deletedAt?: string | null;
    assigneeId?: string | null;
    sprintId?: string | null;
    status?: { category: string };
    estimate?: number;
  }[];
  sprints: {
    id: string;
    status: string;
    name: string;
  }[];
  projectMembers: {
    user: { id: string; name: string };
  }[];
  projectTemplate: string;
}

const COLORS = ["#a855f7", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#3b82f6"];

export function TaskReports({
  tasks,
  sprints,
  projectMembers,
  projectTemplate,
}: TaskReportsProps) {
  // 1. Calculate Workload Data
  const memberWorkloadMap: Record<string, { name: string; count: number }> = {};

  // Initialize all members with 0 tasks
  projectMembers.forEach((m) => {
    memberWorkloadMap[m.user.id] = { name: m.user.name, count: 0 };
  });

  let unassignedCount = 0;

  tasks.forEach((t) => {
    if (t.deletedAt) return;
    if (t.assigneeId && memberWorkloadMap[t.assigneeId]) {
      memberWorkloadMap[t.assigneeId].count += 1;
    } else {
      unassignedCount += 1;
    }
  });

  const workloadData = Object.values(memberWorkloadMap).filter((item) => item.count > 0);
  if (unassignedCount > 0) {
    workloadData.push({ name: "Unassigned", count: unassignedCount });
  }

  // 2. Calculate Sprint Velocity Data (Scrum only)
  const completedSprints = sprints.filter((s) => s.status === "completed");
  const velocityData = completedSprints.map((sprint) => {
    const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);

    // Done category tasks sum
    const completedPoints = sprintTasks
      .filter((t) => t.status?.category === "done")
      .reduce((acc, t) => acc + (t.estimate || 0), 0);

    const totalPlannedPoints = sprintTasks.reduce(
      (acc, t) => acc + (t.estimate || 0),
      0
    );

    return {
      name: sprint.name,
      "Total Planned": totalPlannedPoints,
      "Completed": completedPoints,
    };
  });

  return (
    <div className="space-y-6 overflow-y-auto pr-2 pb-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border p-4">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Tasks</span>
          <span className="text-2xl font-bold text-foreground">{tasks.length}</span>
        </Card>
        <Card className="bg-card border-border p-4">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Completed Tasks</span>
          <span className="text-2xl font-bold text-emerald-400">
            {tasks.filter((t) => t.status?.category === "done").length}
          </span>
        </Card>
        <Card className="bg-card border-border p-4">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Unassigned Tasks</span>
          <span className="text-2xl font-bold text-amber-500">
            {tasks.filter((t) => !t.assigneeId).length}
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Summary Chart */}
        <Card className="bg-card border-border rounded-xl overflow-hidden">
          <CardHeader className="p-4 border-b border-border bg-card flex flex-row items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <CardTitle className="text-sm font-bold text-foreground">Team Workload Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            {workloadData.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No tasks assigned</EmptyTitle>
                  <EmptyDescription>Assign tasks to team members to see workload breakdown.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="w-full h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workloadData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {workloadData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--popover-foreground)",
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ fontSize: "11px", color: "var(--muted-foreground)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Velocity Chart (Scrum only) */}
        {projectTemplate === "scrum" && (
          <Card className="bg-card border-border rounded-xl overflow-hidden">
            <CardHeader className="p-4 border-b border-border bg-card flex flex-row items-center gap-2">
              <BarChart3 size={16} className="text-muted-foreground" />
              <CardTitle className="text-sm font-bold text-foreground">Sprint Velocity Chart</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col justify-center min-h-[300px]">
              {velocityData.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No completed sprints</EmptyTitle>
                    <EmptyDescription>Complete your first work cycle/sprint to unlock velocity reporting metrics.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "var(--muted-foreground)" }} />
                      <Bar dataKey="Total Planned" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kanban stats summary if not scrum */}
        {projectTemplate !== "scrum" && (
          <Card className="bg-card border-border rounded-xl overflow-hidden p-6 flex flex-col justify-center min-h-[300px]">
            <h4 className="text-xs font-semibold text-muted-foreground mb-4 uppercase">Task Stage Breakdown</h4>
            <div className="space-y-4">
              {["backlog", "todo", "in_progress", "done"].map((cat) => {
                const catTasks = tasks.filter((t) => t.status?.category === cat);
                const percentage = tasks.length > 0 ? (catTasks.length / tasks.length) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="capitalize text-foreground font-semibold">{cat.replace("_", " ")}</span>
                      <span className="text-muted-foreground font-mono">
                        {catTasks.length} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cat === "done"
                            ? "bg-emerald-500"
                            : cat === "in_progress"
                            ? "bg-primary"
                            : cat === "todo"
                            ? "bg-yellow-500"
                            : "bg-muted"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
