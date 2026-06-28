"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions, useOrganizationRoles, useCreateRole, useUpdateRolePermissions } from "../../hooks/use-rbac";
import { PermissionsPanel } from "./permissions-panel";
import { PermissionsSummary } from "./permissions-summary";
import { HelpCard } from "./help-card";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface RoleModalProps {
  organizationId: string;
  roleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleModal({ organizationId, roleId, open, onOpenChange }: RoleModalProps) {
  const { data: permissions } = usePermissions();
  const { data: roles } = useOrganizationRoles(organizationId);
  
  const createRole = useCreateRole(organizationId);
  const updateRole = useUpdateRolePermissions(organizationId);

  const roleToEdit = roles?.find(r => r.id === roleId);
  const isEditing = !!roleId;
  const isSystemDefault = roleToEdit?.isSystemDefault;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (roleToEdit) {
        setName(roleToEdit.name);
        setSelectedPermissionIds(roleToEdit.permissions.map(p => p.permissionId));
      } else {
        setName("");
        setSelectedPermissionIds([]);
      }
    }
  }, [open, roleToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Role name is required.");

    try {
      if (isEditing) {
        if (!isSystemDefault) {
          await updateRole.mutateAsync({ roleId: roleId!, permissionIds: selectedPermissionIds });
          toast.success("Role permissions updated successfully");
        }
      } else {
        await createRole.mutateAsync({ name, organizationId, permissionIds: selectedPermissionIds });
        toast.success("Role created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Role save error:", error);
      toast.error("Failed to save role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[65vw] w-[65vw] h-fit max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b bg-background">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {isEditing ? (isSystemDefault ? "View Role" : "Edit Role") : "Create Custom Role"}
            </DialogTitle>
            <DialogDescription>
              {isSystemDefault 
                ? "System default roles cannot be modified." 
                : "Define the permissions assigned to this role."}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Left Column: Role Info */}
          <div className="w-full md:w-[360px] p-6 border-r bg-muted/20 flex flex-col gap-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Role Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  disabled={isEditing} 
                  placeholder="e.g. Guest Developer"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this role..."
                  className="min-h-[100px] resize-none"
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Note: Description is currently for UI reference and not saved to the backend.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</Label>
              <PermissionsSummary selectedIds={selectedPermissionIds} permissions={permissions || []} />
            </div>

            <div className="mt-auto pt-6">
              <HelpCard />
            </div>
          </div>

          {/* Right Column: Permissions Matrix */}
          <div className="flex-1 p-6 overflow-y-auto bg-background">
            <form id="role-form" onSubmit={handleSubmit}>
              <PermissionsPanel 
                permissions={permissions || []}
                selectedPermissionIds={selectedPermissionIds}
                onChange={(id, checked) => {
                  if (checked) {
                    setSelectedPermissionIds(prev => [...prev, id]);
                  } else {
                    setSelectedPermissionIds(prev => prev.filter(pid => pid !== id));
                  }
                }}
                disabled={isSystemDefault}
              />
            </form>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t bg-muted/30">
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
              {createRole.isPending || updateRole.isPending ? "Saving..." : "Save Role"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
