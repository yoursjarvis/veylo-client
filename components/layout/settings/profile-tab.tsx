"use client"

import { useCurrentUser } from "@/features/auth/hooks/use-auth"
import { authClient } from "@/lib/auth-client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { AvatarUpload } from "@/components/shared/avatar-upload"
import { useQueryClient } from "@tanstack/react-query"
import { authKeys } from "@/features/auth/hooks/use-auth"
import { useForm } from "@tanstack/react-form"

import { SearchableSelect } from "@/components/ui/searchable-select"

// Standard timezones from Intl.supportedValuesOf('timeZone') if available, or list of common ones
const TIMEZONE_OPTIONS = (
  typeof Intl !== "undefined" && "supportedValuesOf" in Intl
    ? Intl.supportedValuesOf("timeZone")
    : [
        "UTC",
        "America/New_York",
        "America/Los_Angeles",
        "America/Chicago",
        "Europe/London",
        "Europe/Paris",
        "Asia/Tokyo",
        "Asia/Kolkata",
        "Asia/Shanghai",
        "Australia/Sydney",
      ]
).map((tz) => ({ value: tz, label: tz }))

const DATE_TIME_FORMAT_OPTIONS = [
  // ── ISO / Technical ─────────────────────────────────────────
  { value: "yyyy-MM-dd HH:mm:ss", label: "2026-07-22 15:30:45  (YYYY-MM-DD HH:mm:ss)" },
  { value: "yyyy-MM-dd HH:mm",    label: "2026-07-22 15:30      (YYYY-MM-DD HH:mm)" },
  { value: "yyyy-MM-dd",          label: "2026-07-22            (YYYY-MM-DD)" },

  // ── US style (MM/DD/YYYY) ────────────────────────────────────
  { value: "MM/dd/yyyy hh:mm a",  label: "07/22/2026 03:30 PM  (MM/DD/YYYY hh:mm A)" },
  { value: "MM/dd/yyyy HH:mm",    label: "07/22/2026 15:30     (MM/DD/YYYY HH:mm)" },
  { value: "MM/dd/yyyy",          label: "07/22/2026            (MM/DD/YYYY)" },

  // ── European style (DD/MM/YYYY) ──────────────────────────────
  { value: "dd/MM/yyyy HH:mm",    label: "22/07/2026 15:30     (DD/MM/YYYY HH:mm)" },
  { value: "dd/MM/yyyy hh:mm a",  label: "22/07/2026 03:30 PM  (DD/MM/YYYY hh:mm A)" },
  { value: "dd/MM/yyyy",          label: "22/07/2026            (DD/MM/YYYY)" },

  // ── Dot-separated (DD.MM.YYYY) ───────────────────────────────
  { value: "dd.MM.yyyy HH:mm",    label: "22.07.2026 15:30     (DD.MM.YYYY HH:mm)" },
  { value: "dd.MM.yyyy",          label: "22.07.2026            (DD.MM.YYYY)" },

  // ── Long / Human-readable ────────────────────────────────────
  { value: "PPP hh:mm a",         label: "July 22, 2026 03:30 PM  (Month DD, YYYY hh:mm A)" },
  { value: "PPP HH:mm",           label: "July 22, 2026 15:30     (Month DD, YYYY HH:mm)" },
  { value: "PPP",                  label: "July 22, 2026            (Month DD, YYYY)" },
  { value: "MMMM d, yyyy h:mm a", label: "July 22, 2026 3:30 PM  (Month D, YYYY h:mm A)" },
  { value: "d MMM yyyy, HH:mm",   label: "22 Jul 2026, 15:30    (D Mon YYYY, HH:mm)" },
  { value: "d MMM yyyy",          label: "22 Jul 2026            (D Mon YYYY)" },

  // ── 12-hour with seconds ─────────────────────────────────────
  { value: "MM/dd/yyyy hh:mm:ss a", label: "07/22/2026 03:30:45 PM  (MM/DD/YYYY hh:mm:ss A)" },
  { value: "dd/MM/yyyy HH:mm:ss",   label: "22/07/2026 15:30:45     (DD/MM/YYYY HH:mm:ss)" },
]


export function ProfileTab() {
  const { data: auth } = useCurrentUser()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})

  const user = auth?.user

  const form = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      timezone: user?.timezone || "UTC",
      dateTimeFormat: user?.dateTimeFormat || "yyyy-MM-dd HH:mm:ss",
    },
    onSubmit: async ({ value }) => {
      setLoading(true)
      setValidationErrors({})
      try {
        const { error } = await (
          authClient.updateUser as unknown as (data: Record<string, unknown>) => Promise<{
            error: { message?: string } | null
          }>
        )({
          name: `${value.firstName} ${value.lastName}`.trim(),
          timezone: value.timezone,
          dateTimeFormat: value.dateTimeFormat,
        })

        if (error) {
          toast.error(error.message || "Failed to update profile")
          return
        }

        // Update localStorage as well
        localStorage.setItem(
          "user-datetime-preferences",
          JSON.stringify({
            timezone: value.timezone,
            dateTimeFormat: value.dateTimeFormat,
          })
        )
        window.dispatchEvent(new Event("datetime-preferences-updated"))

        toast.success("Profile updated successfully")
        queryClient.invalidateQueries({ queryKey: authKeys.me() })
      } catch {
        toast.error("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    if (user) {
      form.setFieldValue("firstName", user.firstName || "")
      form.setFieldValue("lastName", user.lastName || "")
      form.setFieldValue("timezone", user.timezone || "UTC")
      form.setFieldValue("dateTimeFormat", user.dateTimeFormat || "yyyy-MM-dd HH:mm:ss")
    }
  }, [user, form])

  return (
    <div className="animate-in space-y-8 duration-300 fade-in slide-in-from-bottom-2">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your public profile and account details.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Label>Profile Picture</Label>
          <div className="flex items-center gap-6">
            <AvatarUpload
              initialUrl={user?.image}
              onUploadSuccess={() =>
                queryClient.invalidateQueries({ queryKey: authKeys.me() })
              }
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Your Avatar</p>
              <p className="text-xs text-muted-foreground">
                Click the avatar to upload a new one.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="max-w-md space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="firstName"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "First name is required"
                  return undefined
                },
              }}
            >
              {(field) => {
                const fieldErrors: string[] = []
                field.state.meta.errors.forEach((err) => {
                  if (err) fieldErrors.push(String(err))
                })
                if (validationErrors.firstName)
                  fieldErrors.push(validationErrors.firstName)
                const hasError =
                  field.state.meta.isTouched && !!fieldErrors.length
                return (
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        setValidationErrors((prev) => ({
                          ...prev,
                          firstName: "",
                        }))
                      }}
                      placeholder="John"
                      aria-invalid={hasError}
                    />
                    {hasError && (
                      <p className="mt-1 text-2xs font-medium text-destructive">
                        {fieldErrors.join(", ")}
                      </p>
                    )}
                  </div>
                )
              }}
            </form.Field>

            <form.Field
              name="lastName"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "Last name is required"
                  return undefined
                },
              }}
            >
              {(field) => {
                const fieldErrors: string[] = []
                field.state.meta.errors.forEach((err) => {
                  if (err) fieldErrors.push(String(err))
                })
                if (validationErrors.lastName)
                  fieldErrors.push(validationErrors.lastName)
                const hasError =
                  field.state.meta.isTouched && !!fieldErrors.length
                return (
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        setValidationErrors((prev) => ({
                          ...prev,
                          lastName: "",
                        }))
                      }}
                      placeholder="Doe"
                      aria-invalid={hasError}
                    />
                    {hasError && (
                      <p className="mt-1 text-2xs font-medium text-destructive">
                        {fieldErrors.join(", ")}
                      </p>
                    )}
                  </div>
                )
              }}
            </form.Field>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">
              Your email address is managed through your account settings.
            </p>
          </div>

          <form.Field name="timezone">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <SearchableSelect
                  value={field.state.value}
                  onValueChange={(val) => field.handleChange(val || "UTC")}
                  options={TIMEZONE_OPTIONS}
                  placeholder="Select timezone"
                  searchPlaceholder="Search timezones..."
                />
              </div>
            )}
          </form.Field>

          <form.Field name="dateTimeFormat">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="dateTimeFormat">Date & Time Format</Label>
                <SearchableSelect
                  value={field.state.value}
                  onValueChange={(val) => field.handleChange(val || "yyyy-MM-dd HH:mm:ss")}
                  options={DATE_TIME_FORMAT_OPTIONS}
                  placeholder="Select date time format"
                  searchPlaceholder="Search formats..."
                />
              </div>
            )}
          </form.Field>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  )
}
