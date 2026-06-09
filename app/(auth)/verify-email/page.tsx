import { DecorIcon } from "@/components/shared/decor-icon"
import { cn } from "@/lib/utils"
import { VerifyEmail } from "@/features/auth/components/verify-email"
import { Suspense } from "react"

export default function VerifyEmailPage() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8">
      <div className="absolute -inset-y-6 -left-px w-px bg-border" />
      <div className="absolute -inset-y-6 -right-px w-px bg-border" />
      <div className="absolute -inset-x-6 -top-px h-px bg-border" />
      <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
      <DecorIcon position="top-left" />
      <DecorIcon position="bottom-right" />

      <div
        className={cn(
          "relative flex w-full max-w-sm flex-col justify-between p-6 md:p-8",
          "dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]"
        )}
      >
        <div className="absolute -inset-y-6 -left-px w-px bg-border" />
        <div className="absolute -inset-y-6 -right-px w-px bg-border" />
        <div className="absolute -inset-x-6 -top-px h-px bg-border" />
        <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
        <DecorIcon position="top-left" />
        <DecorIcon position="bottom-right" />

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="size-16 animate-pulse rounded-full bg-muted" />
              <div className="space-y-4">
                <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              </div>
            </div>
          }
        >
          <VerifyEmail />
        </Suspense>
      </div>
    </div>
  )
}
