"use client"

import { Permission } from "../services/rbac.service"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface PermissionMatrixProps {
  permissions: Permission[]
  selectedPermissionIds: string[]
  onChange: (permissionIds: string[]) => void
  disabled?: boolean
}

export function PermissionMatrix({
  permissions,
  selectedPermissionIds,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, Record<string, Permission[]>> = {}

    permissions.forEach((p) => {
      if (!p.module || !p.resource) return
      if (!grouped[p.module]) {
        grouped[p.module] = {}
      }
      if (!grouped[p.module][p.resource]) {
        grouped[p.module][p.resource] = []
      }
      grouped[p.module][p.resource].push(p)
    })

    return grouped
  }, [permissions])

  const togglePermission = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedPermissionIds, id])
    } else {
      onChange(selectedPermissionIds.filter((pid) => pid !== id))
    }
  }

  if (permissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No permissions available to assign.
        </p>
      </div>
    )
  }

  const modules = Object.keys(groupedPermissions)

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No categorized permissions found.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedPermissions).map(([moduleName, resources]) => (
        <ModuleRow
          key={moduleName}
          moduleName={moduleName}
          resources={resources}
          selectedPermissionIds={selectedPermissionIds}
          togglePermission={togglePermission}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

function ModuleRow({
  moduleName,
  resources,
  selectedPermissionIds,
  togglePermission,
  disabled,
}: {
  moduleName: string
  resources: Record<string, Permission[]>
  selectedPermissionIds: string[]
  togglePermission: (id: string, checked: boolean) => void
  disabled: boolean
}) {
  const allActions = useMemo(() => {
    const actions = new Set<string>()
    Object.values(resources).forEach((resPerms) => {
      resPerms.forEach((p) => actions.add(p.action))
    })
    return Array.from(actions).sort()
  }, [resources])

  return (
    <div className="space-y-3">
      <div className="px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {moduleName.replace(/_/g, " ")}
      </div>

      <div className="overflow-hidden rounded-md border border-border/50 bg-background/50">
        <div
          className="grid grid-cols-1"
          style={{
            gridTemplateColumns: `minmax(200px, 1fr) repeat(${allActions.length}, minmax(100px, 1fr))`,
          }}
        >
          {/* Header */}
          <div className="flex items-center border-b border-border/50 bg-muted/30 px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Resource
          </div>
          {allActions.map((action) => (
            <div
              key={action}
              className="flex items-center justify-center border-b border-l border-border/50 bg-muted/30 px-3 py-2 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {action.replace(/_/g, " ")}
            </div>
          ))}

          {/* Rows */}
          {Object.entries(resources).map(
            ([resourceName, resourcePermissions]) => (
              <div key={resourceName} className="contents">
                <div className="flex items-center border-b border-border/50 bg-background px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {resourceName.replace(/_/g, " ")}
                </div>
                {allActions.map((action) => {
                  const permission = resourcePermissions.find(
                    (p) => p.action === action
                  )
                  const isSelected =
                    permission && selectedPermissionIds.includes(permission.id)

                  return (
                    <div
                      key={action}
                      className="group flex items-center justify-center border-b border-l border-border/50 bg-background px-3 py-2 transition-colors hover:bg-muted/20"
                    >
                      {permission ? (
                        <button
                          onClick={() =>
                            togglePermission(permission.id, !isSelected)
                          }
                          disabled={disabled}
                          className="relative flex h-4 w-4 items-center justify-center transition-all"
                        >
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-all",
                              isSelected
                                ? "scale-100 bg-primary shadow-primary/60"
                                : "scale-75 bg-muted-foreground/30"
                            )}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 animate-pulse rounded-full border border-primary/30" />
                          )}
                        </button>
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-muted/20" />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
