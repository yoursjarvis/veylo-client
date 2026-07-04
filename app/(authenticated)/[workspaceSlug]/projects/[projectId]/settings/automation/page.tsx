"use client";

import React, { useState } from "react";
import { useProject } from "../../layout";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ComboboxSelect } from "@/components/ui/combobox-select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Plus, Trash2, Cpu, Info, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TRIGGER_LABELS: Record<string, string> = {
  task_created: "Task Created",
  task_status_changed: "Task Status Changed",
  priority_changed: "Task Priority Changed",
  subtasks_all_done: "All Subtasks Completed",
};

const ACTION_LABELS: Record<string, string> = {
  close_parent: "Close/Update Parent Status",
  assign_to_creator: "Assign Task to Creator",
  assign_to_user: "Assign Task to Specific Member",
  set_priority: "Set Priority",
  add_comment: "Post Automated Comment",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  triggerVal?: string | null;
  action: string;
  actionVal?: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AutomationSettingsPage() {
  const { projectId, isWorkspaceAdmin } = useProject();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("task_status_changed");
  const [triggerVal, setTriggerVal] = useState("");
  const [action, setAction] = useState("close_parent");
  const [actionVal, setActionVal] = useState("");

  const { data: rules = [], isLoading } = useQuery<AutomationRule[]>({
    queryKey: ["project-automation-rules", projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/projects/${projectId}/automation-rules`);
      return res.data.data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/projects/${projectId}/members`);
      return res.data.data;
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: Record<string, string | null>) => {
      const res = await axiosInstance.post(`/projects/${projectId}/automation-rules`, data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Automation rule created successfully");
      queryClient.invalidateQueries({ queryKey: ["project-automation-rules", projectId] });
      setName("");
      setTriggerVal("");
      setActionVal("");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to create rule");
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ ruleId, data }: { ruleId: string; data: Partial<AutomationRule> }) => {
      const res = await axiosInstance.put(`/projects/${projectId}/automation-rules/${ruleId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-automation-rules", projectId] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to update rule");
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      await axiosInstance.delete(`/projects/${projectId}/automation-rules/${ruleId}`);
    },
    onSuccess: () => {
      toast.success("Automation rule deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["project-automation-rules", projectId] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to delete rule");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a name for the automation rule");
      return;
    }
    createRuleMutation.mutate({
      name,
      trigger,
      triggerVal: triggerVal || null,
      action,
      actionVal: actionVal || null,
    });
  };

  const handleToggleActive = (rule: AutomationRule) => {
    updateRuleMutation.mutate({
      ruleId: rule.id,
      data: { isActive: !rule.isActive },
    });
  };

  if (!isWorkspaceAdmin) {
    return (
      <div className="text-center p-8">
        You do not have administrative permissions to view settings.
      </div>
    );
  }

  const memberOptions = (members || []).map((m: { userId: string; user?: { name?: string | null; email?: string | null; image?: string | null } }) => ({
    value: m.userId,
    label: m.user?.name || m.user?.email || "Unknown User",
    icon: (
      <Avatar className="h-5 w-5 border border-border shrink-0">
        <AvatarImage src={m.user?.image || ""} />
        <AvatarFallback className="bg-muted text-[8px] font-bold text-foreground">
          {m.user?.name?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
    ),
  }));

  const getTriggerValLabel = () => {
    if (trigger === "priority_changed") {
      return "When priority changes to:";
    }
    return "Trigger Status Value (optional):";
  };

  const getTriggerValPlaceholder = () => {
    if (trigger === "priority_changed") {
      return "e.g. urgent or high";
    }
    return "e.g. Done or In Progress";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b pb-5">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" /> Automation Rules
        </h3>
        <p className="text-xs mt-1 text-muted-foreground">
          Configure Jira/Trello style If-This-Then-That (ITTT) automation rules to auto-trigger events, manage tasks, and reduce manual overhead.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Rule Form */}
        <div className="lg:col-span-1">
          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Create Rule
              </CardTitle>
              <CardDescription className="text-xs">
                Build a new trigger-action automation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name" className="text-xs">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="e.g. Close Parent when Subtasks Done"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs w-full"
                    required
                  />
                </div>

                 <div className="space-y-2">
                  <Label className="text-xs">When Trigger Fired...</Label>
                  <Select
                    value={trigger}
                    onValueChange={(val) => {
                      setTrigger(val || "");
                      setTriggerVal("");
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs w-full">
                      <span className="flex flex-1 text-left">{TRIGGER_LABELS[trigger] || "Select Trigger"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task_created" className="text-xs">Task Created</SelectItem>
                      <SelectItem value="task_status_changed" className="text-xs">Task Status Changed</SelectItem>
                      <SelectItem value="priority_changed" className="text-xs">Task Priority Changed</SelectItem>
                      <SelectItem value="subtasks_all_done" className="text-xs">All Subtasks Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(trigger === "task_status_changed" || trigger === "priority_changed") && (
                  <div className="space-y-2">
                    <Label htmlFor="trigger-val" className="text-xs">{getTriggerValLabel()}</Label>
                    <Input
                      id="trigger-val"
                      placeholder={getTriggerValPlaceholder()}
                      value={triggerVal}
                      onChange={(e) => setTriggerVal(e.target.value)}
                      className="h-9 text-xs w-full"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Then Execute Action...</Label>
                  <Select
                    value={action}
                    onValueChange={(val) => {
                      setAction(val || "");
                      setActionVal("");
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs w-full">
                      <span className="flex flex-1 text-left">{ACTION_LABELS[action] || "Select Action"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="close_parent" className="text-xs">Close/Update Parent Status</SelectItem>
                      <SelectItem value="assign_to_creator" className="text-xs">Assign Task to Creator</SelectItem>
                      <SelectItem value="assign_to_user" className="text-xs">Assign Task to Specific Member</SelectItem>
                      <SelectItem value="set_priority" className="text-xs">Set Priority</SelectItem>
                      <SelectItem value="add_comment" className="text-xs">Post Automated Comment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {action === "assign_to_user" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Select Assignee</Label>
                    <ComboboxSelect
                      value={actionVal}
                      onValueChange={(val) => setActionVal(val || "")}
                      options={memberOptions}
                      placeholder="Search member..."
                      className="w-full text-xs"
                    />
                  </div>
                )}

                {action === "close_parent" && (
                  <div className="space-y-2">
                    <Label htmlFor="action-val" className="text-xs">Target Status Name/Category</Label>
                    <Input
                      id="action-val"
                      placeholder="e.g. Done (defaults to Done)"
                      value={actionVal}
                      onChange={(e) => setActionVal(e.target.value)}
                      className="h-9 text-xs w-full"
                    />
                  </div>
                )}

                {action === "set_priority" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Priority Value</Label>
                    <Select
                      value={actionVal || "medium"}
                      onValueChange={(val) => setActionVal(val || "medium")}
                    >
                      <SelectTrigger className="h-9 text-xs w-full">
                        <span className="flex flex-1 text-left">{PRIORITY_LABELS[actionVal || "medium"] || "Select Priority"}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-xs">Low</SelectItem>
                        <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                        <SelectItem value="high" className="text-xs">High</SelectItem>
                        <SelectItem value="urgent" className="text-xs">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {action === "add_comment" && (
                  <div className="space-y-2">
                    <Label htmlFor="action-val" className="text-xs">Comment Text</Label>
                    <Input
                      id="action-val"
                      placeholder="e.g. Automated review comment"
                      value={actionVal}
                      onChange={(e) => setActionVal(e.target.value)}
                      className="h-9 text-xs w-full"
                      required
                    />
                  </div>
                )}

                <Button type="submit" disabled={createRuleMutation.isPending} className="w-full h-9 text-xs mt-2">
                  {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Existing Rules List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Active Rules
              </CardTitle>
              <CardDescription className="text-xs">
                List of configured automation rules running in this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">
                  Loading automation rules...
                </div>
              ) : rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl text-center">
                  <Info className="h-6 w-6 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No automation rules configured</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 max-w-sm">
                    Build automation rules using the form on the left to streamline workflows. E.g. automatic parenting, auto-assignment, etc.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => {
                    let friendlyActionVal = rule.actionVal;
                    if (rule.action === "assign_to_user") {
                      const userOpt = memberOptions.find((opt: { value: string; label: string }) => opt.value === rule.actionVal);
                      if (userOpt) friendlyActionVal = userOpt.label;
                    }

                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-card hover:bg-muted/10 transition-all gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-bold truncate text-foreground">{rule.name}</p>
                          <p className="text-[10px] text-muted-foreground leading-normal">
                            <span className="font-semibold text-primary">WHEN</span>{" "}
                            <span className="capitalize">{rule.trigger.replace(/_/g, " ")}</span>
                            {rule.triggerVal && ` (${rule.triggerVal})`}{" "}
                            <span className="font-semibold text-primary">THEN</span>{" "}
                            <span className="capitalize">{rule.action.replace(/_/g, " ")}</span>
                            {friendlyActionVal && ` (${friendlyActionVal})`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => handleToggleActive(rule)}
                            disabled={updateRuleMutation.isPending}
                          />
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                            disabled={deleteRuleMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
