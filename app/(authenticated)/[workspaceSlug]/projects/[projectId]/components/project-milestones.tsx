"use client";

import React, { useState, useEffect } from "react";
import { Flag, Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import {
  useProjectMilestones,
  useCreateMilestone,
  useDeleteMilestone,
} from "@/features/tasks/hooks/use-tasks";

interface ProjectMilestonesProps {
  projectId: string;
}

export function ProjectMilestones({ projectId }: ProjectMilestonesProps) {
  const { data: milestones, isLoading: isMilestonesLoading } = useProjectMilestones(projectId);
  const createMilestoneMutation = useCreateMilestone(projectId);
  const deleteMilestoneMutation = useDeleteMilestone(projectId);

  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [milestoneValidationErrors, setMilestoneValidationErrors] = useState<Record<string, string>>({});

  const milestoneForm = useForm({
    defaultValues: {
      title: "",
      dueDate: null as Date | null,
    },
    onSubmit: async ({ value }) => {
      setMilestoneValidationErrors({});
      createMilestoneMutation.mutate(
        {
          title: value.title.trim(),
          dueDate: value.dueDate ? value.dueDate.toISOString() : undefined,
        },
        {
          onSuccess: () => {
            milestoneForm.reset();
            setIsAddingMilestone(false);
          },
          onError: (error: unknown) => {
            const err = error as { response?: { data?: { details?: Array<{ field: string; message: string }>; message?: string } } };
            const errorDetails = err.response?.data?.details;
            if (Array.isArray(errorDetails)) {
              const errors: Record<string, string> = {};
              errorDetails.forEach((d) => {
                errors[d.field] = d.message;
              });
              setMilestoneValidationErrors(errors);
            } else {
              toast.error(err.response?.data?.message || "Failed to create milestone");
            }
          },
        }
      );
    },
  });

  useEffect(() => {
    if (isAddingMilestone) {
      milestoneForm.reset();
    }
  }, [isAddingMilestone, milestoneForm]);

  const handleDeleteMilestone = (id: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      deleteMilestoneMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Flag className="h-4.5 w-4.5 text-primary" /> Key Milestones
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Track critical check points and release markers on your roadmap.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsAddingMilestone(!isAddingMilestone);
            setMilestoneValidationErrors({});
          }}
          className="h-8 text-[10px] uppercase font-bold"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Milestone
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingMilestone && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              milestoneForm.handleSubmit();
            }}
            className="bg-muted/30 border border-border p-4 rounded-xl space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <milestoneForm.Field
                name="title"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return "Milestone title is required";
                    return undefined;
                  },
                }}
              >
                {(field) => {
                  const fieldErrors: string[] = [];
                  field.state.meta.errors.forEach((err) => {
                    if (err) fieldErrors.push(String(err));
                  });
                  if (milestoneValidationErrors.title) fieldErrors.push(milestoneValidationErrors.title);
                  const hasError = field.state.meta.isTouched && !!fieldErrors.length;
                  return (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Milestone Title</Label>
                      <Input
                        placeholder="e.g. Beta Release 1.0"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          setMilestoneValidationErrors((prev) => ({ ...prev, title: "" }));
                        }}
                        aria-invalid={hasError}
                        className="w-full bg-background border border-border rounded px-3 py-1.5 h-9 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      />
                      {hasError && (
                        <p className="text-[11px] text-rose-500 font-medium mt-1">
                          {fieldErrors.join(", ")}
                        </p>
                      )}
                    </div>
                  );
                }}
              </milestoneForm.Field>

              <milestoneForm.Field
                name="dueDate"
                validators={{
                  onChange: ({ value }) => {
                    if (value && isBefore(startOfDay(value), startOfDay(new Date()))) {
                      return "Target date cannot be in the past";
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => {
                  const fieldErrors: string[] = [];
                  field.state.meta.errors.forEach((err) => {
                    if (err) fieldErrors.push(String(err));
                  });
                  if (milestoneValidationErrors.dueDate) fieldErrors.push(milestoneValidationErrors.dueDate);
                  const hasError = field.state.meta.isTouched && !!fieldErrors.length;
                  return (
                    <div className="space-y-1 flex flex-col justify-end">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Target Date</Label>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="outline"
                              aria-invalid={hasError}
                              className={cn(
                                "w-full justify-start text-left font-normal h-9 text-xs border border-input bg-transparent px-2.5 py-1 rounded-lg focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                                !field.state.value && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {field.state.value ? format(field.state.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          }
                        />
                        <PopoverContent className="w-auto p-0" align="start">
                          <ShadcnCalendar
                            mode="single"
                            selected={field.state.value ?? undefined}
                            onSelect={(date) => {
                              field.handleChange(date ?? null);
                              setMilestoneValidationErrors((prev) => ({ ...prev, dueDate: "" }));
                            }}
                            disabled={{ before: startOfDay(new Date()) }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {hasError && (
                        <p className="text-[11px] text-rose-500 font-medium mt-1">
                          {fieldErrors.join(", ")}
                        </p>
                      )}
                    </div>
                  );
                }}
              </milestoneForm.Field>
            </div>
            <div className="flex gap-1.5 justify-end">
              <Button type="submit" size="sm" className="text-xs px-3 h-8">
                Create Milestone
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingMilestone(false)} className="text-xs px-3 h-8">
                Cancel
              </Button>
            </div>
          </form>
        )}

        {isMilestonesLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {(milestones || []).map((milestone: { id: string; title: string; dueDate?: string | null }) => (
              <div key={milestone.id} className="group flex items-center justify-between border p-3 rounded-xl hover:bg-muted/40 transition-all bg-card">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <Flag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{milestone.title}</p>
                    {milestone.dueDate && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" /> Target Date: {format(new Date(milestone.dueDate), "MMMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMilestone(milestone.id)}
                  className="text-muted-foreground hover:text-destructive p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(milestones || []).length === 0 && (
              <div className="text-center py-8 border border-dashed border-border rounded-xl bg-muted/10">
                <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs font-medium text-muted-foreground">No milestones set</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Set milestones to mark key phases of your project.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
