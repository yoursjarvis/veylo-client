"use client";

import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { FullPageLoader } from "@/components/layout/loading";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useCurrentUser();

  if (isLoading) {
    return <FullPageLoader />;
  }

  return <AppShell>{children}</AppShell>;
}
