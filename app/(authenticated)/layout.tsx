"use client"

import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { FullPageLoader } from "@/components/layout/loading"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { WorkspaceProvider } from "@/components/providers/workspace-provider"

import { CreateWorkspaceModal } from "@/features/org/components/create-workspace-modal"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: auth, isLoading } = useCurrentUser()
  const [orgCheckComplete, setOrgCheckComplete] = useState(false)

  useEffect(() => {
    async function checkOrganization() {
      if (isLoading || !auth) return

      try {
        const { data: orgs } = await authClient.organization.list()
        const hostname = window.location.hostname
        const isMainDomain =
          hostname === "localhost" ||
          hostname === "veylo.test" ||
          hostname === "veylo.local" ||
          hostname === "veylo.com"

        if (!orgs || orgs.length === 0) {
          if (window.location.pathname !== "/org-setup") {
            window.location.href = `${window.location.protocol}//${window.location.host}/org-setup`
            return
          }
        } else if (isMainDomain && window.location.pathname !== "/org-setup") {
          // Redirect to the first organization's subdomain
          const firstOrg = orgs[0]
          if (firstOrg && firstOrg.slug) {
            window.location.href = `${window.location.protocol}//${firstOrg.slug}.${window.location.host}${window.location.pathname}`
            return
          }
        } else if (!isMainDomain) {
          // We are on a subdomain. Get the slug.
          const subdomain = hostname.split(".")[0]
          const currentOrg = orgs.find((org) => org.slug === subdomain)

          if (currentOrg) {
            // Check if it's already the active organization
            const { data: activeOrg } =
              await authClient.organization.getFullOrganization()
            if (!activeOrg || activeOrg.id !== currentOrg.id) {
              await authClient.organization.setActive({
                organizationId: currentOrg.id,
              })
            }
          }
        }
      } catch (error) {
        console.error("Failed to check organizations", error)
      } finally {
        setOrgCheckComplete(true)
      }
    }

    checkOrganization()
  }, [auth, isLoading])

  return (
    <WorkspaceProvider>
      <AppShell>
        {isLoading || !orgCheckComplete ? <FullPageLoader /> : children}
      </AppShell>
      <CreateWorkspaceModal />
    </WorkspaceProvider>
  )
}
