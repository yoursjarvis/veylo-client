"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface PermissionsSummaryProps {
  selectedIds: string[]
  permissions: any[]
}

export function PermissionsSummary({
  selectedIds,
  permissions,
}: PermissionsSummaryProps) {
  const totalSelected = selectedIds.length

  const modulesAffected = new Set(
    selectedIds
      .map((id) => permissions.find((p) => p.id === id)?.module)
      .filter(Boolean)
  ).size

  const categoriesEnabled = new Set(
    selectedIds
      .map((id) => permissions.find((p) => p.id === id)?.resource)
      .filter(Boolean)
  ).size

  return (
    <Card className="space-y-4 border-border/50 bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Total Permissions
        </span>
        <Badge variant="secondary" className="text-xs font-bold">
          {totalSelected}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Modules Affected
        </span>
        <Badge variant="secondary" className="text-xs font-bold">
          {modulesAffected}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Resources Configured
        </span>
        <Badge variant="secondary" className="text-xs font-bold">
          {categoriesEnabled}
        </Badge>
      </div>
    </Card>
  )
}
