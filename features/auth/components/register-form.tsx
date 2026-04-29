"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useRegister } from "../hooks/use-auth";
import { registerSchema, RegisterInput } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export function RegisterForm() {
  const register = useRegister();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    } as RegisterInput,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }: { value: RegisterInput }) => {
      try {
        await register.mutateAsync(value);
        toast.success("Registration successful. Please check your email for verification.");
        router.push("/login");
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Registration failed");
      }
    },
  } as any);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Enter your details below to create your account.
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
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="first_name"
              children={(field: any) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="John"
                  />
                  <FieldError errors={field.state.meta.errors.map((err: any) => ({ message: err?.toString() }))} />
                </Field>
              )}
            />
            <form.Field
              name="last_name"
              children={(field: any) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Doe"
                  />
                  <FieldError errors={field.state.meta.errors.map((err: any) => ({ message: err?.toString() }))} />
                </Field>
              )}
            />
          </div>
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
          <form.Field
            name="password"
            children={(field: any) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
                  {isSubmitting ? "Creating account..." : "Sign Up"}
                </Button>
              );
            }}
          />
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
