"use client"
import { Label } from "@/types/models";


import React, { useState } from "react"
import { useProject } from "../../layout"
import {
  useProjectLabels,
  useCreateLabel,
  useDeleteLabel,
} from "@/features/tasks/hooks/use-tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Tag, Trash, Plus } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const COLOR_PRESETS = [
  { name: "Slate", hex: "#64748b" },
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
]

export default function LabelsSettingsPage() {
  const { projectId, isWorkspaceAdmin } = useProject()

  const [labelValidationErrors, setLabelValidationErrors] = useState<Record<string, string>>({})

  const { data: labels, isLoading: isLabelsLoading } = useProjectLabels(projectId)
  const createLabelMutation = useCreateLabel(projectId)
  const deleteLabelMutation = useDeleteLabel(projectId)

  const form = useForm({
    defaultValues: {
      name: "",
      color: "#3b82f6",
    },
    onSubmit: async ({ value }) => {
      setLabelValidationErrors({});
      if (!value.name.trim()) return;

      createLabelMutation.mutate(
        {
          name: value.name.trim(),
          color: value.color,
        },
        {
          onSuccess: () => {
            form.reset();
          },
          onError: (error: unknown) => {
            const err = error as { response?: { data?: { details?: Array<{ field: string; message: string }>; message?: string } } };
            const errorDetails = err.response?.data?.details;
            if (Array.isArray(errorDetails)) {
              const errors: Record<string, string> = {};
              errorDetails.forEach((d) => {
                errors[d.field] = d.message;
              });
              setLabelValidationErrors(errors);
            } else {
              toast.error(err.response?.data?.message || "Failed to create label");
            }
          },
        }
      );
    },
  })

  if (!isWorkspaceAdmin) {
    return (
      <div className="p-8 text-center">
        You do not have administrative permissions to view settings.
      </div>
    )
  }

  const handleDeleteLabel = (labelId: string) => {
    if (confirm("Are you sure you want to delete this label? Tasks using it will no longer show this label.")) {
      deleteLabelMutation.mutate(labelId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Tag className="h-5 w-5" /> Project Labels
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create, edit, or delete categorization tags/labels to organize tasks within this project.
        </p>
      </div>

      {isLabelsLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* List of Labels */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Active Labels
              </CardTitle>
              <CardDescription className="text-xs">
                Labels currently available for tasks in this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!labels || labels.length === 0 ? (
                <div className="py-6 text-center text-xs italic text-muted-foreground">
                  No labels defined for this project.
                </div>
              ) : (
                <div className="space-y-3">
                  {labels.map((lbl: Label) => (
                    <div
                      key={lbl.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/10"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: lbl.color }}
                        >
                          {lbl.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {lbl.color}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteLabel(lbl.id)}
                        disabled={deleteLabelMutation.isPending}
                        className="h-8 w-8"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form to Add Label */}
          <Card className="h-fit shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Create Project Label
              </CardTitle>
              <CardDescription className="text-xs">
                Define a new label with a name and custom color.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-4 text-xs"
              >
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "Label name is required";
                      return undefined;
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = [];
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err));
                    });
                    if (labelValidationErrors.name) fieldErrors.push(labelValidationErrors.name);
                    const hasError = field.state.meta.isTouched && !!fieldErrors.length;
                    return (
                      <div className="space-y-1.5">
                        <label className="font-semibold">Label Name</label>
                        <Input
                          placeholder="e.g. Bug, Feature, Urgent"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            setLabelValidationErrors((prev) => ({ ...prev, name: "" }));
                          }}
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  }}
                </form.Field>

                <form.Field name="color">
                  {(field) => (
                    <div className="space-y-2">
                      <label className="font-semibold">Label Color</label>
                      
                      {/* Presets Grid */}
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => field.handleChange(preset.hex)}
                            className={cn(
                              "flex h-8 w-full items-center justify-center rounded-md border text-[9px] font-semibold text-white transition-all hover:scale-105",
                              field.state.value === preset.hex
                                ? "border-white ring-2 ring-primary scale-100"
                                : "border-transparent"
                            )}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          >
                            {field.state.value === preset.hex && "✓"}
                          </button>
                        ))}
                      </div>

                      {/* Custom Color Input */}
                      <div className="flex items-center gap-2 pt-2">
                        <div className="relative flex-1">
                          <Input
                            type="text"
                            placeholder="#ffffff"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="pl-9 font-mono"
                          />
                          <span
                            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white/20"
                            style={{ backgroundColor: field.state.value }}
                          />
                        </div>
                        <input
                          type="color"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>

                {/* Form Actions */}
                <div className="flex justify-end border-t border-slate-800/80 pt-4">
                  <form.Subscribe selector={(state) => [state.values.name, state.canSubmit] as const}>
                    {([nameVal, canSubmit]) => (
                      <Button
                        type="submit"
                        disabled={
                          !nameVal.trim() ||
                          !canSubmit ||
                          createLabelMutation.isPending
                        }
                      >
                        <Plus className="mr-1.5 h-4 w-4" /> Create Label
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
