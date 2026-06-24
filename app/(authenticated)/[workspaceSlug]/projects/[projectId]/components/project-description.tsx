"use client";

import React, { useState, useEffect } from "react";
import { FileText, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectDescriptionProps {
  projectId: string;
  initialDescription?: string | null;
}

export function ProjectDescription({ projectId, initialDescription }: ProjectDescriptionProps) {
  const queryClient = useQueryClient();
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescriptionValue(initialDescription || "");
  }, [initialDescription]);

  const updateDescription = async () => {
    try {
      await axiosInstance.patch(`/projects/${projectId}`, {
        description: descriptionValue,
      });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setIsEditingDesc(false);
      toast.success("Project description updated");
    } catch {
      toast.error("Failed to update description");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-primary" /> Project Description
        </CardTitle>
        {!isEditingDesc ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingDesc(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        ) : (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              onClick={updateDescription}
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingDesc(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEditingDesc ? (
          <textarea
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            placeholder="Describe your project goals, scope, and timeline..."
            className="w-full min-h-[100px] bg-background border border-border rounded-md p-3 text-xs text-foreground focus:outline-none focus:border-primary resize-y"
          />
        ) : (
          <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap font-normal">
            {initialDescription || (
              <span className="text-muted-foreground italic">No description has been added to this project. Click edit to add one.</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
