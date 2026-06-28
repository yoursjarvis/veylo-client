"use client";

import { Permission } from "../services/rbac.service";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";

interface PermissionMatrixProps {
  permissions: Permission[];
  selectedPermissionIds: string[];
  onChange: (permissionIds: string[]) => void;
  disabled?: boolean;
}

export function PermissionMatrix({ permissions, selectedPermissionIds, onChange, disabled = false }: PermissionMatrixProps) {
  // Group by Module -> Resource
  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, Record<string, Permission[]>> = {};
    
    permissions.forEach(p => {
      if (!p.module || !p.resource) return;
      if (!grouped[p.module]) {
        grouped[p.module] = {};
      }
      if (!grouped[p.module][p.resource]) {
        grouped[p.module][p.resource] = [];
      }
      grouped[p.module][p.resource].push(p);
    });

    return grouped;
  }, [permissions]);

  const togglePermission = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedPermissionIds, id]);
    } else {
      onChange(selectedPermissionIds.filter(pid => pid !== id));
    }
  };

  const toggleResource = (resourcePermissions: Permission[], checked: boolean) => {
    const ids = resourcePermissions.map(p => p.id);
    if (checked) {
      const newSelection = new Set([...selectedPermissionIds, ...ids]);
      onChange(Array.from(newSelection));
    } else {
      onChange(selectedPermissionIds.filter(id => !ids.includes(id)));
    }
  };

  if (permissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg border-dashed">
        <p className="text-sm text-muted-foreground">No permissions available to assign.</p>
      </div>
    );
  }

  const modules = Object.keys(groupedPermissions);

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg border-dashed">
        <p className="text-sm text-muted-foreground">No categorized permissions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion 
        type="multiple" 
        defaultValue={modules} 
        className="w-full space-y-4"
      >
        {Object.entries(groupedPermissions).map(([moduleName, resources]) => (
          <AccordionItem 
            key={moduleName} 
            value={moduleName} 
            className="border-l-2 border-transparent hover:border-primary/50 transition-colors pl-4"
          >
            <AccordionTrigger className="py-3 hover:no-underline text-left font-semibold capitalize">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                {moduleName.replace(/_/g, " ")}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-6">
              {Object.entries(resources).map(([resourceName, resourcePermissions]) => {
                const allSelected = resourcePermissions.every(p => selectedPermissionIds.includes(p.id));

                return (
                  <div key={resourceName} className="space-y-3">
                    <div className="flex items-center space-x-2 group">
                      <Checkbox 
                        id={`res-${resourceName}`}
                        checked={allSelected}
                        onCheckedChange={(checked) => toggleResource(resourcePermissions, !!checked)}
                        disabled={disabled}
                      />
                      <Label 
                        htmlFor={`res-${resourceName}`} 
                        className="text-sm font-semibold capitalize cursor-pointer group-hover:text-primary transition-colors"
                      >
                        {resourceName.replace(/_/g, " ")}
                      </Label>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 pl-6">
                      {resourcePermissions.map((p) => (
                        <div key={p.id} className="flex items-start space-x-3 group/perm">
                          <Checkbox 
                            id={`perm-${p.id}`}
                            checked={selectedPermissionIds.includes(p.id)}
                            onCheckedChange={(checked) => togglePermission(p.id, !!checked)}
                            disabled={disabled}
                            className="mt-1"
                          />
                          <div className="grid gap-0.5">
                            <Label 
                              htmlFor={`perm-${p.id}`} 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize group-hover/perm:text-primary transition-colors"
                            >
                              {p.action.replace(/_/g, " ")}
                            </Label>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              {p.description || `Allows the role to ${p.action.replace(/_/g, " ")} ${p.resource.replace(/_/g, " ")}.`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
