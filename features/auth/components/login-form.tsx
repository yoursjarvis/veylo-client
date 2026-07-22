"use client"

import { useEffect, useState } from "react"

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
  error?: string
}

export function LoginForm({ callbackUrl, error }: LoginFormProps) {
  const login = useLogin()
  const router = useRouter()
  const nextUrl = callbackUrl || "/dashboard"

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

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
      await authClient.signIn.social(
        {
          provider,
          callbackURL: callbackUrl || `${window.location.origin}/org-setup`,
        },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message || "Social login failed")
          },
        }
      )
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err?.message || "Social login failed")
    }
  }

  const [lastMethod] = useState<string | null>(() =>
    authClient.getLastUsedLoginMethod()
  )

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
            className="flex w-full items-center justify-between px-4"
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("google")}
          >
            <div className="flex flex-1 items-center justify-start">
              <HugeiconsIcon icon={GoogleIcon} />
            </div>
            <span className="font-medium whitespace-nowrap">
              Continue with Google
            </span>
            <div className="flex flex-1 items-center justify-end overflow-hidden pl-2">
              {lastMethod === "google" && (
                <span className="hidden rounded-full bg-secondary px-2 py-0.5 text-2xs font-medium whitespace-nowrap text-secondary-foreground sm:inline-block">
                  Last used
                </span>
              )}
            </div>
          </Button>
          <Button
            className="flex w-full items-center justify-between px-4"
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("github")}
          >
            <div className="flex flex-1 items-center justify-start">
              <HugeiconsIcon icon={Github} />
            </div>
            <span className="font-medium whitespace-nowrap">
              Continue with GitHub
            </span>
            <div className="flex flex-1 items-center justify-end overflow-hidden pl-2">
              {lastMethod === "github" && (
                <span className="hidden rounded-full bg-secondary px-2 py-0.5 text-2xs font-medium whitespace-nowrap text-secondary-foreground sm:inline-block">
                  Last used
                </span>
              )}
            </div>
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
                    value={field.state.value as string}
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
                      value={field.state.value as string}
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
