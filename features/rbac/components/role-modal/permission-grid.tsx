"use client"

import { PermissionItem } from "./permission-item"

interface PermissionGridProps {
  permissions: { id: string; action: string; description: string }[]
  selectedPermissionIds: string[]
  onChange: (id: string, checked: boolean) => void
  disabled?: boolean
}

export function PermissionGrid({
  permissions,
  selectedPermissionIds,
  onChange,
  disabled,
}: PermissionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {permissions.map((p) => (
        <PermissionItem
          key={p.id}
          permission={p}
          isSelected={selectedPermissionIds.includes(p.id)}
          onChange={onChange}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
