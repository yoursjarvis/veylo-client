"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface PermissionItemProps {
  permission: {
    id: string
    action: string
    description: string
  }
  isSelected: boolean
  onChange: (id: string, checked: boolean) => void
  disabled?: boolean
}

export function PermissionItem({
  permission,
  isSelected,
  onChange,
  disabled,
}: PermissionItemProps) {
  return (
    <div
      className={cn(
        "group flex cursor-pointer items-start space-x-3 rounded-lg p-3 transition-all",
        "focus-within:bg-muted/80 hover:bg-muted/50",
        disabled ? "pointer-events-none opacity-50" : ""
      )}
      onClick={() => onChange(permission.id, !isSelected)}
    >
      <div className="flex h-5 items-center">
        <Checkbox
          id={`perm-${permission.id}`}
          checked={isSelected}
          onCheckedChange={(checked) => onChange(permission.id, !!checked)}
          disabled={disabled}
          className="mt-0.5"
        />
      </div>
      <div className="grid flex-1 gap-0.5">
        <Label
          htmlFor={`perm-${permission.id}`}
          className="cursor-pointer text-sm leading-none font-medium capitalize transition-colors group-hover:text-primary"
        >
          {permission.action.replace(/_/g, " ")}
        </Label>
        <p className="line-clamp-2 text-2xs leading-tight text-muted-foreground">
          {permission.description ||
            `Allows the role to ${permission.action.replace(/_/g, " ")}.`}
        </p>
      </div>
    </div>
  )
}
