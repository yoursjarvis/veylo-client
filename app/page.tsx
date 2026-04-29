import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md w-full flex-col gap-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Veylo Auth</h1>
          <p className="text-muted-foreground">
            A production-grade authentication flow built with Next.js, TanStack, and Better Auth.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button render={<Link href="/login" />} size="lg">
            Login
          </Button>
          <Button render={<Link href="/sign-up" />} variant="outline" size="lg">
            Create Account
          </Button>
        </div>
        <div className="pt-4 border-t text-sm text-muted-foreground">
          Built with App Router, TanStack Query, TanStack Form, and shadcn/ui.
        </div>
      </div>
    </div>
  )
}
