"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import { AutomationBuilder } from "@/features/automations/components/automation-builder"
import { AutomationRule } from "@/features/automations/types/automation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Plus, Archive, Trash2, Edit2 } from "lucide-react"

export default function AutomationsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [isBuilding, setIsBuilding] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [automations, setAutomations] = useState<AutomationRule[]>([])

  if (isBuilding || editingRule) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
        <div className="flex items-center gap-4 border-b border-border bg-card p-4">
          <Button variant="ghost" onClick={() => { setIsBuilding(false)
              setEditingRule(null); setEditingRule(null); }}>
            Back to Automations
          </Button>
          <div className="flex-1 text-center font-bold">New Automation</div>
        </div>
        <div className="flex-1 overflow-hidden">
          <AutomationBuilder 
            projectId={projectId}
            initialRule={editingRule || undefined}
            onSave={(rule) => {
              if (editingRule) {
                setAutomations(automations.map(r => r.id === rule.id ? rule : r))
              } else {
                setAutomations([...automations, rule])
              }
              setIsBuilding(false)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Automations</h2>
          <p className="text-sm text-muted-foreground">
            Create automated workflows to save time and enforce processes.
          </p>
        </div>
        <Button onClick={() => setIsBuilding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {automations.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold">No Automations Found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            You haven&apos;t created any automations yet. Click the button above to build your first no-code workflow.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {automations
            .filter((r) => !r.isDeleted)
            .map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:border-foreground/30"
            >
              <div>
                <h4 className="font-semibold">{rule.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Trigger: {rule.trigger.type.replace("_", " ")} | Steps: {rule.steps.length}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${rule.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>
                  <Switch 
                    checked={rule.isActive} 
                    onCheckedChange={() => {
                      setAutomations(
                        automations.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r)
                      )
                    }} 
                  />
                </div>
                <div className="flex items-center gap-2 border-l border-border pl-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setAutomations(
                        automations.map(r => r.id === rule.id ? { ...r, isDeleted: true } : r)
                      )
                    }}
                  >
                    </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => {
                      setEditingRule(rule)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setAutomations(
                        automations.map(r => r.id === rule.id ? { ...r, isDeleted: true } : r)
                      )
                    }}
                  >
                    <Archive className="mr-1 h-3.5 w-3.5" />
                    Archive
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                    onClick={() => {
                      setAutomations(automations.filter((r) => r.id !== rule.id))
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
