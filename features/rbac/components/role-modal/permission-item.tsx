"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PermissionItemProps {
  permission: {
    id: string;
    action: string;
    description: string;
  };
  isSelected: boolean;
  onChange: (id: string, checked: boolean) => void;
  disabled?: boolean;
}

export function PermissionItem({ permission, isSelected, onChange, disabled }: PermissionItemProps) {
  return (
    <div 
      className={cn(
        "group flex items-start space-x-3 p-3 rounded-lg transition-all cursor-pointer",
        "hover:bg-muted/50 focus-within:bg-muted/80",
        disabled ? "opacity-50 pointer-events-none" : ""
      )}
      onClick={() => onChange(permission.id, !isSelected)}
    >
      <div className="flex items-center h-5">
        <Checkbox 
          id={`perm-${permission.id}`}
          checked={isSelected}
          onCheckedChange={(checked) => onChange(permission.id, !!checked)}
          disabled={disabled}
          className="mt-0.5"
        />
      </div>
      <div className="grid gap-0.5 flex-1">
        <Label 
          htmlFor={`perm-${permission.id}`} 
          className="text-sm font-medium leading-none capitalize cursor-pointer group-hover:text-primary transition-colors"
        >
          {permission.action.replace(/_/g, " ")}
        </Label>
        <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
          {permission.description || `Allows the role to ${permission.action.replace(/_/g, " ")}.`}
        </p>
      </div>
    </div>
  );
}
