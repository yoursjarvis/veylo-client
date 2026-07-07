"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions as useCatalogPermissions, useOrganizationRoles, useCreateRole, useUpdateRolePermissions } from "../hooks/use-rbac";
import { usePermissions as useUserPermissions } from "@/hooks/use-permissions";
import { PermissionMatrix } from "./permission-matrix";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface RoleFormModalProps {
  organizationId: string;
  roleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleFormModal({ organizationId, roleId, open, onOpenChange }: RoleFormModalProps) {
  const { data: permissionsCatalog } = useCatalogPermissions();
  const { permissions: userPermissions } = useUserPermissions({ organizationId });
  const { data: roles } = useOrganizationRoles(organizationId);
  
  const createRole = useCreateRole(organizationId);
  const updateRole = useUpdateRolePermissions(organizationId);

  const roleToEdit = roles?.find(r => r.id === roleId);
  const isEditing = !!roleId;
  const isOwner = roleToEdit?.name.toLowerCase() === "owner";

  const [name, setName] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [bypassPermissions, setBypassPermissions] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (roleToEdit) {
          setName(roleToEdit.name);
          setSelectedPermissionIds(roleToEdit.permissions.map(p => p.permissionId));
          setBypassPermissions(roleToEdit.bypassPermissions || false);
        } else {
          setName("");
          setSelectedPermissionIds([]);
          setBypassPermissions(false);
        }
      }, 0);
    }
  }, [open, roleToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Role name is required.");

    try {
      if (isEditing) {
        if (!isOwner) {
          await updateRole.mutateAsync({ roleId: roleId!, name, permissionIds: selectedPermissionIds, bypassPermissions });
          toast.success("Role updated successfully");
        }
      } else {
        await createRole.mutateAsync({ name, organizationId, permissionIds: selectedPermissionIds, bypassPermissions });
        toast.success("Role created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Role save error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err?.response?.data?.message || "Failed to save role";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-background">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {isEditing ? (isOwner ? "View Role" : "Edit Role") : "Create Custom Role"}
            </DialogTitle>
            <DialogDescription>
              {isOwner 
                ? "The owner role cannot be modified." 
                : "Define the permissions assigned to this role."}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
          <form id="role-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Role Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isOwner}
                placeholder="e.g. Guest Developer"
                className="h-10"
              />
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Permissions</Label>
                <p className="text-xs text-muted-foreground">
                  Assign capabilities to this role across the workspace.
                </p>
              </div>
              {userPermissions.includes("*") && !isOwner && (
                <div className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="space-y-0.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Bypass All Permissions</Label>
                    <p className="text-sm text-muted-foreground">
                      Users with this role will have full access to all resources. Only the organization owner can manage this.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="bypassPermissions"
                      checked={bypassPermissions}
                      onChange={(e) => setBypassPermissions(e.target.checked)}
                      className="w-5 h-5 accent-primary"
                    />
                  </div>
                </div>
              )}
              <PermissionMatrix
                permissions={permissionsCatalog || []}
                selectedPermissionIds={selectedPermissionIds}
                onChange={setSelectedPermissionIds}
                disabled={isOwner}
              />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t bg-muted/30">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="gap-2">
            {isOwner ? "Close" : "Cancel"}
          </Button>
          {!isOwner && (
            <Button
              type="submit"
              form="role-form"
              disabled={createRole.isPending || updateRole.isPending}
              className="px-6"
            >
              {createRole.isPending || updateRole.isPending ? "Saving..." : "Save Role"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
