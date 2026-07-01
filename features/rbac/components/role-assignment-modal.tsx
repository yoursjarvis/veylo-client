"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganizationRoles, useAssignRole, useUserAssignments } from "../hooks/use-rbac";
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
  
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [scopeType, setScopeType] = useState<"ORGANIZATION" | "PROJECT" | "DEPARTMENT">("ORGANIZATION");
  const [scopeId, setScopeId] = useState<string>(organizationId);

  const { data: userAssignments, isFetching: isFetchingAssignments } = useUserAssignments(userId, scopeType, scopeId);

  useEffect(() => {
    if (userAssignments) {
      setSelectedRoleIds(userAssignments.map((a: any) => a.roleId));
    } else if (!isFetchingAssignments) {
      setSelectedRoleIds([]);
    }
  }, [userAssignments, isFetchingAssignments]);

  // Fetch projects if scope is PROJECT
  const { data: projects } = useQuery({
    queryKey: ["projects", organizationId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/organizations/${organizationId}/projects`);
      return data.data;
    },
    enabled: scopeType === "PROJECT",
  });



  const handleAssign = async () => {
    if (!scopeId) return toast.error("Please select a scope.");
    // We allow empty selectedRoleIds to mean "remove all roles in this scope"

    try {
      await assignRole({ userId, roleIds: selectedRoleIds, scopeType, scopeId } as any);
      toast.success("Roles assigned successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to assign roles");
    }
  };

  const [roleOpen, setRoleOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Roles to {userName}</DialogTitle>
          <DialogDescription>
            Specify the roles and the scope within which this user will have these permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2 flex flex-col">
            <Label>Roles</Label>
            <Popover open={roleOpen} onOpenChange={setRoleOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={roleOpen}
                    className="w-full justify-between"
                  >
                    {selectedRoleIds.length > 0
                      ? `${selectedRoleIds.length} role${selectedRoleIds.length > 1 ? 's' : ''} selected`
                      : "Select roles..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                }
              />
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search roles..." />
                  <CommandList>
                    <CommandEmpty>No roles found.</CommandEmpty>
                    <CommandGroup>
                      {roles?.map((role) => (
                        <CommandItem
                          key={role.id}
                          value={role.name}
                          onSelect={() => {
                            setSelectedRoleIds((prev) => 
                              prev.includes(role.id)
                                ? prev.filter((id) => id !== role.id)
                                : [...prev, role.id]
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRoleIds.includes(role.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {role.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 flex flex-col">
            <Label>Assignment Scope</Label>
            <Popover open={scopeOpen} onOpenChange={setScopeOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={scopeOpen}
                    className="w-full justify-between"
                  >
                    {scopeType === "ORGANIZATION" && "Organization Wide"}
                    {scopeType === "PROJECT" && "Specific Project"}
                    {scopeType === "DEPARTMENT" && "Specific Department"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                }
              />
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search scope..." />
                  <CommandList>
                    <CommandEmpty>No scope found.</CommandEmpty>
                    <CommandGroup>
                      {[
                        { value: "ORGANIZATION", label: "Organization Wide" },
                        { value: "PROJECT", label: "Specific Project" },
                        { value: "DEPARTMENT", label: "Specific Department" },
                      ].map((item) => (
                        <CommandItem
                          key={item.value}
                          value={item.label}
                          onSelect={() => {
                            setScopeType(item.value as any);
                            if (item.value === "ORGANIZATION") {
                              setScopeId(organizationId);
                            } else {
                              setScopeId("");
                            }
                            setScopeOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              scopeType === item.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {item.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {scopeType === "PROJECT" && (
            <div className="space-y-2 flex flex-col">
              <Label>Select Project</Label>
              <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={projectOpen}
                      className="w-full justify-between"
                      disabled={isPending}
                    >
                      {scopeId && projects?.length
                        ? projects.find((p: any) => p.id === scopeId)?.title || projects.find((p: any) => p.id === scopeId)?.name || "Select project..."
                        : "Select project..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  }
                />
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search project..." />
                    <CommandList>
                      <CommandEmpty>No projects found.</CommandEmpty>
                      <CommandGroup>
                        {projects?.map((project: any) => (
                          <CommandItem
                            key={project.id}
                            value={project.title || project.name}
                            onSelect={() => {
                              setScopeId(project.id);
                              setProjectOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                scopeId === project.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {project.title || project.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
