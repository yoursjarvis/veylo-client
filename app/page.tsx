"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FullPageLoader } from "@/components/layout/loading"

export default function Page() {
  const { data: auth, isLoading } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && auth?.user) {
      router.replace("/dashboard")
    }
  }, [isLoading, auth, router])

  if (isLoading || auth?.user) {
    return <FullPageLoader />
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col gap-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Veylo Auth</h1>
          <p className="text-muted-foreground">
            A production-grade authentication flow built with Next.js, TanStack,
            and Better Auth.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            render={<Link href="/login" />}
            size="lg"
            nativeButton={false}
          >
            Login
          </Button>
          <Button
            render={<Link href="/sign-up" />}
            variant="outline"
            size="lg"
            nativeButton={false}
          >
            Create Account
          </Button>
        </div>
        <div className="border-t pt-4 text-sm text-muted-foreground">
          Built with App Router, TanStack Query, TanStack Form, and shadcn/ui.
        </div>
      </div>
    </div>
  )
}
