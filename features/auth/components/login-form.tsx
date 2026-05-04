"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useLogin } from "../hooks/use-auth"
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

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email and password to access your account.
        </CardDescription>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <CardContent className="space-y-4">
          <form.Field name="email">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="name@example.com"
                />

                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Link
                    href={
                      callbackUrl
                        ? `/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}`
                        : "/forgot-password"
                    }
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            )}
          </form.Subscribe>

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
        </CardFooter>
      </form>
    </Card>
  )
}
