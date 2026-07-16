"use client"

import { IconStack } from "@/components/reui/icon-stack"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Delete01Icon, PlusSignIcon, WebhookIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loader2 } from "lucide-react"
import React, { useState } from "react"
import {
  useCreateSlackWebhook,
  useDeleteSlackWebhook,
  useProjectSlackWebhooks,
} from "../hooks/use-tasks"

interface SlackWebhooksConfigProps {
  projectId: string
}

export function SlackWebhooksConfig({ projectId }: SlackWebhooksConfigProps) {
  const { data: webhooks = [], isLoading } = useProjectSlackWebhooks(projectId)
  const createWebhookMutation = useCreateSlackWebhook(projectId)
  const deleteWebhookMutation = useDeleteSlackWebhook(projectId)

  const [url, setUrl] = useState("")
  const [channel, setChannel] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    createWebhookMutation.mutate(
      { url: url.trim(), channel: channel.trim() || null },
      {
        onSuccess: () => {
          setUrl("")
          setChannel("")
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <HugeiconsIcon icon={WebhookIcon} className="h-5 w-5 text-primary" />{" "}
          Slack Integrations
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Receive real-time notifications in your Slack channels when tasks are
          created, updated, or discussed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Registration Form */}
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Add Webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="webhook-url"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Webhook URL
                </label>
                <Input
                  id="webhook-url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="webhook-channel"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Channel Name (Optional)
                </label>
                <Input
                  id="webhook-channel"
                  placeholder="#project-updates"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button
                type="submit"
                className="w-full text-xs font-semibold"
                disabled={createWebhookMutation.isPending || !url}
              >
                {createWebhookMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                )}
                Connect Slack Channel
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing integrations list */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">
              Active Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : webhooks.length === 0 ? (
              <Card className="m-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card px-4 py-16 text-center">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <IconStack
                        aria-hidden="true"
                        className="h-24 w-22 text-primary"
                      >
                        <HugeiconsIcon
                          icon={WebhookIcon}
                          className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                        />
                      </IconStack>
                    </EmptyMedia>
                    <EmptyTitle>No active Slack integrations.</EmptyTitle>
                    <EmptyDescription>
                      Set up a webhook to get started.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </Card>
            ) : (
              <div className="divide-y divide-border">
                {webhooks.map(
                  (webhook: {
                    id: string
                    channel: string | null
                    url: string
                  }) => (
                    <div
                      key={webhook.id}
                      className="flex items-center justify-between p-4 transition-colors hover:bg-muted/15"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <HugeiconsIcon
                            icon={WebhookIcon}
                            className="h-4 w-4 text-primary"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-foreground">
                            {webhook.channel || "Default Channel"}
                          </p>
                          <p className="max-w-md truncate text-2xs text-muted-foreground">
                            {webhook.url}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (
                            confirm("Remove this Slack webhook integration?")
                          ) {
                            deleteWebhookMutation.mutate(webhook.id)
                          }
                        }}
                        disabled={deleteWebhookMutation.isPending}
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
