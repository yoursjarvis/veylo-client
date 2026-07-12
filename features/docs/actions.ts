"use server"

import { cookies } from "next/headers"

export async function getSessionToken() {
  const cookieStore = await cookies()
  const token =
    cookieStore.get("better-auth.session_token")?.value ||
    cookieStore.get("__Secure-better-auth.session_token")?.value ||
    null
  console.log("[SERVER ACTION] Found session token:", token ? `${token.substring(0, 10)}...` : "null")
  return token
}
