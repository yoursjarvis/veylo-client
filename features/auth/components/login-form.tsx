"use client"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { AuthDivider } from "@/features/auth/components/auth-divider"
import { authClient } from "@/lib/auth-client"
import {
  AtSignIcon,
  Github,
  GoogleIcon,
  SquareLockPasswordIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useLogin } from "../hooks/use-auth"

import { Field, FieldError } from "@/components/ui/field"
import { loginSchema } from "../types"
import { toFieldErrors, useAuthForm } from "./auth-form-utils"

type LoginFormProps = {
  callbackUrl?: string
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const login = useLogin()
  const router = useRouter()
  const nextUrl = callbackUrl || "/dashboard"

  const form = useAuthForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await login.mutateAsync({ ...value, callbackUrl })
        toast.success("Login successful")
        router.push(nextUrl)
      } catch (error) {
        const responseError = error as {
          message?: string
        }
        toast.error(responseError.message || "Login failed")
      }
    },
  })

  const handleSocialLogin = async (provider: "google" | "github") => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}/org-setup`,
      })
    } catch (error) {
      toast.error("Social login failed")
    }
  }

  const lastMethod = authClient.getLastUsedLoginMethod()

  return (
    <div className="w-full max-w-sm animate-in space-y-8">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-wide">Welcome Back!</h1>
        <p className="text-base text-muted-foreground">
          Login to your {process.env.NEXT_PUBLIC_APP_NAME} account.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button
            className="relative w-full"
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("google")}
          >
            <HugeiconsIcon icon={GoogleIcon} />
            Continue with Google
            {lastMethod === "google" && (
              <span className="absolute right-3 text-xs text-muted-foreground">
                Last used
              </span>
            )}
          </Button>
          <Button
            className="relative w-full"
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("github")}
          >
            <HugeiconsIcon icon={Github} />
            Continue with GitHub
            {lastMethod === "github" && (
              <span className="absolute right-3 text-xs text-muted-foreground">
                Last used
              </span>
            )}
          </Button>
        </div>
        <AuthDivider>OR</AuthDivider>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field name="email">
            {(field) => (
              <Field>
                <InputGroup>
                  <InputGroupInput
                    placeholder="your.email@example.com"
                    type="email"
                    name={field.name}
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="email"
                  />
                  <InputGroupAddon align="inline-start">
                    <HugeiconsIcon icon={AtSignIcon} />
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field>
                <div className="flex flex-col gap-1">
                  <InputGroup>
                    <InputGroupInput
                      placeholder="••••••••••••"
                      type="password"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      autoComplete="current-password"
                    />
                    <InputGroupAddon align="inline-start">
                      <HugeiconsIcon icon={SquareLockPasswordIcon} />
                    </InputGroupAddon>
                  </InputGroup>
                  <div className="flex justify-end">
                    <Link
                      href={
                        callbackUrl
                          ? `/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}`
                          : "/forgot-password"
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                className="w-full"
                size="sm"
                type="submit"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Continue With Email"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href={
            callbackUrl
              ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/sign-up"
          }
          className="text-primary hover:underline"
        >
          Sign up
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link
          className="underline underline-offset-4 hover:text-primary"
          href="/terms"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          className="underline underline-offset-4 hover:text-primary"
          href="/privacy"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
