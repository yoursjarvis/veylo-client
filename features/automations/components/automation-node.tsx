import { GitMerge, MessageSquare, Tag, UserPlus, Zap } from "lucide-react"
import {
  AutomationAction,
  AutomationCondition,
  AutomationTrigger,
} from "../types/automation"

interface AutomationNodeProps {
  type: "TRIGGER" | "ACTION" | "CONDITION"
  data: AutomationTrigger | AutomationAction | AutomationCondition
  isSelected: boolean
  onClick: () => void
}

export function AutomationNode({ type, data, isSelected, onClick }: AutomationNodeProps) {
  let title = ""
  let description = ""
  let icon = <Zap className="h-4 w-4" />
  let colorClass = "bg-primary text-primary-foreground"

  if (type === "TRIGGER") {
    const trigger = data as AutomationTrigger
    colorClass = "bg-primary text-primary-foreground"
    switch (trigger.type) {
      case "TASK_CREATED":
        title = "When Task is Created"
        description = "Triggers when a new task is added."
        break
      case "STATUS_UPDATED":
        title = "When Status Changes"
        description = "Triggers on any status movement."
        break
      case "FIELD_UPDATED":
        title = "When Field Updates"
        description = "Triggers when a custom field changes."
        break
      case "ASSIGNEE_CHANGED":
        title = "When Assignee Changes"
        description = "Triggers when a user is assigned or unassigned."
        icon = <UserPlus className="h-4 w-4" />
        break
    }
  } else if (type === "ACTION") {
    const action = data as AutomationAction
    colorClass = "bg-success text-success-foreground"
    switch (action.type) {
      case "ASSIGN_USER":
        title = "Assign User"
        description = "Assigns the task to a specific user."
        icon = <UserPlus className="h-4 w-4" />
        break
      case "ADD_COMMENT":
        title = "Add Comment"
        description = "Posts a new comment to the task."
        icon = <MessageSquare className="h-4 w-4" />
        break
      case "CHANGE_STATUS":
        title = "Change Status"
        description = "Moves the task to a new status."
        icon = <Tag className="h-4 w-4" />
        break
      case "SEND_EMAIL":
        title = "Send Email"
        description = "Sends an email notification."
        icon = <MessageSquare className="h-4 w-4" />
        break
    }
  } else if (type === "CONDITION") {
    const condition = data as AutomationCondition
    colorClass = "bg-info text-info-foreground"
    title = "If Condition Matches"
    description = `Check if ${condition.field} ${condition.operator.toLowerCase().replace("_", " ")} ${String(condition.value)}`
    icon = <GitMerge className="h-4 w-4" />
  }

  return (
    <div
      onClick={onClick}
      className={`group ${isSelected ? "ring-2 ring-offset-background" : "hover:border-foreground/30"} relative z-10 flex w-[300px] cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm ring-primary ring-offset-2 transition-all hover:shadow-md`}
    >
      <div className="flex flex-row items-center gap-3 border-b border-border/50 p-3">
        <div
          className={`${colorClass} flex h-8 w-8 items-center justify-center rounded-lg`}
        >
          {icon}
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {type}
          </span>
          <span className="text-sm font-medium">{title}</span>
        </div>
      </div>
      <div className="bg-muted/10 p-3 text-xs text-muted-foreground">
        {description}
      </div>
    </div>
  )
}
