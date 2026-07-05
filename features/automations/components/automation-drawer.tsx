import React from "react"
import {
  AutomationRule,
  AutomationStep,
  AutomationTrigger,
  AutomationTriggerType,
  AutomationActionType,
  AutomationConditionOperator,
} from "../types/automation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ComboboxSelect } from "@/components/ui/combobox-select"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
 // Wait, I need to check where useProjectMembers is. It's actually useMembers or just standard query. Let's write the query manually or find the hook.

import { useQuery } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { X } from "lucide-react"

interface AutomationDrawerProps {
  projectId?: string;
  rule: AutomationRule
  selectedNodeId: string | null
  onClose: () => void
  onUpdateTrigger: (trigger: AutomationTrigger) => void
  onUpdateStep: (stepId: string, updatedStep: AutomationStep) => void
}

export function AutomationDrawer({
  rule,
  projectId,
  selectedNodeId,
  onClose,
  onUpdateTrigger,
  onUpdateStep,
}: AutomationDrawerProps) {
  if (!selectedNodeId) return null

  // Find the selected node
  let nodeType: "TRIGGER" | "ACTION" | "CONDITION" | null = null
  let selectedNodeData: AutomationTrigger | AutomationStep | null = null

  if (rule.trigger.id === selectedNodeId) {
    nodeType = "TRIGGER"
    selectedNodeData = rule.trigger
  } else {
    // Search the steps tree
    const findStep = (steps: AutomationStep[]): AutomationStep | null => {
      for (const step of steps) {
        if (step.id === selectedNodeId) return step
        if (step.type === "CONDITION") {
          const foundInTrue = findStep(step.trueBranch)
          if (foundInTrue) return foundInTrue
          const foundInFalse = findStep(step.falseBranch)
          if (foundInFalse) return foundInFalse
        }
      }
      return null
    }

    const foundStep = findStep(rule.steps)
    if (foundStep) {
      nodeType = foundStep.type
      selectedNodeData = foundStep
    }
  }

  if (!nodeType || !selectedNodeData) return null

  return (
    <div className="w-[400px] border-l border-border bg-card p-6 shadow-xl flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Configure {nodeType}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6 flex-1">
        {nodeType === "TRIGGER" && (
          <TriggerForm
            trigger={selectedNodeData as AutomationTrigger}
            projectId={projectId}
            onChange={onUpdateTrigger}
          />
        )}
        {nodeType === "ACTION" && (
          <ActionForm
            step={selectedNodeData as AutomationStep}
            projectId={projectId}
            onChange={(step) => onUpdateStep(step.id, step)}
          />
        )}
        {nodeType === "CONDITION" && (
          <ConditionForm
            step={selectedNodeData as AutomationStep}
            onChange={(step) => onUpdateStep(step.id, step)}
          />
        )}
      </div>

      <div className="pt-6 border-t border-border mt-auto">
        <Button className="w-full" onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}

interface StatusObj { id: string; name: string }
interface MemberObj { userId: string; user?: { name?: string | null; email?: string | null; image?: string | null } }

function TriggerForm({
  trigger,
  onChange,
  projectId,
}: {
  trigger: AutomationTrigger
  onChange: (t: AutomationTrigger) => void
  projectId?: string
}) {
  const { data: statuses = [] } = useQuery({
    queryKey: ["project-statuses", projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/projects/${projectId}/statuses`);
      return res.data.data;
    },
    enabled: !!projectId,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Event Type</Label>
        <Select
          value={trigger.type}
          onValueChange={(val) =>
            onChange({
              ...trigger,
              type: val as AutomationTriggerType,
            })
          }
        >
          <SelectTrigger className="w-full bg-background border-input">
            <SelectValue placeholder="Select Event Type">
              {(val: string) => {
                const labels: Record<string, string> = {
                  TASK_CREATED: "Task Created",
                  STATUS_UPDATED: "Status Updated",
                  FIELD_UPDATED: "Custom Field Updated",
                  ASSIGNEE_CHANGED: "Assignee Changed",
                };
                return labels[val] || val || "Select Event Type";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TASK_CREATED">Task Created</SelectItem>
            <SelectItem value="STATUS_UPDATED">Status Updated</SelectItem>
            <SelectItem value="FIELD_UPDATED">Custom Field Updated</SelectItem>
            <SelectItem value="ASSIGNEE_CHANGED">Assignee Changed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {trigger.type === "STATUS_UPDATED" && (
        <>
          <div className="space-y-2">
            <Label>From Status (Optional)</Label>
            <Select
              value={(trigger.config.fromStatus as string) || "any"}
              onValueChange={(val) =>
                onChange({
                  ...trigger,
                  config: { ...trigger.config, fromStatus: val === "any" ? null : val },
                })
              }
            >
              <SelectTrigger className="w-full bg-background border-input">
                <SelectValue placeholder="Any Status">
                  {(val: string) => {
                    if (!val || val === "any") return "Any Status";
                    const status = statuses.find((s: StatusObj) => s.id === val);
                    return status ? status.name : val;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Status</SelectItem>
                {statuses.map((s: StatusObj) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To Status (Optional)</Label>
            <Select
              value={(trigger.config.toStatus as string) || "any"}
              onValueChange={(val) =>
                onChange({
                  ...trigger,
                  config: { ...trigger.config, toStatus: val === "any" ? null : val },
                })
              }
            >
              <SelectTrigger className="w-full bg-background border-input">
                <SelectValue placeholder="Any Status">
                  {(val: string) => {
                    if (!val || val === "any") return "Any Status";
                    const status = statuses.find((s: StatusObj) => s.id === val);
                    return status ? status.name : val;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Status</SelectItem>
                {statuses.map((s: StatusObj) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
        This automation will run whenever the selected event occurs in the workspace or project.
      </div>
    </div>
  )
}

function ActionForm({
  step,
  onChange,
  projectId,
}: {
  step: AutomationStep
  onChange: (s: AutomationStep) => void
  projectId?: string
}) {
  const isAction = step.type === "ACTION";
  
  const { data: members = [] } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/projects/${projectId}/members`);
      return res.data.data;
    },
    enabled: !!projectId && isAction,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["project-statuses", projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/projects/${projectId}/statuses`);
      return res.data.data;
    },
    enabled: !!projectId && isAction,
  });

  if (!isAction) return null
  const action = step.action

  const memberOptions = (members || []).map((m: MemberObj) => ({
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Action Type</Label>
        <Select
          value={action.type}
          onValueChange={(val) =>
            onChange({
              ...step,
              action: {
                ...action,
                type: val as AutomationActionType,
              },
            })
          }
        >
          <SelectTrigger className="w-full bg-background border-input">
            <SelectValue placeholder="Select Action Type">
              {(val: string) => {
                const labels: Record<string, string> = {
                  ASSIGN_USER: "Assign to User",
                  ADD_COMMENT: "Add Comment",
                  CHANGE_STATUS: "Change Status",
                  SEND_EMAIL: "Send Email",
                };
                return labels[val] || val || "Select Action Type";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASSIGN_USER">Assign to User</SelectItem>
            <SelectItem value="ADD_COMMENT">Add Comment</SelectItem>
            <SelectItem value="CHANGE_STATUS">Change Status</SelectItem>
            <SelectItem value="SEND_EMAIL">Send Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {action.type === "ASSIGN_USER" && (
        <div className="space-y-2">
          <Label>Select Assignee</Label>
          <ComboboxSelect
            value={(action.payload.userId as string) || ""}
            onValueChange={(val) =>
              onChange({
                ...step,
                action: {
                  ...action,
                  payload: { ...action.payload, userId: val || "" },
                },
              })
            }
            options={memberOptions}
            placeholder="Search member..."
            className="w-full"
          />
        </div>
      )}

      {action.type === "ADD_COMMENT" && (
        <div className="space-y-2">
          <Label>Comment Text</Label>
          <div className="border border-input rounded-md overflow-hidden bg-background">
            <RichTextEditor
              value={(action.payload.text as string) || ""}
              onChange={(content) =>
                onChange({
                  ...step,
                  action: {
                    ...action,
                    payload: { ...action.payload, text: content },
                  },
                })
              }
              placeholder="Write your automated comment here..."
            />
          </div>
        </div>
      )}

      {action.type === "CHANGE_STATUS" && (
        <div className="space-y-2">
          <Label>New Status</Label>
          <Select
            value={(action.payload.status as string) || ""}
            onValueChange={(val) =>
              onChange({
                ...step,
                action: {
                  ...action,
                  payload: { ...action.payload, status: val },
                },
              })
            }
          >
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Select Status">
                {(val: string) => {
                  if (!val) return "Select Status";
                  const status = statuses.find((s: StatusObj) => s.id === val);
                  return status ? status.name : val;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s: StatusObj) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === "SEND_EMAIL" && (
        <div className="space-y-2">
          <Label>Email Content</Label>
          <div className="border border-input rounded-md overflow-hidden bg-background">
            <RichTextEditor
              value={(action.payload.emailContent as string) || ""}
              onChange={(content) =>
                onChange({
                  ...step,
                  action: {
                    ...action,
                    payload: { ...action.payload, emailContent: content },
                  },
                })
              }
              placeholder="Write the email content here..."
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ConditionForm({
  step,
  onChange,
}: {
  step: AutomationStep
  onChange: (s: AutomationStep) => void
}) {
  if (step.type !== "CONDITION") return null
  const condition = step.condition

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Field to check</Label>
        <Input
          value={condition.field}
          onChange={(e) =>
            onChange({
              ...step,
              condition: { ...condition, field: e.target.value },
            })
          }
          placeholder="e.g. priority, type, custom_field_id"
        />
      </div>

      <div className="space-y-2">
        <Label>Operator</Label>
        <Select
          value={condition.operator}
          onValueChange={(val) =>
            onChange({
              ...step,
              condition: {
                ...condition,
                operator: val as AutomationConditionOperator,
              },
            })
          }
        >
          <SelectTrigger className="w-full bg-background border-input">
            <SelectValue placeholder="Select Operator">
              {(val: string) => {
                const labels: Record<string, string> = {
                  EQUALS: "Equals",
                  NOT_EQUALS: "Does Not Equal",
                  CONTAINS: "Contains",
                  IS_EMPTY: "Is Empty",
                  IS_NOT_EMPTY: "Is Not Empty",
                };
                return labels[val] || val || "Select Operator";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EQUALS">Equals</SelectItem>
            <SelectItem value="NOT_EQUALS">Does Not Equal</SelectItem>
            <SelectItem value="CONTAINS">Contains</SelectItem>
            <SelectItem value="IS_EMPTY">Is Empty</SelectItem>
            <SelectItem value="IS_NOT_EMPTY">Is Not Empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Value</Label>
        <Input
          value={String(condition.value)}
          onChange={(e) =>
            onChange({
              ...step,
              condition: { ...condition, value: e.target.value },
            })
          }
          placeholder="Value to compare against"
        />
      </div>
    </div>
  )
}