"use client";

import { useOrganizationRoles, useDeleteRole } from "../hooks/use-rbac";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { RoleModal } from "./role-modal/role-modal";
import { AlertTriangle } from "lucide-react";
import { Delete01Icon, Edit02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";

interface RolesTableProps {
  organizationId: string;
}

export function RolesTable({ organizationId }: RolesTableProps) {
  const { data: roles, isLoading } = useOrganizationRoles(organizationId);
  const deleteRole = useDeleteRole(organizationId);
  const { hasPermission } = usePermissions();
  
  const canCreateRole = hasPermission("role:create");
  const canUpdateRole = hasPermission("role:update");
  const canDeleteRole = hasPermission("role:delete");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  const [roleToDelete, setRoleToDelete] = useState<{ id: string, name: string } | null>(null);

  const handleDelete = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole.mutateAsync(roleToDelete.id);
      toast.success("Role deleted successfully");
      setRoleToDelete(null);
    } catch {
      toast.error("Failed to delete role");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading roles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Organization Roles</h2>
        {canCreateRole && (
          <Button 
            size="sm" 
            className="gap-2" 
            onClick={() => { setSelectedRole(null); setIsModalOpen(true); }}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
            Create Custom Role
          </Button>
        )}
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 font-medium text-muted-foreground">Role Name</TableHead>
                <TableHead className="px-4 py-3 font-medium text-muted-foreground">Permissions</TableHead>
                <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No roles found.
                  </TableCell>
                </TableRow>
              )}
              {roles?.map((role) => (
                <TableRow 
                  key={role.id} 
                  className="group transition-colors hover:bg-muted/30"
                >
                  <TableCell className="px-4 py-4 font-medium">{role.name}</TableCell>
                  <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                    {role.permissions.length > 0 
                      ? `${role.permissions.length} permissions` 
                      : "No permissions assigned"}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {(role.name.toLowerCase() === "owner" || canUpdateRole) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-all gap-1.5"
                          onClick={() => {
                            setSelectedRole(role.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <HugeiconsIcon icon={Edit02Icon} className="w-3.5 h-3.5" />
                          {role.name.toLowerCase() === "owner" || !canUpdateRole ? "View" : "Edit"}
                        </Button>
                      )}
                      {role.name.toLowerCase() !== "owner" && canDeleteRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-all gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setRoleToDelete({ id: role.id, name: role.name });
                          }}
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RoleModal 
        organizationId={organizationId} 
        roleId={selectedRole}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent className="sm:max-w-112.5">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role <strong>{roleToDelete?.name}</strong>? 
              This action cannot be undone and this role will be removed from all assigned users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteRole.isPending}
            >
              {deleteRole.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
