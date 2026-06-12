"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon, SmileIcon, Briefcase02Icon, Camera01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"

const COMMON_EMOJIS = ["🚀", "💡", "💼", "🎨", "📈", "🔥", "🌍", "💻", "📚", "✨", "🎯", "⚡", "🧩", "🛠️"]

interface IconPickerProps {
  value?: string | null
  onChange: (value: string | File) => void
  disabled?: boolean
}

export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"emoji" | "image">("emoji")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file)
      setOpen(false)
    }
  }

  const renderCurrentIcon = () => {
    if (!value) return <HugeiconsIcon icon={Briefcase02Icon} className="h-6 w-6 text-muted-foreground" />
    if (value.startsWith("http") || value.startsWith("/") || value.startsWith("blob:")) {
      return <img src={value} alt="Icon" className="h-full w-full rounded-md object-cover" />
    }
    return <span className="text-xl leading-none">{value}</span>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {renderCurrentIcon()}
          </button>
        }
      />
      <PopoverContent className="w-64 p-2" align="start">
        <div className="flex gap-1 border-b pb-2 mb-2">
          <Button
            type="button"
            variant={tab === "emoji" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setTab("emoji")}
          >
            <HugeiconsIcon icon={SmileIcon} className="mr-2 h-4 w-4" />
            Emoji
          </Button>
          <Button
            type="button"
            variant={tab === "image" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setTab("image")}
          >
            <HugeiconsIcon icon={Image01Icon} className="mr-2 h-4 w-4" />
            Image
          </Button>
        </div>

        {tab === "emoji" && (
          <div className="grid grid-cols-5 gap-2">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji)
                  setOpen(false)
                }}
                className="flex h-8 items-center justify-center rounded-md hover:bg-accent text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {tab === "image" && (
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-6 hover:bg-muted/50">
              <HugeiconsIcon icon={Camera01Icon} className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Upload image</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
