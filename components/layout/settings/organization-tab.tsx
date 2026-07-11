"use client";

import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogoUpload } from "@/components/shared/logo-upload";
import { useForm } from "@tanstack/react-form";
import { usePermissions } from "@/hooks/use-permissions";

export function OrganizationTab() {
  const { data: activeOrg, isPending, refetch } = authClient.useActiveOrganization();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const form = useForm({
    defaultValues: {
      name: activeOrg?.name || "",
    },
    onSubmit: async ({ value }) => {
      if (!activeOrg) return;

      setLoading(true);
      setValidationErrors({});
      try {
        const { error } = await authClient.organization.update({
          organizationId: activeOrg.id,
          data: {
            name: value.name.trim(),
          },
        });

        if (error) {
          toast.error(error.message || "Failed to update organization");
          return;
        }

        toast.success("Organization updated successfully");
        refetch();
      } catch {
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (activeOrg) {
      form.setFieldValue("name", activeOrg.name || "");
    }
  }, [activeOrg, form]);

  if (isPending) {
    return <div className="text-sm text-muted-foreground animate-pulse">Loading organization details...</div>;
  }

  if (!activeOrg) {
    return <div className="text-sm text-muted-foreground">No active organization found.</div>;
  }

  // Determine user role
  const isOwnerOrAdmin = hasPermission("organization:update");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-lg font-medium">Organization Settings</h3>
        <p className="text-sm text-muted-foreground">
          {isOwnerOrAdmin ? "Manage your organization's details and branding." : "View your organization's details."}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Label>Organization Logo</Label>
          <div className="flex items-center gap-6">
            {isOwnerOrAdmin ? (
              <LogoUpload
                 initialUrl={activeOrg.logo}
                 onUploadSuccess={(url) => {
                   authClient.organization.update({
                      organizationId: activeOrg.id,
                      data: { logo: url }
                   }).then(() => refetch());
                 }}
              />
            ) : (
              <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center border-2 border-border overflow-hidden">
                {activeOrg.logo ? (
                   <Image src={activeOrg.logo} alt="Org Logo" width={96} height={96} className="object-contain h-full w-full" />
                ) : (
                  <span className="text-muted-foreground text-xs">No Logo</span>
                )}
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">Your Logo</p>
              <p className="text-xs text-muted-foreground">
                {isOwnerOrAdmin ? "Click the logo to upload a new one. Recommended size: 256x256px." : "Organization branding logo."}
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
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value.trim()) return "Organization name is required";
                return undefined;
              },
            }}
          >
            {(field) => {
              const fieldErrors: string[] = [];
              field.state.meta.errors.forEach((err) => {
                if (err) fieldErrors.push(String(err));
              });
              if (validationErrors.name) fieldErrors.push(validationErrors.name);
              const hasError = field.state.meta.isTouched && !!fieldErrors.length;
              return (
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="Acme Corp"
                    disabled={!isOwnerOrAdmin}
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

          <div className="space-y-2">
            <Label htmlFor="orgSlug">URL Slug</Label>
            <Input
              id="orgSlug"
              value={activeOrg.slug || ""}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              The URL slug is used for your organization&apos;s custom domain. It cannot be changed here.
            </p>
          </div>

          {isOwnerOrAdmin && (
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
