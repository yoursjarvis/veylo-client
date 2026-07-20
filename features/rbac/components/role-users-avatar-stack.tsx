"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useRef } from "react"
import type { RoleUser } from "../services/rbac.service"

export function RoleUsersAvatarStack({
  users,
  totalCount,
}: {
  users: RoleUser[]
  totalCount: number
}) {
  const displayUsers = users.slice(0, 4)
  const remaining = Math.max(totalCount - 4, 0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: remaining,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 40,
    overscan: 5,
  })

  if (totalCount === 0) {
    return <span className="text-sm text-muted-foreground">No users</span>
  }

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {displayUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger render={
                <Avatar
                  className="h-8 w-8 border-2 border-background cursor-help"
                >
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              } />
              <TooltipContent>
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        {remaining > 0 && (
          <HoverCard>
            <HoverCardTrigger className="z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium hover:bg-muted/80">
              +{remaining}
            </HoverCardTrigger>
            <HoverCardContent className="w-64 p-0">
              <div className="border-b p-3 text-sm font-medium">
                Additional Users ({remaining})
              </div>
              <div ref={scrollRef} className="h-48 overflow-auto p-2">
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    // Simulating the actual user for the list
                    const u = users[virtualRow.index + 4] || {
                      id: `mock-${virtualRow.index}`,
                      name: `User ${virtualRow.index + 4}`,
                      avatarUrl: "",
                    }
                    return (
                      <div
                        key={virtualRow.index}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="flex items-center gap-3 px-2 py-1"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.avatarUrl} alt={u.name} />
                          <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">{u.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
    </div>
    </TooltipProvider>
  )
}
