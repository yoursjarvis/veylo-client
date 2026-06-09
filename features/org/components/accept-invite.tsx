"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Building03Icon, UserIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";

export function AcceptInvite() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState(false);

  const { data: auth, isLoading: authLoading } = useCurrentUser();

  const { data: invitation, isLoading: inviteLoading, error: inviteError } = useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: async () => {
      if (!invitationId) throw new Error("No invitation ID provided");
      const { data, error } = await authClient.organization.getInvitation({
        query: { id: invitationId },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!invitationId,
  });

  const handleAccept = async () => {
    if (!invitationId) return;
    setAccepting(true);
    try {
      const { error } = await authClient.organization.acceptInvitation({
        query: { id: invitationId },
      });
      
      if (error) {
        toast.error(error.message || "Failed to accept invitation");
        return;
      }
      
      toast.success("Invitation accepted!");
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      
      // Redirect to the tenant dashboard
      const protocol = window.location.protocol;
      const hostParts = window.location.host.split('.');
      const baseDomain = hostParts.length > 1 && !window.location.host.startsWith('localhost') 
        ? hostParts.slice(-2).join('.') 
        : window.location.host;
        
      if (invitation?.organizationSlug) {
        window.location.href = `${protocol}//${invitation.organizationSlug}.${baseDomain}/dashboard`;
      } else {
         window.location.href = "/dashboard"; // Fallback
      }

    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setAccepting(false);
    }
  };

  if (!invitationId) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Invalid Link</h2>
        <p className="text-muted-foreground">The invitation link you clicked is invalid or missing the invitation ID.</p>
        <Button asChild variant="outline">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  if (inviteLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  if (inviteError || !invitation) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Invitation Not Found</h2>
        <p className="text-muted-foreground">This invitation may have expired, been revoked, or already been accepted.</p>
        <Button asChild variant="outline">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const needsLogin = !auth?.user;

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
      <div className="flex justify-center">
         <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={Building03Icon} size={32} />
         </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">You&apos;ve been invited!</h1>
        <p className="text-muted-foreground">
          You have been invited to join <strong className="text-foreground">{invitation.organizationName}</strong> as a <strong>{invitation.role}</strong>.
        </p>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between text-left">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-md border shadow-sm">
               <HugeiconsIcon icon={UserIcon} size={18} className="text-muted-foreground" />
            </div>
            <div>
               <p className="text-sm font-medium">{invitation.email}</p>
               <p className="text-xs text-muted-foreground">Invited by an organization owner</p>
            </div>
         </div>
      </div>

      <div className="space-y-4">
        {needsLogin ? (
          <>
            <p className="text-sm text-muted-foreground">You need to sign up or log in to accept this invitation.</p>
            <div className="grid gap-2">
              <Button asChild>
                <Link href={`/sign-up?callbackUrl=${encodeURIComponent(`/accept-invite?id=${invitationId}`)}`}>
                  Sign Up
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/login?callbackUrl=${encodeURIComponent(`/accept-invite?id=${invitationId}`)}`}>
                  Log In
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
             {auth.user.email !== invitation.email && (
                <p className="text-xs text-destructive text-center p-3 bg-destructive/10 rounded-md">
                   Warning: You are currently logged in as <strong>{auth.user.email}</strong>, which does not match the invited email address. You may still accept if the organization allows it, or log in with the correct account.
                </p>
             )}
            <Button 
              className="w-full" 
              onClick={handleAccept} 
              disabled={accepting}
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mr-2" />
              {accepting ? "Accepting..." : "Accept Invitation"}
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">Decline & Return Home</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
