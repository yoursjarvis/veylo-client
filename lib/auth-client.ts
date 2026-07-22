import {
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
  adminClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:4000",
  basePath: "/api/v1/auth",
  plugins: [
    lastLoginMethodClient(),
    organizationClient(),
    twoFactorClient(),
    adminClient(),
  ],
})
