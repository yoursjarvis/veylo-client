import { createAuthClient } from "better-auth/react"

const basePath = `${process.env.NEXT_PUBLIC_API_URL ?? "/api/v1"}/auth`

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // Keep browser requests same-origin so Next rewrites can proxy them to Express.
    return window.location.origin
  }

  return process.env.API_BACKEND_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:4000"
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  basePath,
})
