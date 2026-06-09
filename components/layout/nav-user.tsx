"use client";

import { useState } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { SettingsModal } from "./settings-modal";

export function NavUser() {
  const { data: auth } = useCurrentUser();
  const [showSettings, setShowSettings] = useState(false);

  const user = auth?.user as {
    name?: string;
    email?: string;
    image?: string;
  } | undefined;

	return (
    <>
      <button 
        onClick={() => setShowSettings(true)}
        className="relative flex shrink-0 overflow-hidden rounded-full size-8 hover:ring-2 hover:ring-primary/20 transition-all active:scale-95"
      >
        <Avatar className="size-full">
          <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {user?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </button>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </>
	);
}
