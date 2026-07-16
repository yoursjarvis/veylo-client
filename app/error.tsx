"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Global runtime error caught:", error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="flex max-w-md flex-col items-center justify-center space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-xl transition-all duration-300 hover:border-foreground/20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive animate-bounce">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">Something went wrong!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The application encountered a critical runtime error. Try refreshing the page or contact support if the issue persists.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="w-full sm:w-auto font-semibold">
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto font-semibold"
          >
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  )
}
