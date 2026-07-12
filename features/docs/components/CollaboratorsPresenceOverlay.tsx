"use client"

import { useEffect, useState } from "react"
import { WebsocketProvider } from "y-websocket"
import { CollaboratorState } from "./DocsEditorUtils"

interface CollaboratorsPresenceOverlayProps {
  provider: WebsocketProvider | null
  userName: string
}

export function CollaboratorsPresenceOverlay({
  provider,
  userName,
}: CollaboratorsPresenceOverlayProps) {
  const [collaborators, setCollaborators] = useState<
    Record<string, CollaboratorState>
  >({})

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
            mouse: collabState.mouse,
            selection: collabState.selection,
          }
        }
      })
      setCollaborators(newCollaborators)
    }

    provider.awareness.on("change", handleAwarenessChange)
    handleAwarenessChange()

    return () => {
      provider.awareness.off("change", handleAwarenessChange)
    }
  }, [provider])

  return (
    <>
      {/* Custom Mouse Cursors Overlay */}
      {Object.entries(collaborators).map(([clientId, collab]) => {
        if (
          !collab.mouse ||
          !collab.mouse.inside ||
          collab.user.name === userName
        )
          return null

        const mouseX = `${collab.mouse.x * 100}%`
        const mouseY = `${collab.mouse.y * 100}%`

        return (
          <div
            key={clientId}
            style={{
              left: mouseX,
              top: mouseY,
              position: "absolute",
              pointerEvents: "none",
              transform: "translate(-2px, -2px)",
              transition: "all 0.08s ease-out",
            }}
            className="z-40 flex items-center gap-1.5"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-md"
            >
              <path
                d="M5.65376 12.3825L17.2003 18.0624C18.1517 18.5309 19.1437 17.5389 18.6752 16.5875L12.9953 5.04098C12.5539 4.14324 11.2662 4.18529 10.8841 5.11309L8.85767 10.0384L5.60276 10.749C4.68652 10.9493 4.71765 12.2618 5.65376 12.3825Z"
                fill={collab.user.color}
              />
            </svg>
            <div
              style={{ backgroundColor: collab.user.color }}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md"
            >
              <span>{collab.user.name}</span>
            </div>
          </div>
        )
      })}
    </>
  )
}
