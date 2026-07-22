"use client"

import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { useEffect, useState } from "react"

export interface DateTimePreference {
  timezone: string
  dateTimeFormat: string
}

const STORAGE_KEY = "user-datetime-preferences"

const DEFAULT_PREFERENCES: DateTimePreference = {
  timezone: "UTC",
  dateTimeFormat: "yyyy-MM-dd HH:mm:ss",
}

// Reusable date-time formatter based on user preference
export function formatDateTime(
  date: Date | string | number,
  overrideFormat?: string,
  overrideTimezone?: string
): string {
  if (!date) return ""
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""

  let preferences = DEFAULT_PREFERENCES

  // Read preferences from localStorage (client-side only)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        preferences = JSON.parse(stored)
      }
    } catch {
      // Ignore reading errors
    }
  }

  const timezone = overrideTimezone || preferences.timezone || "UTC"
  const formatPattern = overrideFormat || preferences.dateTimeFormat || "yyyy-MM-dd HH:mm:ss"

  try {
    // Extract date/time parts in the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })

    const parts = formatter.formatToParts(d)
    const p: Record<string, string> = {}
    parts.forEach((part) => { p[part.type] = part.value })

    const yearNum  = parseInt(p.year   || "1970", 10)
    const monthNum = parseInt(p.month  || "01",   10)
    const dayNum   = parseInt(p.day    || "01",   10)
    let   hourNum  = parseInt(p.hour   || "00",   10)
    // Intl sometimes returns "24" for midnight – normalize to 0
    if (hourNum === 24) hourNum = 0
    const minuteNum = parseInt(p.minute || "00", 10)
    const secondNum = parseInt(p.second || "00", 10)

    const MONTH_LONG  = ["January","February","March","April","May","June",
                         "July","August","September","October","November","December"]
    const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun",
                         "Jul","Aug","Sep","Oct","Nov","Dec"]

    const isPM   = hourNum >= 12
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12
    const ampm   = isPM ? "PM" : "AM"

    // Replace tokens in the pattern. Order matters – longer tokens first
    // so "HH" is matched before "H", "MM" before "M", etc.
    let result = formatPattern

    // Handle date-fns "PPP" shorthand → "July 22, 2026"
    result = result.replace(/PPP/g, `${MONTH_LONG[monthNum - 1]} ${dayNum}, ${yearNum}`)

    // Year
    result = result.replace(/yyyy/g, String(yearNum).padStart(4, "0"))
    result = result.replace(/yy/g,   String(yearNum).slice(-2))

    // Month name (must come before numeric MM/M replacements)
    result = result.replace(/MMMM/g, MONTH_LONG[monthNum - 1]  ?? "")
    result = result.replace(/MMM/g,  MONTH_SHORT[monthNum - 1] ?? "")

    // Numeric month & day (uppercase MM = month, lowercase mm = minutes)
    result = result.replace(/MM/g, String(monthNum).padStart(2, "0"))
    result = result.replace(/dd/g, String(dayNum).padStart(2, "0"))

    // 24-hour (HH before H)
    result = result.replace(/HH/g, String(hourNum).padStart(2, "0"))
    result = result.replace(/H/g,  String(hourNum))

    // 12-hour (hh before h)
    result = result.replace(/hh/g, String(hour12).padStart(2, "0"))
    result = result.replace(/h/g,  String(hour12))

    // Minutes (mm) and seconds (ss) – must come after MM/dd replaced
    result = result.replace(/mm/g, String(minuteNum).padStart(2, "0"))
    result = result.replace(/ss/g, String(secondNum).padStart(2, "0"))

    // AM/PM marker
    result = result.replace(/a/g, ampm)

    // Single-char month / day (without padding)
    result = result.replace(/M/g, String(monthNum))
    result = result.replace(/d/g, String(dayNum))

    return result
  } catch (error) {
    console.error("Error formatting date time:", error)
    return d.toUTCString()
  }
}


// Hook to synchronize preferences with db and local storage
export function useDateTimeInitializer() {
  const { data: auth } = useCurrentUser()
  const user = auth?.user

  useEffect(() => {
    if (user) {
      const timezone = user.timezone || "UTC"
      const dateTimeFormat = user.dateTimeFormat || "yyyy-MM-dd HH:mm:ss"

      const prefs: DateTimePreference = { timezone, dateTimeFormat }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      
      // Dispatch custom event to notify components if they listen
      window.dispatchEvent(new Event("datetime-preferences-updated"))
    }
  }, [user])
}

// Simple React helper hook to get current formatting preferences
export function useDateTimePreferences() {
  const [prefs, setPrefs] = useState<DateTimePreference>(DEFAULT_PREFERENCES)

  const loadPrefs = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPrefs(JSON.parse(stored))
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadPrefs()
    window.addEventListener("datetime-preferences-updated", loadPrefs)
    return () => {
      window.removeEventListener("datetime-preferences-updated", loadPrefs)
    }
  }, [])

  return prefs
}
