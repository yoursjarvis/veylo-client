"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface ProjectStatusPickerProps {
  projectId: string;
}

export function ProjectStatusPicker({ projectId }: ProjectStatusPickerProps) {
  const [projectStatus, setProjectStatus] = useState<string>("on_track");

  useEffect(() => {
    if (projectId) {
      const savedStatus = localStorage.getItem(`veylo-project-status-${projectId}`);
      if (savedStatus) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProjectStatus(savedStatus);
      }
    }
  }, [projectId]);

  const handleUpdateStatus = (status: string) => {
    localStorage.setItem(`veylo-project-status-${projectId}`, status);
    setProjectStatus(status);
    window.dispatchEvent(new Event("project-status-updated"));
    toast.success(`Project status set to: ${status.replace("_", " ")}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <CheckCircle className="h-4.5 w-4.5 text-primary" /> What&apos;s the status?
        </CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground">
          Set the status of the project lifecycle to inform stakeholders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2.5">
          {[
            { key: "on_track", name: "On Track", dot: "bg-emerald-500" },
            { key: "at_risk", name: "At Risk", dot: "bg-amber-500" },
            { key: "off_track", name: "Off Track", dot: "bg-red-500" },
          ].map((status) => {
            const isActive = projectStatus === status.key;
            return (
              <button
                key={status.key}
                type="button"
                onClick={() => handleUpdateStatus(status.key)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-muted border-border text-foreground shadow-sm"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} />
                <span>{status.name}</span>
                {isActive && (
                  <span className="ml-auto text-[9px] bg-primary text-primary-foreground px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
