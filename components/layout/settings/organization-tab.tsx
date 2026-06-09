"use client";

import { authClient } from "@/lib/auth-client";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogoUpload } from "@/components/shared/logo-upload";

export function OrganizationTab() {
  const { data: auth } = useCurrentUser();
  const { data: activeOrg, isPending, refetch } = authClient.useActiveOrganization();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeOrg) {
      setName(activeOrg.name);
    }
  }, [activeOrg]);

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;

    setLoading(true);
    try {
      const { error } = await authClient.organization.update({
        organizationId: activeOrg.id,
        data: {
          name: name.trim(),
        },
      });

      if (error) {
        toast.error(error.message || "Failed to update organization");
        return;
      }

      toast.success("Organization updated successfully");
      refetch();
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return <div className="text-sm text-muted-foreground animate-pulse">Loading organization details...</div>;
  }

  if (!activeOrg) {
    return <div className="text-sm text-muted-foreground">No active organization found.</div>;
  }

  // Determine user role
  const currentUserRole = activeOrg.members?.find((m: any) => m.userId === auth?.user?.id)?.role;
  const isOwnerOrAdmin = currentUserRole === "owner" || currentUserRole === "admin" || (activeOrg as any).role === "owner" || (activeOrg as any).role === "admin";

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
                  <img src={activeOrg.logo} alt="Org Logo" className="object-contain h-full w-full" />
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

        <form onSubmit={handleUpdateOrganization} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              required
              disabled={!isOwnerOrAdmin}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgSlug">URL Slug</Label>
            <Input
              id="orgSlug"
              value={activeOrg.slug || ""}
              disabled
              className="bg-muted/50"
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
