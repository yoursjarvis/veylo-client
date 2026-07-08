"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export type MultiSearchableSelectOption = {
  value: string
  label: string
}

export type MultiSearchableSelectProps = {
  value: string[]
  onValueChange: (value: string[]) => void
  options: MultiSearchableSelectOption[]
  placeholder: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

export function MultiSearchableSelect({
  value = [],
  onValueChange,
  options,
  placeholder,
  searchPlaceholder = "Search…",
  emptyText = "No options found.",
  disabled = false,
  className,
  triggerClassName,
}: MultiSearchableSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOptions = options.filter((opt) => value.includes(opt.value))

  const handleToggle = (optValue: string) => {
    const newValue = value.includes(optValue)
      ? value.filter((val) => val !== optValue)
      : [...value, optValue]
    onValueChange(newValue)
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "flex min-h-9 h-auto w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-1.5 pr-8 pl-2.5 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            selectedOptions.length === 0 && "text-muted-foreground",
            triggerClassName
          )}
        >
          <div className="flex flex-wrap gap-1 max-w-[90%] truncate">
            {selectedOptions.length === 0 ? (
              <span className="truncate">{placeholder}</span>
            ) : selectedOptions.length <= 2 ? (
              selectedOptions.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="text-[10px] h-5 px-1.5 font-medium shrink-0"
                >
                  {opt.label}
                </Badge>
              ))
            ) : (
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-1.5 font-medium shrink-0"
              >
                {selectedOptions.length} Selected
              </Badge>
            )}
          </div>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center">
            <span className="text-[10px] text-muted-foreground">▼</span>
          </span>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--anchor-width)] min-w-36 p-0 z-50 bg-card border border-border"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isChecked = value.includes(opt.value)
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      data-checked={isChecked}
                      onSelect={() => handleToggle(opt.value)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate pr-4">{opt.label}</span>
                      {isChecked && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
