"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    token ? "" : "Missing verification token"
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
        setMessage("Email verified successfully")
        toast.success("Email verified successfully")
      })
      .catch((err) => {
        if (!isActive) {
          return
        }

        setStatus("error")
        setMessage(err instanceof Error ? err.message : "Verification failed")
        toast.error("Email verification failed")
      })

    return () => {
      isActive = false
    }
  }, [token])

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Email Verification</CardTitle>
        <CardDescription>
          {status === "loading" && "Verifying your email..."}
          {status === "success" && "Verification successful!"}
          {status === "error" && "Verification failed"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className={status === "error" ? "text-destructive" : ""}>
          {message}
        </p>
        {status !== "loading" && (
          <Button className="w-full" render={<Link href="/login" />}>
            Go to Login
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
