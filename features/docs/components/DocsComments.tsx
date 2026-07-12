"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Comment01Icon,
  Delete02Icon,
  RotateLeft01Icon,
  SentIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { DocComment, useDocs } from "../hooks/useDocs"

const resolveAvatarUrl = (
  avatarUrl: string | null | undefined
): string | undefined => {
  if (!avatarUrl) return undefined
  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://") ||
    avatarUrl.startsWith("blob:")
  ) {
    return avatarUrl
  }
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api.veylo.com:4000/api/v1"
    const origin = new URL(apiUrl).origin
    const relativePath = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`
    return `${origin}${relativePath}`
  } catch (error) {
    return avatarUrl
  }
}

interface DocsCommentsProps {
  projectId: string
  docId: string
  userId: string
  isWorkspaceAdmin: boolean
}

export function DocsComments({
  projectId,
  docId,
  userId,
  isWorkspaceAdmin,
}: DocsCommentsProps) {
  const { useDocCommentsQuery, createComment, updateComment, deleteComment } =
    useDocs(projectId)

  const { data: comments = [], isLoading } = useDocCommentsQuery(docId)
  const [newCommentText, setNewCommentText] = useState("")

  const handlePostComment = async () => {
    if (!newCommentText.trim()) return
    await createComment({ docId, content: newCommentText })
    setNewCommentText("")
  }

  const handleToggleResolve = async (comment: DocComment) => {
    await updateComment({
      commentId: comment.id,
      data: { resolved: !comment.resolved },
    })
  }

  const handleDeleteComment = async (comment: DocComment) => {
    if (confirm("Delete this comment permanently?")) {
      await deleteComment({ commentId: comment.id, docId })
    }
  }

  const activeComments = comments.filter((c) => !c.resolved)
  const resolvedComments = comments.filter((c) => c.resolved)

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-card/40 select-none">
      <div className="flex shrink-0 items-center gap-2 border-b border-border p-4">
        <HugeiconsIcon
          icon={Comment01Icon}
          size={14}
          className="text-primary"
        />
        <span className="text-sm font-semibold tracking-tight text-foreground/90">
          Page Comments
        </span>
      </div>

      <ScrollArea className="flex-1 min-h-0 p-3">
        {isLoading ? (
          <div className="space-y-3 p-1">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded bg-muted/40"
              />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-xs text-muted-foreground">
            <HugeiconsIcon
              icon={Comment01Icon}
              size={32}
              className="text-muted-foreground/30"
            />
            <span>No comments yet. Start the conversation!</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Comments */}
            {activeComments.length > 0 && (
              <div className="space-y-2">
                <span className="text-2xs font-bold tracking-wider text-muted-foreground uppercase">
                  Active ({activeComments.length})
                </span>
                <div className="space-y-2.5">
                  {activeComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="group flex flex-col gap-2 rounded-lg border border-border/50 bg-background/35 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar className="h-6 w-6 shrink-0">
                            {resolveAvatarUrl(comment.user.image) && (
                              <AvatarImage
                                src={resolveAvatarUrl(comment.user.image)}
                              />
                            )}
                            <AvatarFallback className="text-[10px]">
                              {comment.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-xs font-semibold text-foreground/80">
                            {comment.user.name}
                          </span>
                        </div>
                        <span className="text-3xs whitespace-nowrap text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {comment.content}
                      </p>

                      <div className="flex items-center justify-end gap-1.5 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleToggleResolve(comment)}
                          className="h-6 gap-1 px-1.5 text-2xs font-semibold text-success hover:bg-success/10"
                        >
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            strokeWidth={2}
                            size={14}
                          />{" "}
                          Resolve
                        </Button>
                        {(comment.userId === userId || isWorkspaceAdmin) && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDeleteComment(comment)}
                            className="h-6 gap-1 px-1.5 text-2xs font-semibold text-destructive hover:bg-destructive/10"
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              strokeWidth={2}
                              size={14}
                            />{" "}
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Comments */}
            {resolvedComments.length > 0 && (
              <div className="space-y-2 border-t border-border/50 pt-2">
                <span className="text-2xs font-bold tracking-wider text-muted-foreground uppercase">
                  Resolved ({resolvedComments.length})
                </span>
                <div className="space-y-2.5 opacity-65">
                  {resolvedComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="group flex flex-col gap-2 rounded-lg border border-border/30 bg-muted/20 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-xs font-medium text-muted-foreground line-through">
                            {comment.user.name}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-through">
                        {comment.content}
                      </p>
                      <div className="flex items-center justify-end gap-1 pt-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleToggleResolve(comment)}
                          className="h-6 gap-1 px-1.5 text-2xs font-semibold text-muted-foreground hover:bg-muted"
                        >
                          <HugeiconsIcon
                            icon={RotateLeft01Icon}
                            strokeWidth={2}
                            size={14}
                          />{" "}
                          Reopen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input box */}
      <div className="flex shrink-0 gap-2 border-t border-border bg-card/65 p-3">
        <Input
          placeholder="Add a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handlePostComment()
            }
          }}
          className="h-9 rounded-lg border-border bg-background/50 text-xs focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary"
        />
        <Button
          size="icon"
          onClick={handlePostComment}
          disabled={!newCommentText.trim()}
          className="h-9 w-9 shrink-0 rounded-lg"
        >
          <HugeiconsIcon icon={SentIcon} strokeWidth={2} size={14} />
        </Button>
      </div>
    </div>
  )
}
