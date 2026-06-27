"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import { AttachmentIcon } from "@hugeicons/core-free-icons"
import { AttachmentItem } from "../attachments"
import { Media } from "@/types/models"

interface TaskDetailsAttachmentsProps {
  attachments: Media[]
  onUpload: (file: File) => void
  onDelete: (id: string) => void
  canDelete: (id: string) => boolean
  isUploading: boolean
}

export function TaskDetailsAttachments({
  attachments = [],
  onUpload,
  onDelete,
  canDelete,
  isUploading,
}: TaskDetailsAttachmentsProps) {
  return (
    <div className="space-y-4 border-t border-border/60 pt-6">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <HugeiconsIcon icon={AttachmentIcon} size={14} className="text-muted-foreground/70" />{" "}
          Attachments
        </label>
        <div className="relative">
          <Input
            type="file"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            title="Upload file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUpload(e.target.files[0])
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs font-medium"
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Add Attachment"}
          </Button>
        </div>
      </div>
      {attachments.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onDelete={onDelete}
              canDelete={canDelete(attachment.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No attachments yet. Click the button above to upload.
        </div>
      )}
    </div>
  )
}
