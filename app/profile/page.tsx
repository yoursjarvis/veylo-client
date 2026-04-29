"use client";

import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: auth, isLoading } = useCurrentUser();
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        &larr; Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">First Name</p>
              <p>{auth?.user?.firstName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Name</p>
              <p>{auth?.user?.lastName}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p>{auth?.user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email Verified</p>
            <p>{auth?.user?.emailVerified ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Member Since</p>
            <p>{auth?.user?.createdAt ? new Date(auth.user.createdAt).toLocaleDateString() : "N/A"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
