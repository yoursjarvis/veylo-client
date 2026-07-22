import { DecorIcon } from "@/components/shared/decor-icon"
import { cn } from "@/lib/utils"
import { OrgSetupWizard } from "@/features/org/components/org-setup-wizard"

export default function OrgSetupPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-12 md:px-8">
      <div className="absolute -inset-y-6 -left-px w-px bg-border" />
      <div className="absolute -inset-y-6 -right-px w-px bg-border" />
      <div className="absolute -inset-x-6 -top-px h-px bg-border" />
      <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
      <DecorIcon position="top-left" />
      <DecorIcon position="bottom-right" />

      <div
        className={cn(
          "relative flex w-full max-w-lg flex-col justify-between rounded-xl border bg-card p-6 shadow-sm md:p-8",
          "dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.05),transparent)]"
        )}
      >
        <div className="absolute -inset-y-6 -left-px hidden w-px bg-border sm:block" />
        <div className="absolute -inset-y-6 -right-px hidden w-px bg-border sm:block" />
        <div className="absolute -inset-x-6 -top-px hidden h-px bg-border sm:block" />
        <div className="absolute -inset-x-6 -bottom-px hidden h-px bg-border sm:block" />
        <DecorIcon position="top-left" className="hidden sm:block" />
        <DecorIcon position="bottom-right" className="hidden sm:block" />

        <OrgSetupWizard />
      </div>
    </div>
  )
}
