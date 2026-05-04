import { BetterFetchError } from "@better-fetch/fetch"

export function getAuthErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
) {
  if (error instanceof BetterFetchError) {
    const responseError = error.error as
      | {
          message?: unknown
          error?: unknown
        }
      | string
      | null

    if (typeof responseError === "string") {
      return responseError
    }

    if (
      responseError &&
      typeof responseError === "object" &&
      typeof responseError.message === "string"
    ) {
      return responseError.message
    }

    if (
      responseError &&
      typeof responseError === "object" &&
      typeof responseError.error === "string"
    ) {
      return responseError.error
    }

    return error.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  if (typeof error === "object" && error) {
    const record = error as {
      message?: unknown
      error?: unknown
      response?: { data?: { message?: unknown } }
    }

    if (typeof record.message === "string") {
      return record.message
    }

    if (typeof record.error === "string") {
      return record.error
    }

    if (typeof record.response?.data?.message === "string") {
      return record.response.data.message
    }
  }

  return fallback
}
