"use client"

import React, { useState } from "react"
import { useProject } from "../../layout"
import {
  useProjectCustomFields,
  useCreateCustomField,
  useDeleteCustomField,
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
import { Columns, Trash, Plus } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox"

export default function CustomFieldsSettingsPage() {
  const { projectId, isWorkspaceAdmin } = useProject()

  const [fieldValidationErrors, setFieldValidationErrors] = useState<Record<string, string>>({});

  const { data: customFields, isLoading: isFieldsLoading } =
    useProjectCustomFields(projectId)
  const createCustomFieldMutation = useCreateCustomField(projectId)
  const deleteCustomFieldMutation = useDeleteCustomField(projectId)

  const form = useForm({
    defaultValues: {
      name: "",
      type: "text" as "text" | "number" | "date" | "select" | "checkbox",
      options: "",
    },
    onSubmit: async ({ value }) => {
      setFieldValidationErrors({});
      if (!value.name.trim()) return;

      const optionsList = value.options
        ? value.options
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
        : [];

      createCustomFieldMutation.mutate(
        {
          name: value.name.trim(),
          type: value.type,
          options: optionsList,
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
              setFieldValidationErrors(errors);
            } else {
              toast.error(err.response?.data?.message || "Failed to create custom field");
            }
          },
        }
      );
    },
  });

  if (!isWorkspaceAdmin) {
    return (
      <div className="p-8 text-center">
        You do not have administrative permissions to view settings.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Columns className="h-5 w-5 text-primary" /> Custom Fields
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure project custom columns/properties to track specific task
          metadata (e.g. Campaign Budget, Choice Dropdowns).
        </p>
      </div>

      {isFieldsLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
          {/* List of Custom Fields */}
          <Card className="shadow-md border border-border bg-card text-foreground">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Active Custom Fields
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Fields currently defined for this project&apos;s tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!customFields || customFields.length === 0 ? (
                <div className="py-6 text-center text-xs italic text-muted-foreground">
                  No custom fields defined for this project.
                </div>
              ) : (
                <div className="space-y-3">
                  {customFields.map((field: { id: string, name: string, type: string, options?: string[] }) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/20"
                    >
                      <div className="space-y-0.5 text-xs">
                        <p className="font-semibold">{field.name}</p>
                        <p className="capitalize text-muted-foreground">{field.type}</p>
                        {field.options && field.options.length > 0 && (
                          <p className="mt-1 text-muted-foreground">
                            Options: {field.options.join(", ")}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() =>
                          deleteCustomFieldMutation.mutate(field.id)
                        }
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form to Add Custom Field */}
          <Card className="h-fit shadow-md border border-border bg-card text-foreground">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Create Custom Field
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Define a new key-value descriptor for project issues.
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
                      if (!value.trim()) return "Field name is required";
                      return undefined;
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = [];
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err));
                    });
                    if (fieldValidationErrors.name) fieldErrors.push(fieldValidationErrors.name);
                    const hasError = field.state.meta.isTouched && !!fieldErrors.length;
                    return (
                      <div className="space-y-1.5">
                        <label className="font-semibold text-muted-foreground">Field Name</label>
                        <Input
                          placeholder="e.g. Campaign Budget, QA Status"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            setFieldValidationErrors((prev) => ({ ...prev, name: "" }));
                          }}
                          className="bg-background border border-border"
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <p className="text-[11px] text-destructive font-medium mt-1">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  }}
                </form.Field>

                <form.Field name="type">
                  {(field) => (
                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Data Type</label>
                      <Combobox
                        value={field.state.value}
                        onValueChange={(val) => {
                          if (val) {
                            field.handleChange(
                              val as
                                | "text"
                                | "number"
                                | "date"
                                | "select"
                                | "checkbox"
                            );
                          }
                        }}
                      >
                        <ComboboxInput
                          placeholder="Select data type..."
                          className="w-full bg-background border border-border text-xs h-9"
                          showTrigger
                        />
                        <ComboboxContent className="bg-popover border border-border">
                          <ComboboxList>
                            <ComboboxItem value="text">Text (Single Line)</ComboboxItem>
                            <ComboboxItem value="number">Number</ComboboxItem>
                            <ComboboxItem value="date">Date</ComboboxItem>
                            <ComboboxItem value="select">Dropdown Choice</ComboboxItem>
                            <ComboboxItem value="checkbox">Checkbox (Yes/No)</ComboboxItem>
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>
                  )}
                </form.Field>

                <form.Subscribe selector={(state) => state.values.type}>
                  {(fieldType) => {
                    if (fieldType !== "select") return null;
                    return (
                      <form.Field
                        name="options"
                        validators={{
                          onChange: ({ value }) => {
                            if (fieldType === "select" && !value.trim()) {
                              return "Options are required for dropdown fields";
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
                          if (fieldValidationErrors.options) fieldErrors.push(fieldValidationErrors.options);
                          const hasError = field.state.meta.isTouched && !!fieldErrors.length;
                          return (
                            <div className="space-y-1.5">
                              <label className="flex items-center justify-between font-semibold text-muted-foreground">
                                <span>Dropdown Options (Comma-separated)</span>
                                <span className="text-[9px] font-normal text-muted-foreground opacity-80">
                                  e.g. Backlog, In Progress, Blocked
                                </span>
                              </label>
                              <Input
                                placeholder="Pending, Approved, Rejected..."
                                value={field.state.value}
                                onChange={(e) => {
                                  field.handleChange(e.target.value);
                                  setFieldValidationErrors((prev) => ({ ...prev, options: "" }));
                                }}
                                className="bg-background border border-border"
                                aria-invalid={hasError}
                              />
                              {hasError && (
                                <p className="text-[11px] text-destructive font-medium mt-1">
                                  {fieldErrors.join(", ")}
                                </p>
                              )}
                            </div>
                          );
                        }}
                      </form.Field>
                    );
                  }}
                </form.Subscribe>

                <div className="flex justify-end border-t border-border pt-3 mt-4">
                  <form.Subscribe selector={(state) => [state.values.name, state.canSubmit] as const}>
                    {([nameVal, canSubmit]) => (
                      <Button
                        type="submit"
                        disabled={
                          !nameVal.trim() ||
                          !canSubmit ||
                          createCustomFieldMutation.isPending
                        }
                      >
                        <Plus className="mr-1.5 h-4 w-4" /> Define Field
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
