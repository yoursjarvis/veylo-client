"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizationRoles, useAssignRole } from "../hooks/use-rbac";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

interface RoleAssignmentModalProps {
  userId: string;
  userName: string;
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleAssignmentModal({ userId, userName, organizationId, open, onOpenChange }: RoleAssignmentModalProps) {
  const { data: roles } = useOrganizationRoles(organizationId);
  const { mutateAsync: assignRole, isPending } = useAssignRole();
  
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [scopeType, setScopeType] = useState<"ORGANIZATION" | "PROJECT" | "DEPARTMENT">("ORGANIZATION");
  const [scopeId, setScopeId] = useState<string>(organizationId);

  // Fetch projects if scope is PROJECT
  const { data: projects } = useQuery({
    queryKey: ["projects", organizationId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/organizations/${organizationId}/projects`);
      return data.data;
    },
    enabled: scopeType === "PROJECT",
  });

  useEffect(() => {
    if (scopeType === "ORGANIZATION") {
      setScopeId(organizationId);
    } else if (scopeType === "PROJECT" && projects?.length) {
      setScopeId(projects[0].id);
    }
  }, [scopeType, organizationId, projects]);

  const handleAssign = async () => {
    if (!selectedRoleId) return toast.error("Please select a role.");
    if (!scopeId) return toast.error("Please select a scope.");

    try {
      await assignRole({ userId, roleId: selectedRoleId, scopeType, scopeId });
      toast.success("Role assigned successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to assign role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Role to {userName}</DialogTitle>
          <DialogDescription>
            Specify the role and the scope within which this user will have these permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRoleId} onValueChange={(val) => setSelectedRoleId(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name} {role.isSystemDefault ? "(System)" : "(Custom)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assignment Scope</Label>
            <Select value={scopeType} onValueChange={(val: any) => setScopeType(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORGANIZATION">Organization Wide</SelectItem>
                <SelectItem value="PROJECT">Specific Project</SelectItem>
                <SelectItem value="DEPARTMENT">Specific Department</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scopeType === "PROJECT" && (
            <div className="space-y-2">
              <Label>Select Project</Label>
              <Select value={scopeId} onValueChange={(val) => setScopeId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={isPending}>
            {isPending ? "Assigning..." : "Assign Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
