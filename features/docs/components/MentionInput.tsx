"use client"

import { useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  } catch {
    return avatarUrl
  }
}

interface MemberUser {
  id: string
  name: string
  email: string
  image: string | null
}

interface ProjectMemberResponse {
  id: string
  userId: string
  user: MemberUser
}

interface MentionInputProps {
  projectId: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => void
  className?: string
  autoFocus?: boolean
  textarea?: boolean
}

export function MentionInput({
  projectId,
  value,
  onChange,
  placeholder = "",
  onKeyDown,
  className = "",
  autoFocus = false,
  textarea = false,
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  // Fetch project members
  const { data: projectMembers = [] } = useQuery<ProjectMemberResponse[]>({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/projects/${projectId}/members`)
      return response.data.data
    },
    enabled: !!projectId,
  })

  // Filter members based on @searchQuery
  const filteredMembers = searchQuery
    ? projectMembers.filter((m) =>
        m.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projectMembers

  const checkMentionTrigger = (text: string, position: number) => {
    const textBeforeCursor = text.slice(0, position)
    const matches = textBeforeCursor.match(/@(\w*)$/)

    if (matches) {
      setShowDropdown(true)
      setSearchQuery(matches[1])
      setHighlightedIndex(0)
    } else {
      setShowDropdown(false)
      setSearchQuery("")
    }
  }

  const handleSelectMember = (memberName: string) => {
    const textBeforeCursor = value.slice(0, cursorPosition)
    const textAfterCursor = value.slice(cursorPosition)

    // Replace the @part with the member name
    const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${memberName} `)
    const newValue = newTextBefore + textAfterCursor

    onChange(newValue)
    setShowDropdown(false)
    setSearchQuery("")

    // Refocus input and set cursor at end of mention
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const newCursorPos = newTextBefore.length
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 10)
  }

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (showDropdown && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % filteredMembers.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightedIndex(
          (prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length
        )
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        handleSelectMember(filteredMembers[highlightedIndex].user.name)
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setShowDropdown(false)
        return
      }
    }

    if (onKeyDown) {
      onKeyDown(e)
    }
  }

  const handleSelect = (
    e: React.SyntheticEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const position = e.currentTarget.selectionStart || 0
    setCursorPosition(position)
    checkMentionTrigger(value, position)
  }

  return (
    <div className="relative w-full">
      {textarea ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement | null>}
          value={value}
          onChange={(e) => {
            const position = e.target.selectionStart || 0
            onChange(e.target.value)
            setCursorPosition(position)
            checkMentionTrigger(e.target.value, position)
          }}
          onSelect={handleSelect}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`${className} focus-visible:outline-none`}
          rows={2}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement | null>}
          value={value}
          onChange={(e) => {
            const position = e.target.selectionStart || 0
            onChange(e.target.value)
            setCursorPosition(position)
            checkMentionTrigger(e.target.value, position)
          }}
          onSelect={handleSelect}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`${className} focus-visible:outline-none`}
        />
      )}

      {showDropdown && filteredMembers.length > 0 && (
        <div className="absolute right-0 left-0 z-50 mt-1 max-h-48 scrollbar-thin overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 shadow-lg ring-1 ring-black/5">
          {filteredMembers.map((member, index) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelectMember(member.user.name)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                index === highlightedIndex
                  ? "bg-primary/10 font-medium text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Avatar className="h-5 w-5 shrink-0">
                {resolveAvatarUrl(member.user.image) && (
                  <AvatarImage src={resolveAvatarUrl(member.user.image)} />
                )}
                <AvatarFallback className="text-[9px]">
                  {member.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-foreground">
                  {member.user.name}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {member.user.email}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
