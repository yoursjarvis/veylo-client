"use client";

import { RolesTable } from "@/features/rbac/components/roles-table";
import { authClient } from "@/lib/auth-client";

export default function RolesPage() {
  const { data: activeOrganization, isPending } = authClient.useActiveOrganization();

  if (isPending) {
    return null;
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Roles & Permissions
            </h1>
            <p className="text-muted-foreground">
              Manage what users can see and do in this organization.
            </p>
          </div>
          
          {activeOrganization && (
            <RolesTable organizationId={activeOrganization.id} />
          )}
        </div>
      </div>
    </div>
  );
}
