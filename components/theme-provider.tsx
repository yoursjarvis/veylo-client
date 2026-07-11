"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"

type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
)

const STORAGE_KEY = "veylo-theme"

function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme()

  const toggleTheme = React.useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
  }, [setTheme, resolvedTheme])

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme: (theme as Theme) || "system",
      resolvedTheme: (resolvedTheme as "light" | "dark") || "light",
      setTheme: (nextTheme: Theme) => setTheme(nextTheme),
      toggleTheme,
    }),
    [theme, setTheme, resolvedTheme, toggleTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={STORAGE_KEY}
    >
      <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
    </NextThemesProvider>
  )
}

function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}

export { ThemeProvider, useTheme }
