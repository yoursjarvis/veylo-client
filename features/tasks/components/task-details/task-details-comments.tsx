"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { HugeiconsIcon } from "@hugeicons/react"
import { SmilePlusIcon, Message01Icon } from "@hugeicons/core-free-icons"
import { Comment, CommentReaction, User, ProjectMember } from "@/types/models"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"
import { useReactionUsers } from "../../hooks/use-tasks"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface TaskDetailsCommentsProps {
  comments: Comment[]
  currentUser: { user?: User | null } | null | undefined
  projectMembers: ProjectMember[]
  newComment: string
  setNewComment: (val: string) => void
  handleAddComment: (e?: React.FormEvent | React.MouseEvent) => void
  replyingToCommentId: string | null
  setReplyingToCommentId: (id: string | null) => void
  replyContent: string
  setReplyContent: (val: string) => void
  handleAddReply: (parentId: string) => void
  editingCommentId: string | null
  setEditingCommentId: (id: string | null) => void
  editingContent: string
  setEditingContent: (val: string) => void
  handleUpdateComment: (commentId: string) => void
  deleteCommentMutation: { mutate: (id: string) => void }
  toggleReactionMutation: {
    mutate: (args: { commentId: string; emoji: string }) => void
    isPending: boolean
    variables?: { emoji: string } | null
  }
}

const ReactionChip = ({
  commentId,
  emoji,
  count,
  hasReacted,
  onToggle,
}: {
  commentId: string
  emoji: string
  count: number
  hasReacted: boolean
  onToggle: (emoji: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { data: users, isLoading, isFetching, isError } = useReactionUsers(commentId, emoji, isOpen)

  return (
    <TooltipProvider delay={300}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger
          onClick={() => onToggle(emoji)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
            hasReacted
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border/50 bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <span className="text-xs">{emoji}</span>
          <span className="text-xs">{count}</span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="p-0 border-none shadow-none bg-transparent"
        >
          <Card className="w-auto min-w-[200px] border-border bg-popover shadow-md">
            <div className="space-y-3 p-3">
              <p className="text-sm text-muted-foreground">
                Reacted with {emoji}
              </p>

              <Separator />

              <div className="space-y-2">
                {isLoading || isFetching ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))
                ) : isError ? (
                  <div className="text-sm text-destructive italic">
                    Failed to load users
                  </div>
                ) : users && users.length > 0 ? (
                  users.map((user: User) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No users found
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const CommentNode = ({
  comment,
  currentUser,
  projectMembers,
  replyingToCommentId,
  setReplyingToCommentId,
  replyContent,
  setReplyContent,
  handleAddReply,
  editingCommentId,
  setEditingCommentId,
  editingContent,
  setEditingContent,
  handleUpdateComment,
  deleteCommentMutation,
  toggleReactionMutation,
}: {
  comment: Comment
  currentUser: { user?: User | null } | null | undefined
  projectMembers: ProjectMember[]
  replyingToCommentId: string | null
  setReplyingToCommentId: (id: string | null) => void
  replyContent: string
  setReplyContent: (content: string) => void
  handleAddReply: (parentId: string) => void
  editingCommentId: string | null
  setEditingCommentId: (id: string | null) => void
  editingContent: string
  setEditingContent: (content: string) => void
  handleUpdateComment: (commentId: string) => void
  deleteCommentMutation: { mutate: (id: string) => void }
  toggleReactionMutation: {
    mutate: (args: { commentId: string; emoji: string }) => void
    isPending: boolean
    variables?: { emoji: string } | null
  }
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const { resolvedTheme, theme } = useTheme()
  const isDarkMode = resolvedTheme === "dark" || theme === "dark"

  const reactionGroups = (comment.reactions || []).reduce(
    (acc: Record<string, CommentReaction[]>, reaction: CommentReaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    },
    {}
  )

  const handleToggleReaction = (emoji: string) => {
    toggleReactionMutation.mutate({ commentId: comment.id, emoji })
    setShowEmojiPicker(false)
  }

  return (
    <div className="relative space-y-3">
      <div
        className="group relative flex gap-3 py-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <div className="absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 shadow-sm">
            {["❤️", "👍", "🙏", "👎"].map((emoji) => (
              <button
                key={emoji}
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-muted"
                onClick={() => handleToggleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
                <HugeiconsIcon icon={SmilePlusIcon} size={14} />
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="w-auto border-none bg-transparent p-0 shadow-none"
              >
                <EmojiPicker
                  onEmojiClick={(e) => handleToggleReaction(e.emoji)}
                  theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Avatar className="mt-0.5 h-8 w-8 shrink-0 border border-border">
          <AvatarImage src={comment.user?.image || ""} />
          <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
            {comment.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-bold text-foreground">
              {comment.user?.name}
              {comment.isEdited && (
                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground italic">
                  (edited)
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">
                {format(new Date(comment.createdAt), "MMM d, h:mm a")}
              </span>
            </div>
          </div>

          {editingCommentId === comment.id ? (
            <div className="mt-2 space-y-2">
              <RichTextEditor
                placeholder="Edit comment..."
                value={editingContent}
                onChange={setEditingContent}
                projectMembers={
                  projectMembers.filter((m) => m.user) as (ProjectMember & {
                    user: User
                  })[]
                }
                minHeight="80px"
                onSubmit={() => handleUpdateComment(comment.id)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-[10px]"
                  onClick={() => {
                    setEditingCommentId(null)
                    setEditingContent("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2.5 text-[10px]"
                  onClick={() => handleUpdateComment(comment.id)}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                className="ProseMirror mb-1.5 max-w-full overflow-hidden text-xs leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToCommentId(comment.id)
                    setReplyContent("")
                  }}
                  className="text-[10px] font-semibold text-muted-foreground transition-colors hover:text-primary"
                >
                  Reply
                </button>
                {comment.userId === currentUser?.user?.id && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(comment.id)
                        setEditingContent(comment.content)
                      }}
                      className="text-[10px] font-semibold text-muted-foreground transition-colors hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-[10px] font-semibold text-muted-foreground transition-colors hover:text-destructive"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {Object.keys(reactionGroups).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(reactionGroups).map(
                ([emoji, reactions]) => {
                  const hasReacted = reactions.some(
                    (r: CommentReaction) => r.userId === currentUser?.user?.id
                  )
                  return (
                    <ReactionChip
                      key={emoji}
                      commentId={comment.id}
                      emoji={emoji}
                      count={reactions.length}
                      hasReacted={hasReacted}
                      onToggle={handleToggleReaction}
                    />
                  )
                }
              )}
              <Popover>
                <PopoverTrigger className="flex h-6 w-6 items-center justify-center self-center rounded-full border border-border/50 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted">
                  <HugeiconsIcon icon={SmilePlusIcon} size={12} />
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  className="w-auto border-none bg-transparent p-0 shadow-none"
                >
                  <EmojiPicker
                    onEmojiClick={(e) => handleToggleReaction(e.emoji)}
                    theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {replyingToCommentId === comment.id && (
        <div className="ml-8 space-y-2 border-l-2 border-border/60 pl-3">
          <RichTextEditor
            placeholder={`Reply to ${comment.user?.name}...`}
            value={replyContent}
            onChange={setReplyContent}
            projectMembers={
              projectMembers.filter((m) => m.user) as (ProjectMember & {
                user: User
              })[]
            }
            minHeight="60px"
            onSubmit={() => handleAddReply(comment.id)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-[10px]"
              onClick={() => setReplyingToCommentId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-2.5 text-[10px]"
              onClick={() => handleAddReply(comment.id)}
            >
              Reply
            </Button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1 ml-10">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-[10px] font-bold text-primary transition-all hover:text-primary/80"
          >
            <HugeiconsIcon
              icon={Message01Icon}
              size={10}
              className={isCollapsed ? "" : "opacity-60"}
            />
            {isCollapsed
              ? `Show ${comment.replies.length} replies`
              : "Hide replies"}
          </button>
        </div>
      )}

      {!isCollapsed && comment.replies && comment.replies.length > 0 && (
        <div className="relative mt-2 ml-6 space-y-4 before:absolute before:top-0 before:bottom-[28px] before:left-0 before:w-[2px] before:bg-border/40">
          {comment.replies.map((reply: Comment) => (
            <div key={reply.id} className="relative pl-6">
              <div className="absolute top-0 left-0 h-[16px] w-[16px] rounded-bl-md border-b-[2px] border-l-[2px] border-border/40" />
              <CommentNode
                comment={reply}
                currentUser={currentUser}
                projectMembers={projectMembers}
                replyingToCommentId={replyingToCommentId}
                setReplyingToCommentId={setReplyingToCommentId}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                handleAddReply={handleAddReply}
                editingCommentId={editingCommentId}
                setEditingCommentId={setEditingCommentId}
                editingContent={editingContent}
                setEditingContent={setEditingContent}
                handleUpdateComment={handleUpdateComment}
                deleteCommentMutation={deleteCommentMutation}
                toggleReactionMutation={toggleReactionMutation}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const buildCommentThreads = (comments: Comment[]) => {
  if (!comments) return []
  const commentMap = new Map()
  const roots: Comment[] = []

  comments.forEach((c) => {
    commentMap.set(c.id, { ...c, replies: [] })
  })

  comments.forEach((c) => {
    const mapped = commentMap.get(c.id)
    if (c.parentId && commentMap.has(c.parentId)) {
      commentMap.get(c.parentId).replies.push(mapped)
    } else {
      roots.push(mapped)
    }
  })

  roots.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  roots.forEach((root) => {
    root.replies?.sort(
      (a: Comment, b: Comment) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  })

  return roots
}

export function TaskDetailsComments({
  comments,
  currentUser,
  projectMembers,
  newComment,
  setNewComment,
  handleAddComment,
  replyingToCommentId,
  setReplyingToCommentId,
  replyContent,
  setReplyContent,
  handleAddReply,
  editingCommentId,
  setEditingCommentId,
  editingContent,
  setEditingContent,
  handleUpdateComment,
  deleteCommentMutation,
  toggleReactionMutation,
}: TaskDetailsCommentsProps) {
  return (
    <div className="space-y-6 border-t border-border/60 pt-6">
      <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        <HugeiconsIcon icon={Message01Icon} size={14} className="text-muted-foreground/70" />{" "}
        Discussion / Comments
      </label>
      <div className="flex flex-col gap-2">
        <RichTextEditor
          placeholder="Write a comment... (Supports rich text, @mentions, /commands, paste images)"
          value={newComment}
          onChange={setNewComment}
          projectMembers={
            projectMembers.filter((m) => m.user) as (ProjectMember & {
              user: User
            })[]
          }
          minHeight="80px"
          onSubmit={handleAddComment}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => handleAddComment()}
            size="sm"
            className="px-3 text-xs"
          >
            Post Comment
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {buildCommentThreads(comments).map(
          (comment: Comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              projectMembers={projectMembers}
              replyingToCommentId={replyingToCommentId}
              setReplyingToCommentId={setReplyingToCommentId}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleAddReply={handleAddReply}
              editingCommentId={editingCommentId}
              setEditingCommentId={setEditingCommentId}
              editingContent={editingContent}
              setEditingContent={setEditingContent}
              handleUpdateComment={handleUpdateComment}
              deleteCommentMutation={deleteCommentMutation}
              toggleReactionMutation={toggleReactionMutation}
            />
          )
        )}
      </div>
    </div>
  )
}
