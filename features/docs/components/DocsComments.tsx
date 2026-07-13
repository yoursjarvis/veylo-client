"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Delete02Icon,
  RotateLeft01Icon,
  Tick02Icon,
  SmilePlusIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect, useRef, useMemo } from "react"
import { useQueryState } from "nuqs"
import { DocComment, DocCommentReaction, useDocs } from "../hooks/useDocs"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { useTheme } from "next-themes"
import { MentionInput } from "./MentionInput"
import { Node, Mark } from "@tiptap/pm/model"
import { Transaction } from "@tiptap/pm/state"

declare global {
  interface Window {
    activeTiptapEditor?: import("@tiptap/core").Editor | null
  }
}

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
    const relativePath = avatarUrl.startsWith("/")
      ? avatarUrl
      : `/${avatarUrl}`
    return `${origin}${relativePath}`
  } catch {
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
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  const {
    useDocCommentsQuery,
    createComment,
    updateComment,
    deleteComment,
    toggleReaction,
  } = useDocs(projectId)

  const { data: comments = [], isLoading } = useDocCommentsQuery(docId)
  const [commentId, setCommentId] = useQueryState("commentId")
  const containerRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Record<string, number>>({})
  const [replyText, setReplyText] = useState("")

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  const activeComments = useMemo(
    () => comments.filter((c) => !c.resolved),
    [comments]
  )
  const resolvedComments = useMemo(
    () => comments.filter((c) => c.resolved),
    [comments]
  )

  // Recalculate heights of spans and comment cards in real-time
  useEffect(() => {
    const updatePositions = () => {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const rawPositions: Record<string, number> = {}

      activeComments.forEach((comment) => {
        const span = document.querySelector(
          `span[data-comment-id="${comment.id}"]`
        )
        if (span) {
          const spanRect = span.getBoundingClientRect()
          rawPositions[comment.id] = spanRect.top - containerRect.top
        } else {
          // If not found in the DOM (e.g. general comment), place at vertical 0
          rawPositions[comment.id] = 0
        }
      })

      // Get actual heights of cards from the DOM to prevent overlap
      const cardHeights: Record<string, number> = {}
      activeComments.forEach((comment) => {
        const element = document.getElementById(`comment-${comment.id}`)
        if (element) {
          cardHeights[comment.id] = element.offsetHeight + 16 // height + margin
        } else {
          cardHeights[comment.id] = 150 // fallback
        }
      })

      // Sort active comments by their raw vertical position
      const sorted = [...activeComments].sort(
        (a, b) => (rawPositions[a.id] || 0) - (rawPositions[b.id] || 0)
      )

      const adjusted: Record<string, number> = {}
      let currentTop = 0

      for (const comment of sorted) {
        const rawTop = rawPositions[comment.id] || 0
        const top = Math.max(rawTop, currentTop)
        adjusted[comment.id] = top
        currentTop = top + (cardHeights[comment.id] || 150)
      }

      setPositions((prev) => {
        const keys1 = Object.keys(prev)
        const keys2 = Object.keys(adjusted)
        if (keys1.length !== keys2.length) return adjusted
        for (const key of keys1) {
          if (prev[key] !== adjusted[key]) return adjusted
        }
        return prev
      })
    }

    updatePositions()
    const timer = setTimeout(updatePositions, 150)

    const observer = new MutationObserver(updatePositions)
    const editorElement = document.querySelector(".simple-editor-content")
    if (editorElement) {
      observer.observe(editorElement, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    window.addEventListener("resize", updatePositions)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener("resize", updatePositions)
    }
  }, [commentId, editingCommentId, activeComments])

  // Scroll active comment card into view if needed
  useEffect(() => {
    if (commentId && commentId !== "new" && comments.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`comment-${commentId}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [commentId, comments])

  const handleCommentCardClick = (comment: DocComment) => {
    setCommentId(comment.id)
    setReplyText("") // Reset reply field
    const editor = window.activeTiptapEditor
    if (editor) {
      let foundRange: { from: number; to: number } | null = null
      editor.state.doc.descendants((node: Node, pos: number) => {
        const commentMark = node.marks.find(
          (m: Mark) => m.type.name === "comment" && m.attrs.commentId === comment.id
        )
        if (commentMark) {
          if (!foundRange) {
            foundRange = { from: pos, to: pos + node.nodeSize }
          } else {
            foundRange.to = pos + node.nodeSize
          }
        }
        return true
      })

      if (foundRange) {
        editor.commands.setTextSelection(foundRange)
        editor.commands.focus()
      }
    }
  }

  const handleToggleResolve = async (comment: DocComment) => {
    if (comment.id === commentId) {
      setCommentId(null)
    }
    // Remove the comment mark from editor when resolving!
    const editor = window.activeTiptapEditor
    if (editor && !comment.resolved) {
      editor.commands.command(({ tr }: { tr: Transaction }) => {
        tr.doc.descendants((node: Node, pos: number) => {
          const commentMark = node.marks.find(
            (m: Mark) => m.type.name === "comment" && m.attrs.commentId === comment.id
          )
          if (commentMark) {
            tr.removeMark(
              pos,
              pos + node.nodeSize,
              editor.schema.marks.comment
            )
          }
          return true
        })
        return true
      })
    }

    await updateComment({
      commentId: comment.id,
      data: { resolved: !comment.resolved },
    })
  }

  const handleDeleteComment = async (comment: DocComment) => {
    if (confirm("Delete this comment permanently?")) {
      if (comment.id === commentId) {
        setCommentId(null)
      }
      // Remove comment mark from editor
      const editor = window.activeTiptapEditor
      if (editor) {
        editor.commands.command(({ tr }: { tr: Transaction }) => {
          tr.doc.descendants((node: Node, pos: number) => {
            const commentMark = node.marks.find(
              (m: Mark) =>
                m.type.name === "comment" && m.attrs.commentId === comment.id
            )
            if (commentMark) {
              tr.removeMark(
                pos,
                pos + node.nodeSize,
                editor.schema.marks.comment
              )
            }
            return true
          })
          return true
        })
      }

      await deleteComment({ commentId: comment.id, docId })
    }
  }

  const handlePostReply = async (parentId: string) => {
    if (!replyText.trim()) return
    try {
      await createComment({
        docId,
        content: replyText.trim(),
        parentId,
      })
      setReplyText("")
    } catch (err) {
      console.error("Failed to post reply:", err)
    }
  }

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    try {
      await toggleReaction({ commentId, emoji, docId })
    } catch (err) {
      console.error("Failed to toggle reaction:", err)
    }
  }

  const handleStartEdit = (item: DocComment) => {
    setEditingCommentId(item.id)
    setEditingContent(item.content)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingContent("")
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editingContent.trim()) return
    try {
      await updateComment({
        commentId,
        data: { content: editingContent.trim() },
      })
      setEditingCommentId(null)
      setEditingContent("")
    } catch (err) {
      console.error("Failed to save edit:", err)
    }
  }

  // Helper to group reactions by emoji
  const getGroupedReactions = (reactions: DocCommentReaction[] = []) => {
    const groups: Record<
      string,
      { emoji: string; count: number; userReacted: boolean }
    > = {}
    reactions.forEach((r) => {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { emoji: r.emoji, count: 0, userReacted: false }
      }
      groups[r.emoji].count++
      if (r.userId === userId) {
        groups[r.emoji].userReacted = true
      }
    })
    return Object.values(groups)
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-3 p-1">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded bg-muted/40"
          />
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ minHeight: "100%" }}
    >
      {/* Render Active Comments positioned vertically */}
      {activeComments.map((comment) => {
        const top = positions[comment.id] ?? 0
        const isActive = comment.id === commentId

        return (
          <div
            key={comment.id}
            id={`comment-${comment.id}`}
            style={{
              position: "absolute",
              top: `${top}px`,
              left: 0,
              right: 0,
              transition: "top 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            className={`group flex flex-col gap-2 rounded-xl border p-3 shadow-xs transition-all hover:shadow-md cursor-pointer ${
              isActive
                ? "border-primary bg-primary/5 ring-1 ring-primary/30 z-10"
                : "border-border/50 bg-card/50 hover:bg-card"
            }`}
            onClick={(e) => {
              if (
                (e.target as HTMLElement).closest("button") ||
                (e.target as HTMLElement).closest("input") ||
                (e.target as HTMLElement).closest("textarea")
              ) {
                return
              }
              handleCommentCardClick(comment)
            }}
          >
            {/* Header info */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-6 w-6 shrink-0">
                  {resolveAvatarUrl(comment.user.image) && (
                    <AvatarImage src={resolveAvatarUrl(comment.user.image)} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {comment.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs font-semibold text-foreground/80 flex items-center gap-1">
                  {comment.user.name}
                  {comment.isEdited && (
                    <span className="text-[9px] font-normal text-muted-foreground/60">(edited)</span>
                  )}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/80">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Comment content or Edit input */}
            {editingCommentId === comment.id ? (
              <div className="flex flex-col gap-1.5 pl-1" onClick={(e) => e.stopPropagation()}>
                <MentionInput
                  projectId={projectId}
                  placeholder="Edit comment..."
                  value={editingContent}
                  onChange={setEditingContent}
                  className="flex h-7 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-2xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSaveEdit(comment.id)
                    }
                  }}
                />
                <div className="flex gap-1 justify-end">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="h-6 px-1.5 text-3xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={!editingContent.trim()}
                    className="h-6 px-2.5 text-3xs font-semibold"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/90 pl-1">
                {comment.content}
              </p>
            )}

            {/* Reactions Display */}
            {!editingCommentId && comment.reactions && comment.reactions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1 pl-1">
                {getGroupedReactions(comment.reactions).map((group) => (
                  <button
                    key={group.emoji}
                    type="button"
                    onClick={() => handleToggleReaction(comment.id, group.emoji)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium transition-colors ${
                      group.userReacted
                        ? "border-primary bg-primary/10 text-primary-foreground"
                        : "border-border/60 bg-muted/20 hover:bg-muted text-foreground/80"
                    }`}
                  >
                    <span>{group.emoji}</span>
                    <span>{group.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Thread Replies List */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2 pl-3 border-l-2 border-border/40 space-y-2">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="group/reply flex flex-col gap-1 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="h-4.5 w-4.5 shrink-0">
                          {resolveAvatarUrl(reply.user.image) && (
                            <AvatarImage src={resolveAvatarUrl(reply.user.image)} />
                          )}
                          <AvatarFallback className="text-[8px]">
                            {reply.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground/80 truncate flex items-center gap-1">
                          {reply.user.name}
                          {reply.isEdited && (
                            <span className="text-[8px] font-normal text-muted-foreground/60">(edited)</span>
                          )}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground/80">
                        {formatDistanceToNow(new Date(reply.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Reply content or Edit input */}
                    {editingCommentId === reply.id ? (
                      <div className="pl-6 mt-1 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <MentionInput
                          projectId={projectId}
                          placeholder="Edit reply..."
                          value={editingContent}
                          onChange={setEditingContent}
                          className="flex h-7 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-2xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSaveEdit(reply.id)
                            }
                          }}
                        />
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-6 px-1.5 text-3xs font-semibold"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => handleSaveEdit(reply.id)}
                            disabled={!editingContent.trim()}
                            className="h-6 px-2.5 text-3xs font-semibold"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-foreground/90 leading-normal pl-6">
                          {reply.content}
                        </p>

                        {/* Reply reactions */}
                        {reply.reactions && reply.reactions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pl-6 mt-0.5">
                            {getGroupedReactions(reply.reactions).map((group) => (
                              <button
                                key={group.emoji}
                                type="button"
                                onClick={() => handleToggleReaction(reply.id, group.emoji)}
                                className={`flex items-center gap-0.5 px-1 py-0.2 rounded-full border text-[9px] font-medium transition-colors ${
                                  group.userReacted
                                    ? "border-primary bg-primary/10 text-primary-foreground"
                                    : "border-border/50 bg-card hover:bg-muted text-muted-foreground"
                                }`}
                              >
                                <span>{group.emoji}</span>
                                <span>{group.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Hover Actions for Reply */}
                        <div className="flex items-center gap-2 pl-6 mt-0.5 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                          {reply.userId === userId && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(reply)}
                              className="text-[9px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {(reply.userId === userId || isWorkspaceAdmin) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(reply)}
                              className="text-[9px] font-semibold text-destructive hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Bar (Resolve, Reactions popover, Edit, Delete) */}
            <div className="flex items-center justify-between gap-1.5 pt-1.5 mt-1 border-t border-border/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1">
                {/* Resolve button */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleToggleResolve(comment)}
                  className="h-6 gap-1 px-1.5 text-2xs font-semibold text-success hover:bg-success/10"
                >
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} size={13} />
                  Resolve
                </Button>

                {/* Emoji Picker Popover */}
                <Popover>
                  <PopoverTrigger className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                    <HugeiconsIcon icon={SmilePlusIcon} strokeWidth={2} size={13} />
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    className="w-auto border-none bg-transparent p-0 shadow-none z-50"
                  >
                    <EmojiPicker
                      onEmojiClick={(e) => handleToggleReaction(comment.id, e.emoji)}
                      theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Edit / Delete action triggers */}
              <div className="flex items-center gap-1">
                {comment.userId === userId && !editingCommentId && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleStartEdit(comment)}
                    className="h-6 px-1.5 text-2xs font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Edit
                  </Button>
                )}
                {(comment.userId === userId || isWorkspaceAdmin) && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDeleteComment(comment)}
                    className="h-6 gap-1 px-1.5 text-2xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} size={13} />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Thread Reply Input Form */}
            {isActive && !editingCommentId && (
              <div className="mt-2.5 pt-2.5 border-t border-border/30 flex gap-1.5">
                <MentionInput
                  projectId={projectId}
                  placeholder="Reply to this thread..."
                  value={replyText}
                  onChange={setReplyText}
                  className="flex h-7 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-2xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handlePostReply(comment.id)
                    }
                  }}
                />
                <Button
                  size="xs"
                  onClick={() => handlePostReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="h-7 text-2xs font-semibold px-2.5 shrink-0"
                >
                  Reply
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {/* Render Resolved Comments stacked at the bottom of the list */}
      {resolvedComments.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "-250px",
            left: 0,
            right: 0,
          }}
          className="space-y-2 opacity-50 hover:opacity-100 transition-opacity duration-200"
        >
          <div className="text-2xs font-bold tracking-wider text-muted-foreground uppercase">
            Resolved ({resolvedComments.length})
          </div>
          {resolvedComments.map((comment) => (
            <div
              key={comment.id}
              className="group flex flex-col gap-2 rounded-xl border border-border/30 bg-muted/20 p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-muted-foreground line-through">
                  {comment.user.name}
                </span>
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
      )}
    </div>
  )
}
