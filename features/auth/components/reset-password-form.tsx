"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useResetPassword } from "../hooks/use-auth";
import { resetPasswordSchema, ResetPasswordInput } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const resetPassword = useResetPassword();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    } as ResetPasswordInput,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: resetPasswordSchema,
    },
    onSubmit: async ({ value }: { value: ResetPasswordInput }) => {
      if (!token) {
        toast.error("Missing reset token");
        return;
      }

      try {
        await resetPassword.mutateAsync({ token, data: value });
        toast.success("Password reset successful");
        router.push("/login");
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to reset password");
      }
    },
  } as any);

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">Invalid Link</CardTitle>
          <CardDescription>
            The password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" render={<Link href="/forgot-password" />}>
            Request new link
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardContent className="space-y-4">
          <form.Field
            name="password"
            children={(field: any) => (
              <Field>
                <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={field.state.meta.errors.map((err: any) => ({ message: err?.toString() }))} />
              </Field>
            )}
          />
          <form.Field
            name="confirmPassword"
            children={(field: any) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={field.state.meta.errors.map((err: any) => ({ message: err?.toString() }))} />
              </Field>
            )}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <form.Subscribe
            selector={(state: any) => [state.canSubmit, state.isSubmitting]}
            children={(state: any) => {
              const [canSubmit, isSubmitting] = state as [boolean, boolean];
              return (
                <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              );
            }}
          />
        </CardFooter>
      </form>
    </Card>
  );
}
