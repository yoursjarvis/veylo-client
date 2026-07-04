"use client"

import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { PermissionGrid } from "./permission-grid"

interface PermissionCategoryProps {
  name: string
  description: string
  permissions: { id: string; action: string; description: string }[]
  selectedPermissionIds: string[]
  onChange: (id: string, checked: boolean) => void
  disabled?: boolean
}

export function PermissionCategory({
  name,
  description,
  permissions,
  selectedPermissionIds,
  onChange,
  disabled,
}: PermissionCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const allSelected =
    permissions.length > 0 &&
    permissions.every((p) => selectedPermissionIds.includes(p.id))


  const toggleAll = (checked: boolean) => {
    if (checked) {
      permissions.forEach((p) => onChange(p.id, true))
    } else {
      permissions.forEach((p) => onChange(p.id, false))
    }
  }

  return (
    <Card
      className={cn(
        "group ml-1 overflow-hidden rounded-xl border-border/50 transition-all duration-200 hover:border-primary/30",
        isExpanded ? "ring-1 ring-primary/20" : ""
      )}
    >
      <div
        className="flex cursor-pointer items-center justify-between gap-4 p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Checkbox
            id={`cat-${name}`}
            checked={allSelected}
            onCheckedChange={(checked) => toggleAll(!!checked)}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()} // Prevent expansion when clicking checkbox
          />
          <div className="flex flex-col">
            <Label
              htmlFor={`cat-${name}`}
              className="cursor-pointer font-semibold capitalize"
            >
              {name.replace(/_/g, " ")}
            </Label>
            <span className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {permissions.length} permissions
          </span>
          <div className="rounded-md p-1 transition-colors hover:bg-muted">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/50 bg-muted/10 px-4 pt-2 pb-6">
          <PermissionGrid
            permissions={permissions}
            selectedPermissionIds={selectedPermissionIds}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      )}
    </Card>
  )
}
