"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { Check, MessageSquare, RotateCcw, Send, Trash2 } from "lucide-react"
import { useState } from "react"
import { DocComment, useDocs } from "../hooks/useDocs"

const resolveAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
  if (!avatarUrl) return undefined
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://") || avatarUrl.startsWith("blob:")) {
    return avatarUrl
  }
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.veylo.com:4000/api/v1"
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
  const {
    useDocCommentsQuery,
    createComment,
    updateComment,
    deleteComment,
  } = useDocs(projectId)

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
    <div className="flex h-full w-72 flex-col border-l border-border bg-card/40 shrink-0 select-none">
      <div className="p-4 border-b border-border flex items-center gap-2 shrink-0">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold tracking-tight text-foreground/90">Page Comments</span>
      </div>

      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <div className="space-y-3 p-1">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded bg-muted/40" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
            <span>No comments yet. Start the conversation!</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Comments */}
            {activeComments.length > 0 && (
              <div className="space-y-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Active ({activeComments.length})</span>
                <div className="space-y-2.5">
                  {activeComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="group flex flex-col gap-2 rounded-lg border border-border/50 p-3 bg-background/35"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-6 w-6 shrink-0">
                            {resolveAvatarUrl(comment.user.image) && (
                              <AvatarImage src={resolveAvatarUrl(comment.user.image)} />
                            )}
                            <AvatarFallback className="text-[10px]">
                              {comment.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold truncate text-foreground/80">
                            {comment.user.name}
                          </span>
                        </div>
                        <span className="text-3xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      <div className="flex items-center justify-end gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleToggleResolve(comment)}
                          className="h-6 gap-1 px-1.5 text-2xs text-success hover:bg-success/10 font-semibold"
                        >
                          <Check className="h-3.5 w-3.5" /> Resolve
                        </Button>
                        {(comment.userId === userId || isWorkspaceAdmin) && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDeleteComment(comment)}
                            className="h-6 gap-1 px-1.5 text-2xs text-destructive hover:bg-destructive/10 font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
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
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Resolved ({resolvedComments.length})</span>
                <div className="space-y-2.5 opacity-65">
                  {resolvedComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="group flex flex-col gap-2 rounded-lg border border-border/30 p-2.5 bg-muted/20"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium truncate text-muted-foreground line-through">
                            {comment.user.name}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-through">
                        {comment.content}
                      </p>
                      <div className="flex items-center justify-end gap-1 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleToggleResolve(comment)}
                          className="h-6 gap-1 px-1.5 text-2xs text-muted-foreground hover:bg-muted font-semibold"
                        >
                          <RotateCcw className="h-3 w-3" /> Reopen
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
      <div className="p-3 border-t border-border bg-card/65 flex gap-2 shrink-0">
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
          className="h-9 text-xs rounded-lg border-border bg-background/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background"
        />
        <Button
          size="icon"
          onClick={handlePostComment}
          disabled={!newCommentText.trim()}
          className="h-9 w-9 shrink-0 rounded-lg"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
