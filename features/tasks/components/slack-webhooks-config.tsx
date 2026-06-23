"use client";

import React, { useState } from "react";
import {
  useProjectSlackWebhooks,
  useCreateSlackWebhook,
  useDeleteSlackWebhook,
} from "../hooks/use-tasks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Plus, Loader2 } from "lucide-react";

const SlackIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.522 2.522H3.78a2.528 2.528 0 0 1-2.522-2.522V8.824a2.528 2.528 0 0 1 2.522-2.52h5.043zm10.135 3.761a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043zm-3.761 10.135a2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.522h5.043a2.528 2.528 0 0 1 2.522 2.522v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" />
  </svg>
);

interface SlackWebhooksConfigProps {
  projectId: string;
}

export function SlackWebhooksConfig({ projectId }: SlackWebhooksConfigProps) {
  const { data: webhooks = [], isLoading } = useProjectSlackWebhooks(projectId);
  const createWebhookMutation = useCreateSlackWebhook(projectId);
  const deleteWebhookMutation = useDeleteSlackWebhook(projectId);

  const [url, setUrl] = useState("");
  const [channel, setChannel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    createWebhookMutation.mutate(
      { url: url.trim(), channel: channel.trim() || null },
      {
        onSuccess: () => {
          setUrl("");
          setChannel("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <SlackIcon className="h-5 w-5 text-[#4A154B]" /> Slack Integrations
        </h3>
        <p className="text-muted-foreground text-sm mt-0.5">
          Receive real-time notifications in your Slack channels when tasks are created, updated, or discussed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Add Webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="webhook-url" className="text-xs text-muted-foreground font-semibold">
                  Webhook URL
                </label>
                <Input
                  id="webhook-url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-background border-border text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="webhook-channel" className="text-xs text-muted-foreground font-semibold">
                  Channel Name (Optional)
                </label>
                <Input
                  id="webhook-channel"
                  placeholder="#project-updates"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="bg-background border-border text-sm"
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
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Connect Slack Channel
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing integrations list */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No active Slack integrations. Set up a webhook to get started.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {webhooks.map((webhook: { id: string; channel: string | null; url: string }) => (
                  <div
                    key={webhook.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/15 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-[#4A154B]/10 flex items-center justify-center flex-shrink-0">
                        <SlackIcon className="h-4 w-4 text-[#4A154B]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {webhook.channel || "Default Channel"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-md">
                          {webhook.url}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Remove this Slack webhook integration?")) {
                          deleteWebhookMutation.mutate(webhook.id);
                        }
                      }}
                      disabled={deleteWebhookMutation.isPending}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
