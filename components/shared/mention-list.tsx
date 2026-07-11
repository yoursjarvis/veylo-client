import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface MentionItem {
  user: {
    id: string
    name?: string
    image?: string
    email?: string
  }
}

interface MentionListProps {
  items: MentionItem[]
  command: (item: {
    id: string
    label?: string
    avatar?: string
    email?: string
  }) => void
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
      const item = props.items[index]
      if (item) {
        props.command({
          id: item.user.id,
          label: item.user.name,
          avatar: item.user.image || undefined,
          email: item.user.email || undefined,
        })
      }
    }

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length
      )
    }

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
      selectItem(selectedIndex)
    }

    useEffect(() => {
      setSelectedIndex(0)
    }, [props.items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          upHandler()
          return true
        }
        if (event.key === "ArrowDown") {
          downHandler()
          return true
        }
        if (event.key === "Enter") {
          enterHandler()
          return true
        }
        return false
      },
    }))

    if (props.items.length === 0) {
      return (
        <div className="rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-md">
          No members found
        </div>
      )
    }

    return (
      <div className="z-50 flex max-h-62.5 min-w-50 flex-col gap-0.5 overflow-hidden overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
        {props.items.map((item, index) => (
          <button
            key={item.user.id}
            type="button"
            onClick={() => selectItem(index)}
            className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground ${
              index === selectedIndex
                ? "bg-accent font-semibold text-accent-foreground"
                : ""
            }`}
          >
            <Avatar className="h-5 w-5 shrink-0 border border-border">
              <AvatarImage src={item.user.image || ""} />
              <AvatarFallback className="bg-muted text-2xs text-foreground">
                {item.user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{item.user.name}</span>
          </button>
        ))}
      </div>
    )
  }
)

MentionList.displayName = "MentionList"
