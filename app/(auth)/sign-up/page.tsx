import { RegisterForm } from "@/features/auth/components/register-form"

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}) {
  const params = await searchParams
  const callbackUrl =
    typeof params?.callbackUrl === "string" ? params.callbackUrl : undefined

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm callbackUrl={callbackUrl} />
    </div>
  )
}
