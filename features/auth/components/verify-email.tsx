"use client"

import { Button } from "@/components/ui/button"
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { authService } from "../services/auth-service"

export function VerifyEmail() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">(() =>
    token ? "loading" : "error"
  )
  const [message, setMessage] = useState(() =>
    token
      ? "We are verifying your email address."
      : "Missing verification token"
  )

  useEffect(() => {
    if (!token) {
      return
    }

    let isActive = true

    void authService
      .verifyEmail(token)
      .then(() => {
        if (!isActive) {
          return
        }

        setStatus("success")
        setMessage(
          "Your email has been successfully verified. You can now log in to your account."
        )
        toast.success("Email verified successfully")
      })
      .catch((err) => {
        if (!isActive) {
          return
        }

        setStatus("error")
        setMessage(
          err instanceof Error
            ? err.message
            : "The verification link is invalid or has expired."
        )
        toast.error("Email verification failed")
      })

    return () => {
      isActive = false
    }
  }, [token])

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          {status === "loading" && (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="size-8 animate-spin"
            />
          )}
          {status === "success" && (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-8" />
          )}
          {status === "error" && (
            <HugeiconsIcon
              icon={Alert02Icon}
              className="size-8 text-destructive"
            />
          )}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {status === "loading" && "Verifying your email"}
            {status === "success" && "Email verified"}
            {status === "error" && "Verification failed"}
          </h1>
          <p className="text-pretty text-muted-foreground">{message}</p>
        </div>
      </div>

      {status !== "loading" && (
        <div className="w-full space-y-4">
          <Button className="w-full" render={<Link href="/login" />}>
            {status === "success" ? "Continue to Login" : "Back to Login"}
          </Button>

          {status === "error" && (
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the email?{" "}
              <Link href="/sign-up" className="text-primary hover:underline">
                Try signing up again
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
