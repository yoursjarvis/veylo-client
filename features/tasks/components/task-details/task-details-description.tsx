"use client"

import React from "react"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { HugeiconsIcon } from "@hugeicons/react"
import { File02Icon } from "@hugeicons/core-free-icons"

interface TaskDetailsDescriptionProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  projectMembers: any[]
}

export function TaskDetailsDescription({
  value,
  onChange,
  onBlur,
  projectMembers,
}: TaskDetailsDescriptionProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        <HugeiconsIcon icon={File02Icon} size={14} className="text-muted-foreground/70" />{" "}
        Description
      </label>
      <div className="px-0.5">
        <RichTextEditor
          placeholder="Describe this task... (Use @ to mention, / for blocks, paste images)"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          projectMembers={projectMembers}
          minHeight="150px"
        />
      </div>
    </div>
  )
}
