import { useForm } from "@tanstack/react-form"
import type { FormOptions, FormValidateOrFn } from "@tanstack/form-core"
import { zodValidator } from "@tanstack/zod-form-adapter"

export type FieldErrorMessage = {
  message: string
}

type AuthFormOptions<
  TFormData,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
> = FormOptions<
  TFormData,
  undefined,
  TOnChange,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  never
>

function extractMessages(error: unknown): string[] {
  if (!error) {
    return []
  }

  if (Array.isArray(error)) {
    return error.flatMap(extractMessages)
  }

  if (typeof error === "string") {
    return [error]
  }

  if (error instanceof Error) {
    return [error.message]
  }

  if (typeof error === "object") {
    const record = error as {
      message?: unknown
      issues?: unknown
    }

    if (typeof record.message === "string") {
      return [record.message]
    }

    if (record.issues) {
      return extractMessages(record.issues)
    }
  }

  return [String(error)]
}

export function toFieldErrors(
  errors: ReadonlyArray<unknown> | undefined
): FieldErrorMessage[] {
  return errors?.flatMap(extractMessages).map((message) => ({ message })) ?? []
}

export function useAuthForm<
  TFormData,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
>(options: AuthFormOptions<TFormData, TOnChange>) {
  return useForm({
    ...options,
    validatorAdapter: zodValidator(),
  } as Parameters<typeof useForm>[0])
}
