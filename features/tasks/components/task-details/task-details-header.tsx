"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Task } from "@/types/models"
import {
  CircleCheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

interface TaskDetailsHeaderProps {
  task: Task
  isCompleted: boolean
  onTitleChange: (value: string) => void
  onTitleBlur: () => void
  workspaceSlug: string
  activeWorkspaceSlug?: string // for different slug contexts
  onToggleCompletion: () => void
}

export function TaskDetailsHeader({
  task,
  isCompleted,
  onTitleChange,
  onTitleBlur,
  workspaceSlug,
  onToggleCompletion,
}: TaskDetailsHeaderProps) {
  const copyTaskUrl = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    toast.success("Task link copied to clipboard")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between border-b border-border px-6 py-4 sm:border-none sm:px-0 sm:py-0">
        <div className="hidden sm:block">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Task Details
          </span>
        </div>
        {task && (
          <div className="flex items-center gap-2">
            <Button
              variant={isCompleted ? "ghost" : "outline-success"}
              size="sm"
              className="flex h-8 items-center gap-1.5 text-xs font-medium"
              onClick={() => onToggleCompletion()}
            >
              <HugeiconsIcon
                icon={CircleCheckIcon}
                className={cn(isCompleted && "fill-success/10 text-success")}
              />
              {isCompleted ? "Completed" : "Mark Complete"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={copyTaskUrl} className="text-xs">
                  <HugeiconsIcon
                    icon={CopyIcon}
                    className="mr-2 h-3.5 w-3.5 text-muted-foreground"
                  />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.open(`/${workspaceSlug}/tasks/${task.id}`, "_blank")
                  }}
                  className="text-xs"
                >
                  <HugeiconsIcon
                    icon={ExternalLinkIcon}
                    className="mr-2 h-3.5 w-3.5 text-muted-foreground"
                  />
                  Open Page
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="space-y-1.5 px-0.5">
        <Input
          value={task.title || ""}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          className="h-auto w-full rounded-lg border-transparent bg-transparent px-1.5 py-1 text-2xl font-bold tracking-tight text-foreground transition-all hover:bg-muted/20 focus:border-border/40 focus:bg-background focus:ring-0 focus:outline-none"
        />
        <div className="flex items-center gap-2 px-1.5 text-xs text-muted-foreground">
          <span>Task Key:</span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-foreground uppercase">
            {task.taskKey || task.id.substring(0, 8)}
          </span>
        </div>
      </div>
    </div>
  )
}
