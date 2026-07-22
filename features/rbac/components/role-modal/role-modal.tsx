"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  useCreateRole,
  useOrganizationRoles,
  usePermissions,
  useUpdateRolePermissions,
} from "../../hooks/use-rbac"
import { HelpCard } from "./help-card"
import { PermissionsPanel } from "./permissions-panel"
import { PermissionsSummary } from "./permissions-summary"

interface RoleModalProps {
  organizationId: string
  roleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleModal({
  organizationId,
  roleId,
  open,
  onOpenChange,
}: RoleModalProps) {
  const { data: permissions } = usePermissions()
  const { data } = useOrganizationRoles(organizationId)
  const rolesList = data?.pages.flatMap((page) => page.data) ?? []

  const createRole = useCreateRole(organizationId)
  const updateRole = useUpdateRolePermissions(organizationId)

  const roleToEdit = rolesList.find((r) => r.id === roleId)
  const isEditing = !!roleId
  const isSystemDefault = roleToEdit?.isSystemDefault

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    []
  )

  useEffect(() => {
    if (open) {
      if (roleToEdit) {
        setTimeout(() => {
          setName(roleToEdit.name)
          setSelectedPermissionIds(
            roleToEdit.permissions.map((p) => p.permissionId)
          )
        }, 0)
      } else {
        setTimeout(() => {
          setName("")
          setSelectedPermissionIds([])
        }, 0)
      }
    }
  }, [open, roleToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error("Role name is required.")

    try {
      if (isEditing) {
        if (!isSystemDefault) {
          await updateRole.mutateAsync({
            roleId: roleId!,
            permissionIds: selectedPermissionIds,
          })
          toast.success("Role permissions updated successfully")
        }
      } else {
        await createRole.mutateAsync({
          name,
          organizationId,
          permissionIds: selectedPermissionIds,
        })
        toast.success("Role created successfully")
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Role save error:", error)
      toast.error("Failed to save role")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-fit max-h-[90vh] w-[65vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[65vw]">
        <DialogHeader className="border-b bg-background p-6 pb-4">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {isEditing
                ? isSystemDefault
                  ? "View Role"
                  : "Edit Role"
                : "Create Custom Role"}
            </DialogTitle>
            <DialogDescription>
              {isSystemDefault
                ? "System default roles cannot be modified."
                : "Define the permissions assigned to this role."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex h-full flex-col overflow-hidden md:flex-row">
          {/* Left Column: Role Info */}
          <div className="flex w-full flex-col gap-6 overflow-y-auto border-r bg-muted/20 p-6 md:w-[360px]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Role Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isEditing}
                  placeholder="e.g. Guest Developer"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this role..."
                  className="min-h-[100px] resize-none"
                />
                <p className="text-2xs text-muted-foreground italic">
                  Note: Description is currently for UI reference and not saved
                  to the backend.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Summary
              </Label>
              <PermissionsSummary
                selectedIds={selectedPermissionIds}
                permissions={permissions || []}
              />
            </div>

            <div className="mt-auto pt-6">
              <HelpCard />
            </div>
          </div>

          {/* Right Column: Permissions Matrix */}
          <div className="flex-1 overflow-y-auto bg-background p-6">
            <form id="role-form" onSubmit={handleSubmit}>
              <PermissionsPanel
                permissions={permissions || []}
                selectedPermissionIds={selectedPermissionIds}
                onChange={(id, checked) => {
                  if (checked) {
                    setSelectedPermissionIds((prev) =>
                      prev.includes(id) ? prev : [...prev, id]
                    )
                  } else {
                    setSelectedPermissionIds((prev) =>
                      prev.filter((pid) => pid !== id)
                    )
                  }
                }}
                disabled={isSystemDefault}
              />
            </form>
          </div>
        </div>

        <DialogFooter className="border-t bg-muted/30 p-6 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isSystemDefault ? "Close" : "Cancel"}
          </Button>
          {!isSystemDefault && (
            <Button
              type="submit"
              form="role-form"
              disabled={createRole.isPending || updateRole.isPending}
              className="px-6"
            >
              {createRole.isPending || updateRole.isPending
                ? "Saving..."
                : "Save Role"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
