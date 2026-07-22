export type AutomationTriggerType =
  "TASK_CREATED" | "STATUS_UPDATED" | "FIELD_UPDATED" | "ASSIGNEE_CHANGED"

export interface AutomationTrigger {
  id: string
  type: AutomationTriggerType
  config: Record<string, string | number | boolean | null>
}

export type AutomationActionType =
  "ASSIGN_USER" | "ADD_COMMENT" | "CHANGE_STATUS" | "SEND_EMAIL"

export interface AutomationAction {
  id: string
  type: AutomationActionType
  payload: Record<string, string | number | boolean | null>
}

export type AutomationConditionOperator =
  "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "IS_EMPTY" | "IS_NOT_EMPTY"

export interface AutomationCondition {
  id: string
  field: string
  operator: AutomationConditionOperator
  value: string | number | boolean | null
}

export interface AutomationActionStep {
  id: string
  type: "ACTION"
  action: AutomationAction
}

export interface AutomationConditionStep {
  id: string
  type: "CONDITION"
  condition: AutomationCondition
  trueBranch: AutomationStep[]
  falseBranch: AutomationStep[]
}

export type AutomationStep = AutomationActionStep | AutomationConditionStep

export interface AutomationRule {
  id: string
  name: string
  isActive: boolean
  isDeleted?: boolean
  projectId?: string
  workspaceId: string
  trigger: AutomationTrigger
  steps: AutomationStep[]
}
