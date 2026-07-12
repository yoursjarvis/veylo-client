"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ProjectMember } from "@/types/models"
import { useEffect, useState } from "react"
import { WebsocketProvider } from "y-websocket"
import {
  CollaboratorState,
  CollaboratorUser,
  resolveAvatarUrl,
} from "./DocsEditorUtils"

interface CollaboratorsHeaderAvatarsProps {
  provider: WebsocketProvider | null
  userEmail: string
  userId: string
  userAvatar: string | null
  members?: ProjectMember[]
}

export function CollaboratorsHeaderAvatars({
  provider,
  userEmail,
  userId,
  userAvatar,
  members,
}: CollaboratorsHeaderAvatarsProps) {
  const [collaborators, setCollaborators] = useState<
    Record<string, CollaboratorState>
  >({})

  // Helper to resolve/find collaborator avatar URL
  const getCollaboratorAvatar = (
    collabUser: CollaboratorUser
  ): string | undefined => {
    // 1. Priority: If this is the current user, use the prop
    if (
      collabUser.id === userId ||
      collabUser.email?.toLowerCase() === userEmail?.toLowerCase()
    ) {
      return resolveAvatarUrl(userAvatar)
    }

    // 2. If we have a members list, try to find a high-res image there
    if (members && members.length > 0) {
      if (collabUser.id) {
        const memberById = members.find(
          (m) =>
            String(m.userId) === String(collabUser.id) ||
            String(m.id) === String(collabUser.id)
        )
        if (memberById?.user?.image) {
          return resolveAvatarUrl(memberById.user.image)
        }
      }
      const memberByEmail = members.find(
        (m) => m.user?.email?.toLowerCase() === collabUser.email?.toLowerCase()
      )
      if (memberByEmail?.user?.image) {
        return resolveAvatarUrl(memberByEmail.user.image)
      }
    }

    // 3. Fallback: Use the avatar provided in the awareness state
    return resolveAvatarUrl(collabUser.avatar)
  }

  // Reset collaborators state during render when provider changes/becomes null (React 19 derived state pattern)
  const [prevProvider, setPrevProvider] = useState<WebsocketProvider | null>(
    null
  )
  if (provider !== prevProvider) {
    setPrevProvider(provider)
    if (!provider && Object.keys(collaborators).length > 0) {
      setCollaborators({})
    }
  }

  useEffect(() => {
    if (!provider) {
      return
    }

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates()
      const newCollaborators: Record<string, CollaboratorState> = {}
      states.forEach((state: unknown, clientID: number) => {
        const collabState = state as CollaboratorState
        if (collabState.user) {
          newCollaborators[clientID.toString()] = {
            user: collabState.user,
          }
        }
      })

      setCollaborators((prev) => {
        const prevKeys = Object.keys(prev)
        const newKeys = Object.keys(newCollaborators)
        if (prevKeys.length !== newKeys.length) {
          return newCollaborators
        }
        const hasDifference = newKeys.some((key) => {
          const prevUser = prev[key]?.user
          const newUser = newCollaborators[key]?.user
          if (!prevUser || !newUser) return true
          return (
            prevUser.id !== newUser.id ||
            prevUser.name !== newUser.name ||
            prevUser.email !== newUser.email ||
            prevUser.avatar !== newUser.avatar ||
            prevUser.color !== newUser.color
          )
        })
        if (hasDifference) {
          return newCollaborators
        }
        return prev
      })
    }

    provider.awareness.on("change", handleAwarenessChange)
    handleAwarenessChange()

    return () => {
      provider.awareness.off("change", handleAwarenessChange)
    }
  }, [provider])

  return (
    <div className="flex items-center -space-x-1.5">
      {Object.entries(collaborators).map(([clientId, collab]) => {
        const avatarUrl = getCollaboratorAvatar(collab.user)
        return (
          <HoverCard key={clientId}>
            <HoverCardTrigger
              style={{ borderColor: collab.user.color }}
              className="shrink-0 cursor-pointer overflow-hidden rounded-full border-2 bg-background p-0 outline-hidden transition-all hover:z-25"
            >
              <Avatar size="sm">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-xs font-bold">
                  {collab.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent className="w-60 p-4" align="end" sideOffset={8}>
              <div className="flex items-center gap-3">
                <Avatar
                  size="lg"
                  className="border-2"
                  style={{ borderColor: collab.user.color }}
                >
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback className="text-sm font-bold">
                    {collab.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-xs leading-none font-semibold text-foreground">
                    {collab.user.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {collab.user.email}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 animate-pulse rounded-full"
                      style={{ backgroundColor: collab.user.color }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {collab.user.email === userEmail
                        ? "You (Editing)"
                        : "Active now"}
                    </span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )
      })}
    </div>
  )
}
