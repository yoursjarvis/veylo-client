"use client"

import { useCurrentUser, authKeys } from "@/features/auth/hooks/use-auth"
import { authClient } from "@/lib/auth-client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface NotificationTypeOption {
  id: string
  label: string
  description: string
}

const NOTIFICATION_TYPES: NotificationTypeOption[] = [
  {
    id: "assignment",
    label: "Task Assignments",
    description:
      "Receive notifications when tasks are assigned to you or when you are removed from them.",
  },
  {
    id: "status_change",
    label: "Task Status Updates",
    description:
      "Receive notifications when the status of your created or assigned tasks changes.",
  },
  {
    id: "mention",
    label: "Mentions (@)",
    description:
      "Receive notifications when you are mentioned in task descriptions or comments.",
  },
  {
    id: "comment",
    label: "Task Comments",
    description:
      "Receive notifications when comments are posted on tasks you are assigned to.",
  },
  {
    id: "reply",
    label: "Replies to Comments",
    description:
      "Receive notifications when someone replies to a comment you posted.",
  },
  {
    id: "project_added",
    label: "Project Access",
    description: "Receive notifications when you are added to a new project.",
  },
  {
    id: "reaction",
    label: "Comment Reactions",
    description:
      "Receive notifications when someone reacts with an emoji to your comments.",
  },
]

const NOTIFICATION_CHANNELS: NotificationTypeOption[] = [
  {
    id: "in_app",
    label: "In-App Notifications",
    description:
      "Display notifications inside the application's notification center panel.",
  },
  {
    id: "email",
    label: "Email Notifications",
    description: "Send notifications directly to your account email address.",
  },
  {
    id: "push",
    label: "Browser Push Notifications",
    description:
      "Trigger desktop notifications through the browser window alert system.",
  },
]

export function NotificationsTab() {
  const { data: auth } = useCurrentUser()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  // Local state for notification preferences (true = enabled/on, false = disabled/off)
  const [preferences, setPreferences] = useState<{
    types: Record<string, boolean>
    channels: Record<string, boolean>
  }>({
    types: {},
    channels: {},
  })

  useEffect(() => {
    const parsedTypes: Record<string, boolean> = {}
    const parsedChannels: Record<string, boolean> = {}

    // Initialize with defaults (all true)
    NOTIFICATION_TYPES.forEach((opt) => {
      parsedTypes[opt.id] = true
    })
    NOTIFICATION_CHANNELS.forEach((opt) => {
      parsedChannels[opt.id] = true
    })

    if (auth?.user?.notificationPreferences) {
      try {
        const parsed = JSON.parse(auth.user.notificationPreferences)
        if (parsed && typeof parsed === "object") {
          // If structure is nested (types and channels)
          if (parsed.types && typeof parsed.types === "object") {
            NOTIFICATION_TYPES.forEach((opt) => {
              parsedTypes[opt.id] = parsed.types[opt.id] !== false
            })
          } else {
            // Fallback for flat structure
            NOTIFICATION_TYPES.forEach((opt) => {
              parsedTypes[opt.id] = parsed[opt.id] !== false
            })
          }

          if (parsed.channels && typeof parsed.channels === "object") {
            NOTIFICATION_CHANNELS.forEach((opt) => {
              parsedChannels[opt.id] = parsed.channels[opt.id] !== false
            })
          }
        }
      } catch (e) {
        console.error("Error parsing notification preferences:", e)
      }
    }

    setTimeout(() => {
      setPreferences({
        types: parsedTypes,
        channels: parsedChannels,
      })
    }, 0)
  }, [auth])

  const handleToggleType = (id: string) => {
    setPreferences((prev) => ({
      ...prev,
      types: {
        ...prev.types,
        [id]: !prev.types[id],
      },
    }))
  }

  const handleToggleChannel = (id: string) => {
    // If turning on push notification, check browser permissions
    if (id === "push" && !preferences.channels.push) {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "denied") {
          toast.warning(
            "Browser notifications are blocked. Please enable them in your browser settings."
          )
        } else if (Notification.permission === "default") {
          Notification.requestPermission()
        }
      }
    }

    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [id]: !prev.channels[id],
      },
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await (
        authClient.updateUser as unknown as (data: {
          notificationPreferences: string
        }) => Promise<{ error?: { message?: string } }>
      )({
        notificationPreferences: JSON.stringify(preferences),
      })

      if (error) {
        toast.error(
          error.message || "Failed to update notification preferences"
        )
        return
      }

      toast.success("Notification preferences updated successfully")
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in space-y-8 duration-300 fade-in slide-in-from-bottom-2">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Choose where and how you want to receive alerts and updates.
        </p>
      </div>

      {/* Channels Section */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">
            Delivery Channels
          </h4>
          <p className="text-xs text-muted-foreground">
            Toggle how you want notifications delivered.
          </p>
        </div>
        <div className="max-w-2xl space-y-4 divide-y divide-border border-y border-border">
          {NOTIFICATION_CHANNELS.map((option) => {
            const isEnabled = preferences.channels[option.id] !== false
            return (
              <div
                key={option.id}
                className="flex items-center justify-between py-4 first:pt-0"
              >
                <div className="space-y-0.5 pr-4">
                  <Label
                    htmlFor={`chan-${option.id}`}
                    className="cursor-pointer text-sm font-semibold"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <Switch
                  id={`chan-${option.id}`}
                  checked={isEnabled}
                  onCheckedChange={() => handleToggleChannel(option.id)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Types Section */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">
            Notification Types
          </h4>
          <p className="text-xs text-muted-foreground">
            Select which event updates you want to trigger alerts.
          </p>
        </div>
        <div className="max-w-2xl space-y-4 divide-y divide-border border-y border-border">
          {NOTIFICATION_TYPES.map((option) => {
            const isEnabled = preferences.types[option.id] !== false
            return (
              <div
                key={option.id}
                className="flex items-center justify-between py-4 first:pt-0"
              >
                <div className="space-y-0.5 pr-4">
                  <Label
                    htmlFor={`pref-${option.id}`}
                    className="cursor-pointer text-sm font-semibold"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <Switch
                  id={`pref-${option.id}`}
                  checked={isEnabled}
                  onCheckedChange={() => handleToggleType(option.id)}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="pt-4">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  )
}
