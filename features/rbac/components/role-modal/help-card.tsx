"use client";

import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

export function HelpCard() {
  return (
    <Card className="p-4 space-y-2 bg-primary/5 border-primary/10">
      <div className="flex items-center gap-2 text-primary">
        <Info className="w-4 h-4" />
        <span className="text-sm font-semibold">Need help?</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Roles let you group permissions so access can be assigned consistently across your workspace.
        Custom roles allow you to define precise access levels for different team members.
      </p>
    </Card>
  );
}
