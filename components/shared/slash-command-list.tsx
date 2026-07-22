import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react"

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export interface CommandItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  command: (editor: unknown, range: unknown) => void
}

interface SlashCommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export const SlashCommandList = forwardRef<
  SlashCommandListRef,
  SlashCommandListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
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
        No commands found
      </div>
    )
  }

  return (
    <div className="z-50 flex max-h-[300px] min-w-[220px] flex-col gap-0.5 overflow-hidden overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
      {props.items.map((item, index) => {
        const Icon = item.icon
        return (
          <button
            key={item.title}
            type="button"
            onClick={() => selectItem(index)}
            className={`flex w-full items-start gap-2.5 rounded px-2.5 py-1.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground ${
              index === selectedIndex
                ? "bg-accent font-semibold text-accent-foreground"
                : ""
            }`}
          >
            <div className="mt-0.5 flex-shrink-0 rounded bg-muted/60 p-1 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs font-medium text-foreground">
                {item.title}
              </span>
              <span className="block truncate text-2xs text-muted-foreground">
                {item.description}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
})

SlashCommandList.displayName = "SlashCommandList"
