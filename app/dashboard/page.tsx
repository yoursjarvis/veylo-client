"use client";

import { useCurrentUser, useLogout } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: auth, isLoading } = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome back, {auth?.user?.firstName} {auth?.user?.lastName}!</p>
      <div className="space-x-4">
        <Button onClick={() => router.push("/profile")}>Go to Profile</Button>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  );
}
