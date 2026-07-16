"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/tasks/hooks/use-tasks"
import type { Notification as NotificationType } from "@/types/models"
import { formatDistanceToNow } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import React from "react"

import { IconStack } from "@/components/reui/icon-stack"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  AlertDiamondIcon,
  AtIcon,
  File02Icon,
  Message01Icon,
  MessageCircleReplyIcon,
  NoteRemoveIcon,
  Notification01Icon,
  NotificationOff01Icon,
  Refresh04Icon,
  TeamWorkIcon,
  ThumbsUpIcon,
  TickDouble01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function NotificationCenter() {
  const router = useRouter()
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string

  const { data: notifications = [] } = useNotifications()
  const { data: auth } = useCurrentUser()
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()
  const shownIds = React.useRef(new Set<string>())

  const handleNotificationClick = React.useCallback(
    (n: NotificationType) => {
      // Mark as read
      if (!n.isRead) {
        markReadMutation.mutate(n.id)
      }

      // Redirect to task drawer or project
      if (n.taskId && workspaceSlug) {
        if (n.projectId) {
          router.push(`/${workspaceSlug}/projects/${n.projectId}?taskId=${n.taskId}`)
        } else {
          router.push(`/${workspaceSlug}/tasks/${n.taskId}`)
        }
      } else if (n.projectId && workspaceSlug) {
        router.push(`/${workspaceSlug}/projects/${n.projectId}`)
      }
    },
    [markReadMutation, workspaceSlug, router]
  )

  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission()
    }
  }, [])

  React.useEffect(() => {
    if (!notifications || notifications.length === 0) return

    // Check if push notifications are enabled by preference
    let pushEnabled = true
    if (auth?.user?.notificationPreferences) {
      try {
        const parsed = JSON.parse(auth.user.notificationPreferences)
        if (parsed && typeof parsed === "object" && parsed.channels) {
          pushEnabled = parsed.channels.push !== false
        }
      } catch (e) {
        console.error("Error parsing notification channel preferences:", e)
      }
    }

    if (!pushEnabled) return

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const newUnread = notifications.filter(
        (n: NotificationType) => !n.isRead && !shownIds.current.has(n.id)
      )

      newUnread.forEach((n: NotificationType) => {
        shownIds.current.add(n.id)
        try {
          const notification = new Notification(n.title, {
            body: n.message,
          })
          notification.onclick = () => {
            window.focus()
            handleNotificationClick(n)
          }
        } catch (err) {
          console.error("Error triggering browser notification:", err)
        }
      })
    }
  }, [notifications, auth, handleNotificationClick])

  const unreadNotifications = notifications.filter(
    (n: NotificationType) => !n.isRead
  )
  const unreadCount = unreadNotifications.length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <HugeiconsIcon icon={AtIcon} className="h-4 w-4 text-primary" />
      case "assignment":
        return (
          <HugeiconsIcon icon={UserAdd01Icon} className="h-4 w-4 text-info" />
        )
      case "status_change":
        return (
          <HugeiconsIcon
            icon={Refresh04Icon}
            className="h-4 w-4 text-success"
          />
        )
      case "comment":
        return (
          <HugeiconsIcon
            icon={Message01Icon}
            className="h-4 w-4 text-muted-foreground"
          />
        )
      case "dependency":
        return (
          <HugeiconsIcon
            icon={AlertDiamondIcon}
            className="h-4 w-4 text-warning"
          />
        )
      case "project_added":
        return (
          <HugeiconsIcon icon={TeamWorkIcon} className="h-4 w-4 text-success" />
        )
      case "reply":
        return (
          <HugeiconsIcon
            icon={MessageCircleReplyIcon}
            className="h-4 w-4 text-primary"
          />
        )
      case "reaction":
        return (
          <HugeiconsIcon icon={ThumbsUpIcon} className="h-4 w-4 text-warning" />
        )
      case "assignment_removed":
        return (
          <HugeiconsIcon
            icon={NoteRemoveIcon}
            className="h-4 w-4 text-destructive"
          />
        )
      default:
        return (
          <HugeiconsIcon
            icon={File02Icon}
            className="h-4 w-4 text-muted-foreground"
          />
        )
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label="Notifications"
            size="icon-sm"
            variant="outline"
            className="relative border-border bg-background text-foreground hover:bg-muted"
          >
            <HugeiconsIcon icon={Notification01Icon} className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-80 overflow-hidden rounded-xl border-border bg-card p-0 text-card-foreground shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border bg-card p-3">
          <span className="text-xs font-bold text-foreground">
            Notifications
          </span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              className="flex h-auto items-center gap-1 p-0 text-2xs text-primary hover:text-primary/80"
              onClick={() => markAllReadMutation.mutate()}
            >
              <HugeiconsIcon icon={TickDouble01Icon} className="h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center p-4 text-center">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <IconStack
                      aria-hidden="true"
                      className="h-24 w-22 text-primary"
                    >
                      <HugeiconsIcon
                        icon={NotificationOff01Icon}
                        className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                      />
                    </IconStack>
                  </EmptyMedia>
                  <EmptyTitle>All caught up!</EmptyTitle>
                  <EmptyDescription>
                    When you get notifications, they&apos;ll show up here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n: NotificationType) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full items-start gap-2.5 p-3 text-left transition-colors hover:bg-muted/50 ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8 shrink-0 border border-border">
                    <AvatarImage
                      src={
                        (
                          n as NotificationType & {
                            sender?: {
                              image?: string | null
                              name?: string | null
                            }
                          }
                        ).sender?.image || ""
                      }
                    />
                    <AvatarFallback className="bg-muted text-2xs font-semibold text-foreground">
                      {(
                        n as NotificationType & {
                          sender?: {
                            image?: string | null
                            name?: string | null
                          }
                        }
                      ).sender?.name
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate text-xs font-bold text-foreground">
                        {n.title}
                      </span>
                      <span className="shrink-0 text-2xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-2xs leading-relaxed text-muted-foreground">
                      {n.message}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-2xs text-muted-foreground">
                      {getNotificationIcon(n.type)}
                      <span className="capitalize">
                        {n.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
