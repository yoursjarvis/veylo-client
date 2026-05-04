import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string | string[] }
}) {
  const callbackUrl =
    typeof searchParams?.callbackUrl === "string"
      ? searchParams.callbackUrl
      : undefined

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
