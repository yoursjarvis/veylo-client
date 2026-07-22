"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FullPageLoader } from "@/components/layout/loading"

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && session) {
      // If user is already logged in, redirect them to dashboard
      // Note: For invitations, this might be restrictive, but following "guest middleware" instruction.
      router.push("/dashboard")
    }
  }, [session, isPending, router])

  if (isPending || session) {
    return <FullPageLoader />
  }

  return <>{children}</>
}
