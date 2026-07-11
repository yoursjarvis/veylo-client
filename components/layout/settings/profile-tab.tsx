"use client";

import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/use-auth";
import { useForm } from "@tanstack/react-form";

export function ProfileTab() {
  const { data: auth } = useCurrentUser();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const user = auth?.user;

  const form = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      setValidationErrors({});
      try {
        const { error } = await authClient.updateUser({
          name: `${value.firstName} ${value.lastName}`.trim(),
        });

        if (error) {
          toast.error(error.message || "Failed to update profile");
          return;
        }

        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: authKeys.me() });
      } catch {
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (user) {
      form.setFieldValue("firstName", user.firstName || "");
      form.setFieldValue("lastName", user.lastName || "");
    }
  }, [user, form]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your public profile and account details.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Label>Profile Picture</Label>
          <div className="flex items-center gap-6">
            <AvatarUpload
               initialUrl={user?.image}
               onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: authKeys.me() })}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Your Avatar</p>
              <p className="text-xs text-muted-foreground">
                Click the avatar to upload a new one.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 max-w-md"
        >
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="firstName"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "First name is required";
                  return undefined;
                },
              }}
            >
              {(field) => {
                const fieldErrors: string[] = [];
                field.state.meta.errors.forEach((err) => {
                  if (err) fieldErrors.push(String(err));
                });
                if (validationErrors.firstName) fieldErrors.push(validationErrors.firstName);
                const hasError = field.state.meta.isTouched && !!fieldErrors.length;
                return (
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        setValidationErrors((prev) => ({ ...prev, firstName: "" }));
                      }}
                      placeholder="John"
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

            <form.Field
              name="lastName"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "Last name is required";
                  return undefined;
                },
              }}
            >
              {(field) => {
                const fieldErrors: string[] = [];
                field.state.meta.errors.forEach((err) => {
                  if (err) fieldErrors.push(String(err));
                });
                if (validationErrors.lastName) fieldErrors.push(validationErrors.lastName);
                const hasError = field.state.meta.isTouched && !!fieldErrors.length;
                return (
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        setValidationErrors((prev) => ({ ...prev, lastName: "" }));
                      }}
                      placeholder="Doe"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Your email address is managed through your account settings.
            </p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
