"use client";

import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/use-auth";

export function ProfileTab() {
  const { data: auth } = useCurrentUser();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(auth?.user?.firstName || "");
  const [lastName, setLastName] = useState(auth?.user?.lastName || "");
  const [loading, setLoading] = useState(false);

  const user = auth?.user;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await authClient.updateUser({
        name: `${firstName} ${lastName}`.trim(),
      });

      if (error) {
        toast.error(error.message || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your public profile and account details.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Label>Profile Picture</Label>
          <div className="flex items-center gap-6">
            <AvatarUpload
               initialUrl={user?.image}
               onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: authKeys.me() })}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Your Avatar</p>
              <p className="text-xs text-muted-foreground">
                Click the avatar to upload a new one.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              Your email address is managed through your account settings.
            </p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
