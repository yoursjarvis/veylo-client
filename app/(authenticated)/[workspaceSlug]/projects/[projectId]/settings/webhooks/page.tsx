"use client";

import React from "react";
import { useProject } from "../../layout";
import { SlackWebhooksConfig } from "@/features/tasks/components/slack-webhooks-config";
import { Webhook } from "lucide-react";

export default function SlackIntegrationsSettingsPage() {
  const { projectId, isWorkspaceAdmin } = useProject();

  if (!isWorkspaceAdmin) {
    return (
      <div className="text-center p-8">
        You do not have administrative permissions to view settings.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-5">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Webhook className="h-5 w-5" /> Slack Integrations
        </h3>
        <p className="text-xs mt-1">
          Configure real-time notifications to Slack channels on task creations, status transitions, and sprint events.
        </p>
      </div>

      <div className="max-w-2xl border border-slate-800 rounded-xl p-6 shadow-md">
        <SlackWebhooksConfig projectId={projectId} />
      </div>
    </div>
  );
}
