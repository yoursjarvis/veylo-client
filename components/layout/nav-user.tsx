"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { useState } from "react"
import { SettingsModal } from "./settings-modal"

export function NavUser() {
  const { data: auth } = useCurrentUser()
  const [showSettings, setShowSettings] = useState(false)

  const user = auth?.user as
    | {
        name?: string
        email?: string
        image?: string
      }
    | undefined

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className="relative flex size-8 shrink-0 overflow-hidden rounded-full transition-all hover:ring-2 hover:ring-primary/20 active:scale-95"
      >
        <Avatar className="size-full">
          <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
            {user?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </button>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}
