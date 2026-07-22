import { DecorIcon } from "@/components/shared/decor-icon"
import { cn } from "@/lib/utils"
import { RegisterForm } from "@/features/auth/components/register-form"

export default async function SingUpPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string | string[]
    invitationId?: string | string[]
  }>
}) {
  const params = await searchParams
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : undefined
  const invitationId =
    typeof params.invitationId === "string" ? params.invitationId : undefined

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

        <RegisterForm callbackUrl={callbackUrl} invitationId={invitationId} />
      </div>
    </div>
  )
}
