"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PermissionCategory } from "./permission-category"
import { Search, Maximize2, Minimize2, CheckSquare, Square } from "lucide-react"

interface PermissionsPanelProps {
  permissions: {
    id: string
    module: string
    resource: string
    action: string
    description: string
  }[]
  selectedPermissionIds: string[]
  onChange: (id: string, checked: boolean) => void
  disabled?: boolean
}

export function PermissionsPanel({
  permissions,
  selectedPermissionIds,
  onChange,
  disabled,
}: PermissionsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({})

  const handleToggleExpand = (moduleName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }))
  }

  const groupedPermissions = useMemo(() => {
    const grouped: Record<
      string,
      {
        description: string
        permissions: {
          id: string
          module: string
          resource: string
          action: string
          description: string
        }[]
      }
    > = {}

    permissions.forEach((p) => {
      if (!grouped[p.module]) {
        grouped[p.module] = {
          description: `Manage ${p.resource} access and operations.`,
          permissions: [],
        }
      }
      grouped[p.module].permissions.push(p)
    })

    return grouped
  }, [permissions])

  const filteredModules = Object.entries(groupedPermissions).filter(
    ([moduleName, data]) => {
      const matchesModule = moduleName
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesPerm = data.permissions.some(
        (p) =>
          p.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return matchesModule || matchesPerm
    }
  )

  const toggleAllCategories = (expand: boolean) => {
    const newExpanded: Record<string, boolean> = {}
    Object.keys(groupedPermissions).forEach((key) => {
      newExpanded[key] = expand
    })
    setExpandedCategories(newExpanded)
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-bold tracking-tight">
            Permissions
          </Label>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 gap-1.5 text-xs"
              onClick={() => toggleAllCategories(true)}
            >
              <Maximize2 className="h-3 w-3" /> Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 gap-1.5 text-xs"
              onClick={() => toggleAllCategories(false)}
            >
              <Minimize2 className="h-3 w-3" /> Collapse All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 gap-1.5 text-xs"
              disabled={disabled}
              onClick={() => {
                permissions.forEach((p) => onChange(p.id, true))
              }}
            >
              <CheckSquare className="h-3 w-3" /> Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 gap-1.5 text-xs"
              disabled={disabled}
              onClick={() => {
                permissions.forEach((p) => onChange(p.id, false))
              }}
            >
              <Square className="h-3 w-3" /> Deselect All
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose the permissions this role should have across the workspace.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search permissions..."
          className="h-10 pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4 overflow-y-auto pr-2">
        {filteredModules.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            No permissions match your search.
          </div>
        ) : (
          filteredModules.map(([moduleName, data]) => (
            <PermissionCategory
              key={moduleName}
              name={moduleName}
              description={data.description}
              permissions={data.permissions}
              selectedPermissionIds={selectedPermissionIds}
              onChange={onChange}
              disabled={disabled}
              isExpanded={!!expandedCategories[moduleName]}
              onToggleExpand={() => handleToggleExpand(moduleName)}
            />
          ))
        )}
      </div>
    </div>
  )
}
