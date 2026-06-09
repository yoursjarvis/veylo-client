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
import { useState } from "react"
import { toast } from "sonner"
import { useForgotPassword } from "../hooks/use-auth"
import { forgotPasswordSchema } from "../types"
import { toFieldErrors, useAuthForm } from "./auth-form-utils"

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useAuthForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onChange: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await forgotPassword.mutateAsync(value)
        setIsSubmitted(true)
        toast.success("Reset link sent to your email")
      } catch (error) {
        const responseError = error as {
          message?: string
        }
        toast.error(responseError.message || "Failed to send reset link")
      }
    },
  })

  if (isSubmitted) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We have sent a password reset link to your email address.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            render={<Link href="/login" />}
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
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
                  value={field.state.value as any}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="name@example.com"
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
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            )}
          </form.Subscribe>
          <div className="text-center text-sm">
            Remembered your password?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
