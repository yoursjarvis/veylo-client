"use client"

import { Moon, SunMedium } from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const [isHydrated, setIsHydrated] = useState(false)
  const isMountedRef = useRef(false)

  const handleButtonRef = useCallback((button: HTMLButtonElement | null) => {
    if (button && !isMountedRef.current) {
      isMountedRef.current = true
      setIsHydrated(true)
    }
  }, [])

  return (
    <Button
      ref={handleButtonRef}
      type="button"
      variant="outline"
      size="icon"
      className="fixed top-4 right-4 z-50 rounded-full shadow-sm backdrop-blur"
      onClick={toggleTheme}
      aria-label={
        isHydrated
          ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`
          : "Toggle theme"
      }
    >
      <SunMedium className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  )
}

export { ThemeToggle }
