import { Button } from "@/components/ui/button"
import { PlayIcon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import {
  AutomationRule,
  AutomationStep,
  AutomationTrigger,
} from "../types/automation"
import { AutomationDrawer } from "./automation-drawer"
import { AutomationNode } from "./automation-node"

interface AutomationBuilderProps {
  initialRule?: AutomationRule
  projectId?: string
  onSave?: (rule: AutomationRule) => void
}

const defaultTrigger: AutomationTrigger = {
  id: "trigger-1",
  type: "TASK_CREATED",
  config: {},
}

export function AutomationBuilder(props: AutomationBuilderProps) {
  const { initialRule, projectId, onSave } = props

  const [rule, setRule] = useState<AutomationRule>(
    initialRule || {
      id: "new-rule",
      name: "Untitled Automation",
      isActive: true,
      workspaceId: "ws-1",
      trigger: defaultTrigger,
      steps: [],
    }
  )

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const handleUpdateTrigger = (updatedTrigger: AutomationTrigger) => {
    setRule({ ...rule, trigger: updatedTrigger })
  }

  // Recursive update function for steps
  const updateStepInTree = (
    steps: AutomationStep[],
    stepId: string,
    updatedStep: AutomationStep
  ): AutomationStep[] => {
    return steps.map((step) => {
      if (step.id === stepId) {
        return updatedStep
      }
      if (step.type === "CONDITION") {
        return {
          ...step,
          trueBranch: updateStepInTree(step.trueBranch, stepId, updatedStep),
          falseBranch: updateStepInTree(step.falseBranch, stepId, updatedStep),
        }
      }
      return step
    })
  }

  const handleUpdateStep = (stepId: string, updatedStep: AutomationStep) => {
    setRule({
      ...rule,
      steps: updateStepInTree(rule.steps, stepId, updatedStep),
    })
  }

  // Recursive add function
  const addStepToTree = (
    steps: AutomationStep[],
    parentId: string | null,
    branch: "true" | "false" | "main",
    newStep: AutomationStep
  ): AutomationStep[] => {
    if (parentId === null && branch === "main") {
      return [...steps, newStep]
    }

    return steps.map((step) => {
      if (step.id === parentId && step.type === "CONDITION") {
        if (branch === "true") {
          return { ...step, trueBranch: [...step.trueBranch, newStep] }
        } else if (branch === "false") {
          return { ...step, falseBranch: [...step.falseBranch, newStep] }
        }
      } else if (step.type === "CONDITION") {
        return {
          ...step,
          trueBranch: addStepToTree(step.trueBranch, parentId, branch, newStep),
          falseBranch: addStepToTree(
            step.falseBranch,
            parentId,
            branch,
            newStep
          ),
        }
      }
      return step
    })
  }

  const handleAddStep = (
    parentId: string | null,
    branch: "true" | "false" | "main" = "main",
    type: "ACTION" | "CONDITION" = "ACTION"
  ) => {
    const newId = `step-${crypto.randomUUID()}`
    let newStep: AutomationStep

    if (type === "ACTION") {
      newStep = {
        id: newId,
        type: "ACTION",
        action: {
          id: `action-${crypto.randomUUID()}`,
          type: "ADD_COMMENT",
          payload: {},
        },
      }
    } else {
      newStep = {
        id: newId,
        type: "CONDITION",
        condition: {
          id: `cond-${crypto.randomUUID()}`,
          field: "priority",
          operator: "EQUALS",
          value: "high",
        },
        trueBranch: [],
        falseBranch: [],
      }
    }

    setRule({
      ...rule,
      steps: addStepToTree(rule.steps, parentId, branch, newStep),
    })
    setSelectedNodeId(newId)
  }

  return (
    <div className="flex h-full w-full bg-muted/20">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Automation Builder
              </h2>
              <p className="text-sm text-muted-foreground">
                Define the rules and logic for this automation.
              </p>
            </div>
            <Button onClick={() => onSave?.(rule)}>
              <HugeiconsIcon icon={PlayIcon} className="mr-2 h-4 w-4" />
              Save & Enable
            </Button>
          </div>

          <div className="relative flex flex-col items-center">
            {/* Trigger Node */}
            <AutomationNode
              type="TRIGGER"
              data={rule.trigger}
              isSelected={selectedNodeId === rule.trigger.id}
              onClick={() => setSelectedNodeId(rule.trigger.id)}
            />

            {/* Main Branch Line */}
            <div className="h-8 w-px bg-border" />

            {/* Steps Branch */}
            <AutomationBranch
              steps={rule.steps}
              parentId={null}
              branchName="main"
              selectedNodeId={selectedNodeId}
              onNodeClick={setSelectedNodeId}
              onAddStep={handleAddStep}
            />

            {/* End of Flow Add Button */}
            <Button
              variant="outline"
              size="icon"
              className="z-10 h-8 w-8 rounded-full border-border bg-background shadow-sm hover:border-primary hover:text-primary"
              onClick={() => handleAddStep(null, "main")}
            >
              <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Drawer */}
      <AutomationDrawer
        rule={rule}
        projectId={projectId}
        selectedNodeId={selectedNodeId}
        onClose={() => setSelectedNodeId(null)}
        onUpdateTrigger={handleUpdateTrigger}
        onUpdateStep={handleUpdateStep}
      />
    </div>
  )
}

interface AutomationBranchProps {
  steps: AutomationStep[]
  parentId: string | null
  branchName: "true" | "false" | "main"
  selectedNodeId: string | null
  onNodeClick: (id: string) => void
  onAddStep: (
    parentId: string | null,
    branch: "true" | "false" | "main",
    type: "ACTION" | "CONDITION"
  ) => void
}

function AutomationBranch({
  steps,
  selectedNodeId,
  onNodeClick,
  onAddStep,
}: AutomationBranchProps) {
  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <div className="flex w-full flex-col items-center">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="flex w-full flex-col items-center">
            {/* Action Node */}
            {step.type === "ACTION" && (
              <>
                <AutomationNode
                  type="ACTION"
                  data={step.action}
                  isSelected={selectedNodeId === step.id}
                  onClick={() => onNodeClick(step.id)}
                />
                {!isLast && <div className="h-8 w-px bg-border" />}
              </>
            )}

            {/* Condition Node */}
            {step.type === "CONDITION" && (
              <div className="flex w-full flex-col items-center">
                <AutomationNode
                  type="CONDITION"
                  data={step.condition}
                  isSelected={selectedNodeId === step.id}
                  onClick={() => onNodeClick(step.id)}
                />

                {/* Branches Container */}
                <div className="relative mt-8 flex w-full max-w-2xl justify-between">
                  {/* Top horizontal connection line */}
                  <div className="absolute top-0 right-1/4 left-1/4 h-px bg-border" />

                  {/* Vertical drops from horizontal line */}
                  <div className="absolute top-0 left-1/4 h-4 w-px bg-border" />
                  <div className="absolute top-0 right-1/4 h-4 w-px bg-border" />

                  {/* True Branch */}
                  <div className="mt-4 flex w-1/2 flex-col items-center px-4">
                    <div className="mb-4 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-2xs font-semibold text-success-foreground">
                      IF TRUE
                    </div>
                    <AutomationBranch
                      steps={step.trueBranch}
                      parentId={step.id}
                      branchName="true"
                      selectedNodeId={selectedNodeId}
                      onNodeClick={onNodeClick}
                      onAddStep={onAddStep}
                    />
                    <div className="h-8 w-px bg-border" />
                    <Button
                      variant="outline"
                      size="icon"
                      className="z-10 h-8 w-8 rounded-full border-border bg-background shadow-sm hover:border-primary hover:text-primary"
                      onClick={() => onAddStep(step.id, "true", "ACTION")}
                    >
                      <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* False Branch */}
                  <div className="mt-4 flex w-1/2 flex-col items-center px-4">
                    <div className="mb-4 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-2xs font-semibold text-destructive-foreground">
                      IF FALSE
                    </div>
                    <AutomationBranch
                      steps={step.falseBranch}
                      parentId={step.id}
                      branchName="false"
                      selectedNodeId={selectedNodeId}
                      onNodeClick={onNodeClick}
                      onAddStep={onAddStep}
                    />
                    <div className="h-8 w-px bg-border" />
                    <Button
                      variant="outline"
                      size="icon"
                      className="z-10 h-8 w-8 rounded-full border-border bg-background shadow-sm hover:border-primary hover:text-primary"
                      onClick={() => onAddStep(step.id, "false", "ACTION")}
                    >
                      <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Continuation line for actions */}
            {step.type === "ACTION" && isLast && (
              <div className="h-8 w-px bg-border" />
            )}
          </div>
        )
      })}
    </div>
  )
}
