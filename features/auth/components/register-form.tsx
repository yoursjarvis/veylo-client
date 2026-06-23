"use client"

import { AuthDivider } from "@/features/auth/components/auth-divider"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  AtSignIcon,
  Github,
  GoogleIcon,
  SquareLockPasswordIcon,
  User02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { useRegister } from "../hooks/use-auth"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { orgService } from "@/features/org/services/org-service"

import { registerSchema } from "../types"
import { toFieldErrors, useAuthForm } from "./auth-form-utils"
import { Field, FieldError } from "@/components/ui/field"

interface RegisterFormProps {
  callbackUrl?: string
  invitationId?: string
}

export function RegisterForm({ callbackUrl, invitationId }: RegisterFormProps) {
  const register = useRegister()
  const router = useRouter()

  const { data: invitation, isPending: inviteLoading, error: inviteError } = useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: async () => {
      if (!invitationId) throw new Error("No invitation ID provided");
      return orgService.getInvitation(invitationId);
    },
    enabled: !!invitationId,
  });

  const form = useAuthForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await register.mutateAsync(value)
        toast.success(
          "Registration successful. Please check your email for verification."
        )
        router.push(callbackUrl || "/login")
      } catch (error) {
        const responseError = error as {
          message?: string
        }
        toast.error(responseError.message || "Registration failed")
      }
    },
  })

  useEffect(() => {
    if (invitation?.email) {
      form.setFieldValue("email", invitation.email);
    }
  }, [invitation, form]);

  const handleSocialLogin = async (provider: "google" | "github") => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: callbackUrl
          ? `${window.location.origin}${callbackUrl}`
          : `${window.location.origin}/org-setup`,
      })
    } catch {
      toast.error("Social login failed")
    }
  }

  if (invitationId && inviteLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  if (invitationId && (inviteError || !invitation)) {
    return (
      <div className="text-center space-y-4 py-8">
        <h2 className="text-xl font-semibold text-destructive">Invalid Invitation</h2>
        <p className="text-muted-foreground">This invitation link is invalid, expired, or has already been used.</p>
        <Button render={<Link href="/login" />} variant="outline" className="w-full">
          Go to Login
        </Button>
      </div>
    );
  }

  const isInvited = !!(invitationId && invitation);

  return (
    <div className="w-full max-w-sm animate-in space-y-8">

      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-wide">
          {isInvited ? `Join ${invitation.organizationName}` : "Join Now!"}
        </h1>
        <p className="text-base text-muted-foreground">
          {isInvited 
            ? `Create your account for ${invitation.email}.`
            : `Create your ${process.env.NEXT_PUBLIC_APP_NAME} account.`}
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 space-y-2">
          <Button
            className="w-full"
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("google")}
          >
            <HugeiconsIcon icon={GoogleIcon} />
            Google
          </Button>
          <Button
            className="w-full"
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin("github")}
          >
            <HugeiconsIcon icon={Github} />
            GitHub
          </Button>
        </div>

        <AuthDivider>OR</AuthDivider>
        <form 
          className="space-y-2" 
          noValidate
          method="POST"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field name="first_name">
            {(field) => (
              <Field>
                <InputGroup>
                  <InputGroupInput
                    placeholder="John"
                    type="text"
                    name={field.name}
                    id={field.name}
                    value={field.state.value as string}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="given-name"
                  />
                  <InputGroupAddon align="inline-start">
                    <HugeiconsIcon icon={User02Icon} />
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>

          <form.Field name="last_name">
            {(field) => (
              <Field>
                <InputGroup>
                  <InputGroupInput
                    placeholder="Doe"
                    type="text"
                    name={field.name}
                    id={field.name}
                    value={field.state.value as string}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="family-name"
                  />
                  <InputGroupAddon align="inline-start">
                    <HugeiconsIcon icon={User02Icon} />
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
              </Field>
            )}
          </form.Field>

          {!isInvited && (
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
          )}

          <form.Field name="password">
            {(field) => (
              <Field>
                <InputGroup>
                  <InputGroupInput
                    placeholder="••••••••••••"
                    type="password"
                    name={field.name}
                    id={field.name}
                    value={field.state.value as string}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="new-password"
                  />
                  <InputGroupAddon align="inline-start">
                    <HugeiconsIcon icon={SquareLockPasswordIcon} />
                  </InputGroupAddon>
                </InputGroup>
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
                {isSubmitting ? "Creating account..." : "Continue With Email"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Login
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
