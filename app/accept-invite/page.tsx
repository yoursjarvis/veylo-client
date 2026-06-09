import { DecorIcon } from "@/components/shared/decor-icon"
import { cn } from "@/lib/utils"
import { AcceptInvite } from "@/features/org/components/accept-invite"
import { Suspense } from "react"

export default function AcceptInvitePage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8 py-12">
      <div className="absolute -inset-y-6 -left-px w-px bg-border" />
      <div className="absolute -inset-y-6 -right-px w-px bg-border" />
      <div className="absolute -inset-x-6 -top-px h-px bg-border" />
      <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
      <DecorIcon position="top-left" />
      <DecorIcon position="bottom-right" />

      <div
        className={cn(
          "relative flex w-full max-w-md flex-col justify-between p-6 md:p-8 bg-card rounded-xl border shadow-sm",
          "dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.05),transparent)]"
        )}
      >
        <div className="absolute -inset-y-6 -left-px w-px bg-border hidden sm:block" />
        <div className="absolute -inset-y-6 -right-px w-px bg-border hidden sm:block" />
        <div className="absolute -inset-x-6 -top-px h-px bg-border hidden sm:block" />
        <div className="absolute -inset-x-6 -bottom-px h-px bg-border hidden sm:block" />
        <DecorIcon position="top-left" className="hidden sm:block" />
        <DecorIcon position="bottom-right" className="hidden sm:block" />

        <Suspense fallback={<div className="h-64 flex items-center justify-center animate-pulse bg-muted rounded-lg" />}>
           <AcceptInvite />
        </Suspense>
      </div>
    </div>
  )
}
