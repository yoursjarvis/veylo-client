"use client"

import * as React from "react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { InputGroupAddon } from "@/components/ui/input-group"

interface ComboboxSelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface ComboboxSelectProps {
  value: string | null
  onValueChange: (value: string | null) => void
  options: ComboboxSelectOption[]
  placeholder: string
  emptyText?: string
  className?: string
  isSearchable?: boolean
}

export function ComboboxSelect({
  value,
  onValueChange,
  options,
  placeholder,
  emptyText = "No options found",
  className,
  isSearchable = true,
}: ComboboxSelectProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    queueMicrotask(() => {
      const selectedOption = options.find((opt) => opt.value === value)
      if (selectedOption) {
        setInputValue(selectedOption.label)
      } else {
        setInputValue("")
      }
    })
  }, [value, options])

  const filteredOptions = options.filter((opt) => {
    // If input value is exactly equal to the selected option label, show all options
    const selectedOption = options.find((o) => o.value === value)
    if (selectedOption && selectedOption.label === inputValue) {
      return true
    }
    return opt.label.toLowerCase().includes(inputValue.toLowerCase())
  })

  const selectedOption = options.find((opt) => opt.value === value)
  const comboboxValue = selectedOption
    ? { value: selectedOption.value, label: selectedOption.label }
    : null

  const ComboboxComponent = Combobox as React.ElementType

  return (
    <ComboboxComponent
      value={comboboxValue}
      onValueChange={(val: { value?: string } | null) => {
        onValueChange(val?.value || null)
      }}
      inputValue={inputValue}
      onInputValueChange={(newVal: string) => {
        if (isSearchable) {
          setInputValue(newVal)
        }
      }}
      open={open}
      onOpenChange={(isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
          const selectedOption = options.find((opt) => opt.value === value)
          if (selectedOption) {
            setInputValue(selectedOption.label)
          } else {
            setInputValue("")
          }
        }
      }}
      isItemEqualToValue={(a: { value?: string } | null, b: { value?: string } | null) => a?.value === b?.value}
      getValueText={(val: { label?: string } | null) => val?.label || ""}
    >
      <div className="relative w-full">
        <ComboboxInput
          className={cn(
            "h-9 w-full text-xs",
            !isSearchable && "cursor-pointer",
            className
          )}
          placeholder={placeholder}
          readOnly={!isSearchable}
        >
          {selectedOption?.icon && (
            <InputGroupAddon align="inline-start" className="pl-2.5">
              {selectedOption.icon}
            </InputGroupAddon>
          )}
        </ComboboxInput>
      </div>
      <ComboboxContent>
        <ComboboxList className="p-1">
          {filteredOptions.map((opt) => (
            <ComboboxItem
              key={opt.value}
              value={{ value: opt.value, label: opt.label }}
              className="text-xs"
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span className="truncate">{opt.label}</span>
            </ComboboxItem>
          ))}
          {filteredOptions.length === 0 && (
            <ComboboxEmpty className="p-2 text-center text-xs text-muted-foreground">
              {emptyText}
            </ComboboxEmpty>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxComponent>
  )
}
