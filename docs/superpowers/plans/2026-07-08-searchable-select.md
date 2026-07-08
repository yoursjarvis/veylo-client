# Searchable Select Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable search-enabled dropdown select component using `Popover` + `Command`, and use it in the Create New Objective modal for the Project and Epic selection.

**Architecture:** Create a new `SearchableSelect` component inside `components/ui/` styled identically to the default `SelectTrigger`. Use the same deferred focusing logic from the task dependencies drawer. Update `okrs-dashboard.tsx` to use this new component instead of the native-feel non-searchable `Select`.

**Tech Stack:** React, Tailwind CSS, Base UI Popover, cmdk (Command), Hugeicons.

## Global Constraints
- Do not commit any changes on Git (do not run `git commit`, `git add`, etc.).
- Never use `any`, `@ts-ignore`, or `@ts-expect-error`.
- For icons, always use Hugeicons. Only use Lucide react icons if a suitable Hugeicon is not present.
- Support both light and dark modes.

---

### Task 1: Create Reusable `SearchableSelect` Component

**Files:**
- Create: `components/ui/searchable-select.tsx`

**Interfaces:**
- Produces: `SearchableSelect` function component

- [ ] **Step 1: Create searchable-select.tsx**

Create the [searchable-select.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/components/ui/searchable-select.tsx) file with the following content:

```tsx
"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons"
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

export interface SearchableSelectOption {
  value: string
  label: string
}

export interface SearchableSelectProps {
  value: string | null
  onValueChange: (value: string | null) => void
  options: SearchableSelectOption[]
  placeholder: string
  searchPlaceholder?: string
  emptyText?: string
  clearable?: boolean
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
  clearable = false,
  disabled = false,
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [isRendered, setIsRendered] = React.useState(false)

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (open) {
      timer = setTimeout(() => {
        setIsRendered(true)
      }, 50)
    } else {
      timer = setTimeout(() => {
        setIsRendered(false)
      }, 0)
    }
    return () => clearTimeout(timer)
  }, [open])

  React.useEffect(() => {
    if (isRendered) {
      const input = document.querySelector<HTMLInputElement>(
        'input[data-slot="command-input"]'
      )
      if (input) {
        input.focus({ preventScroll: true })
      }
    }
  }, [isRendered])

  const selectedOption = options.find((opt) => opt.value === value)

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onValueChange(null)
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            !selectedOption && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {clearable && selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm p-0.5 opacity-50 hover:opacity-100 transition-opacity focus:outline-none"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  className="size-3.5 text-muted-foreground"
                />
              </button>
            )}
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              className="size-4 text-muted-foreground"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--anchor-width)] min-w-36 p-0"
          align="start"
          initialFocus={() => false}
        >
          {isRendered && (
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      data-checked={value === opt.value}
                      onSelect={() => {
                        onValueChange(opt.value)
                        setOpen(false)
                      }}
                    >
                      <span className="truncate">{opt.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

- [ ] **Step 2: Verify compilation and TypeScript validity**

Run: `npm run typecheck`
Expected: Passes with no typescript compilation errors.

---

### Task 2: Integrate `SearchableSelect` Component in `OkrsDashboard`

**Files:**
- Modify: `features/okrs/components/okrs-dashboard.tsx`

**Interfaces:**
- Consumes: `SearchableSelect` from `@/components/ui/searchable-select`

- [ ] **Step 1: Modify okrs-dashboard.tsx**

Replace the Select components for Project and Epic inside the Create Objective dialog in [okrs-dashboard.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/okrs/components/okrs-dashboard.tsx) with the new `SearchableSelect`.

Update imports in `okrs-dashboard.tsx`:
```tsx
import { SearchableSelect } from "@/components/ui/searchable-select"
```

Prepare options arrays before the Dialog content rendering:
```tsx
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.title }))
  const epicOptions = epics.map((e: Epic) => ({ value: e.id, label: e.title }))
```

Replace the Select sections:
```tsx
              <div className="mt-2 space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Link Project & Epic
                </h4>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <SearchableSelect
                    value={selectedProjectId}
                    onValueChange={(val) => {
                      setSelectedProjectId(val)
                      setSelectedEpicId(null)
                    }}
                    options={projectOptions}
                    placeholder="Select a project"
                  />
                </div>

                {selectedProjectId && (
                  <div className="space-y-2">
                    <Label>Epic (Optional)</Label>
                    <SearchableSelect
                      value={selectedEpicId}
                      onValueChange={(val) => setSelectedEpicId(val)}
                      options={epicOptions}
                      placeholder="Select an epic"
                      clearable
                    />
                  </div>
                )}
              </div>
```

- [ ] **Step 2: Verify types and linting**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS (no build errors)
