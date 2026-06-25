"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, AlertOctagon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";

interface ProjectStatusPickerProps {
  projectId: string;
}

const statusOptions = [
  { key: "on_track", name: "On Track" },
  { key: "at_risk", name: "At Risk" },
  { key: "off_track", name: "Off Track" },
];

export function ProjectStatusPicker({ projectId }: ProjectStatusPickerProps) {
  const [projectStatus, setProjectStatus] = useState<string>("on_track");

  useEffect(() => {
    if (projectId) {
      const savedStatus = localStorage.getItem(`veylo-project-status-${projectId}`);
      if (savedStatus) {
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

  const getStatusDisplay = () => {
    switch (projectStatus) {
      case "at_risk":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-warning" />,
          label: "At Risk",
          text: "The project has some blocker issues and requires attention.",
          bgClass: "bg-warning/10 border-warning/20 text-warning",
        };
      case "off_track":
        return {
          icon: <AlertOctagon className="h-5 w-5 text-destructive" />,
          label: "Off Track",
          text: "Critical objectives are delayed or blocked. Action needed.",
          bgClass: "bg-destructive/10 border-destructive/20 text-destructive",
        };
      case "on_track":
      default:
        return {
          icon: <CheckCircle className="h-5 w-5 text-success" />,
          label: "On Track",
          text: "All deliverables and milestones are progressing normally.",
          bgClass: "bg-success/10 border-success/20 text-success",
        };
    }
  };

  const current = getStatusDisplay();

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" /> What&apos;s the status?
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Set the status of the project lifecycle to inform stakeholders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Combobox
            value={projectStatus}
            onValueChange={(val) => {
              if (val) handleUpdateStatus(val);
            }}
          >
            <ComboboxInput
              placeholder="Select project status..."
              className="w-full bg-background border border-border"
              showTrigger
            />
            <ComboboxContent className="bg-popover border border-border">
              <ComboboxList>
                {statusOptions.map((status) => (
                  <ComboboxItem key={status.key} value={status.key}>
                    {status.name}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className={`flex items-start gap-3 p-4 rounded-xl border ${current.bgClass}`}>
          <div className="mt-0.5 shrink-0">{current.icon}</div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider leading-none">
              {current.label}
            </h4>
            <p className="text-xs leading-relaxed opacity-90">
              {current.text}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

