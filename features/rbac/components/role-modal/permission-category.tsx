"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PermissionGrid } from "./permission-grid";

interface PermissionCategoryProps {
  name: string;
  description: string;
  permissions: any[];
  selectedPermissionIds: string[];
  onChange: (id: string, checked: boolean) => void;
  disabled?: boolean;
}

export function PermissionCategory({ name, description, permissions, selectedPermissionIds, onChange, disabled }: PermissionCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const allSelected = permissions.length > 0 && permissions.every(p => selectedPermissionIds.includes(p.id));
  const someSelected = permissions.some(p => selectedPermissionIds.includes(p.id)) && !allSelected;

  const toggleAll = (checked: boolean) => {
    if (checked) {
      permissions.forEach(p => onChange(p.id, true));
    } else {
      permissions.forEach(p => onChange(p.id, false));
    }
  };

  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-200 border-border/50 hover:border-primary/30 rounded-xl",
      isExpanded ? "ring-1 ring-primary/20" : ""
    )}>
      <div className="p-4 flex items-center justify-between gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-3">
          <Checkbox 
            id={`cat-${name}`}
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(checked) => toggleAll(!!checked)}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()} // Prevent expansion when clicking checkbox
          />
          <div className="flex flex-col">
            <Label htmlFor={`cat-${name}`} className="font-semibold capitalize cursor-pointer">
              {name.replace(/_/g, " ")}
            </Label>
            <span className="text-[11px] text-muted-foreground line-clamp-1">{description}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {permissions.length} permissions
          </span>
          <div className="p-1 rounded-md hover:bg-muted transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-6 pt-2 border-t border-border/50 bg-muted/10">
          <PermissionGrid 
            permissions={permissions} 
            selectedPermissionIds={selectedPermissionIds} 
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      )}
    </Card>
  );
}
