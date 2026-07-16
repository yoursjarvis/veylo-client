"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { data: auth } = useCurrentUser()
  const router = useRouter()
  const user = auth?.user as
    | {
        firstName?: string
        lastName?: string
        name?: string
        email?: string
        emailVerified?: boolean
        createdAt?: string | Date
      }
    | undefined

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Button
        variant="ghost"
        className="mb-6 -ml-4 gap-2"
        onClick={() => router.back()}
      >
        &larr; Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                First Name
              </p>
              <p>{user?.firstName ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Last Name
              </p>
              <p>{user?.lastName ?? "N/A"}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p>{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Email Verified
            </p>
            <p>{user?.emailVerified ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Member Since
            </p>
            <p>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
