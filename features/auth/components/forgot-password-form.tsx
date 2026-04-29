"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useForgotPassword } from "../hooks/use-auth";
import { forgotPasswordSchema, ForgotPasswordInput } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    } as ForgotPasswordInput,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: forgotPasswordSchema,
    },
    onSubmit: async ({ value }: { value: ForgotPasswordInput }) => {
      try {
        await forgotPassword.mutateAsync(value);
        setIsSubmitted(true);
        toast.success("Reset link sent to your email");
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to send reset link");
      }
    },
  } as any);

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We have sent a password reset link to your email address.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" render={<Link href="/login" />}>
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password.
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
            name="email"
            children={(field: any) => (
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
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              );
            }}
          />
          <div className="text-center text-sm">
            Remembered your password?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
