"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AttachmentIcon } from "@hugeicons/core-free-icons"
import { AttachmentItem } from "../attachments"
import { Media } from "@/types/models"
import { Pattern as FileUpload } from "@/components/reui/file-upload"

interface TaskDetailsAttachmentsProps {
  taskId: string
  attachments: Media[]
  onUpload: (variables: {
    file: File
    onProgress?: (percent: number) => void
  }) => Promise<unknown>
  onDelete: (id: string) => void
  canDelete: (id: string) => boolean
  isUploading: boolean
}

export function TaskDetailsAttachments({
  taskId,
  attachments = [],
  onUpload,
  onDelete,
  canDelete,
  isUploading,
}: TaskDetailsAttachmentsProps) {
  const handleUpload = async (
    file: File,
    onProgress: (progress: number) => void
  ) => {
    await onUpload({ file, onProgress })
  }

  return (
    <div className="space-y-4 border-t border-border/50 pt-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <HugeiconsIcon
            icon={AttachmentIcon}
            size={14}
            className="text-muted-foreground/70"
          />{" "}
          Attachments
        </label>
      </div>

      <FileUpload multiple onUpload={handleUpload} className="w-full" />

      {attachments.filter((a) => !a.parentMediaId).length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {attachments
            .filter((a) => !a.parentMediaId)
            .map((attachment) => (
              <AttachmentItem
                key={attachment.id}
                taskId={taskId}
                attachment={attachment}
                allAttachments={attachments}
                onDelete={onDelete}
                canDelete={canDelete(attachment.id)}
              />
            ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No attachments yet. Drag and drop files above to upload.
        </div>
      )}
    </div>
  )
}
