"use client"

import React from "react"
import { useProject } from "../../layout"
import { SlackWebhooksConfig } from "@/features/tasks/components/slack-webhooks-config"
import { Webhook } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"

export default function SlackIntegrationsSettingsPage() {
  const { projectId } = useProject()
  const { hasPermission } = usePermissions()

  const canRead = hasPermission("project-webhook:read")

  if (!canRead) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You do not have permission to view project webhooks.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Webhook className="h-5 w-5" /> Slack Integrations
        </h3>
        <p className="mt-1 text-xs">
          Configure real-time notifications to Slack channels on task creations,
          status transitions, and sprint events.
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border border-border p-6 shadow-md">
        <SlackWebhooksConfig projectId={projectId} />
      </div>
    </div>
  )
}
