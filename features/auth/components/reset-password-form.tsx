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
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useResetPassword } from "../hooks/use-auth"
import { resetPasswordSchema } from "../types"
import { toFieldErrors, useAuthForm } from "./auth-form-utils"

export function ResetPasswordForm() {
  const resetPassword = useResetPassword()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const form = useAuthForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        toast.error("Missing reset token")
        return
      }

      try {
        await resetPassword.mutateAsync({ token, data: value })
        toast.success("Password reset successful")
        router.push("/login")
      } catch (error) {
        const responseError = error as {
          message?: string
        }
        toast.error(responseError.message || "Failed to reset password")
      }
    },
  })

  if (!token) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">
            Invalid Link
          </CardTitle>
          <CardDescription>
            The password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            render={<Link href="/forgot-password" />}
          >
            Request new link
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <CardContent className="space-y-4">
          <form.Field name="password">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value as any}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>
          <form.Field name="confirmPassword">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value as any}
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
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  )
}
