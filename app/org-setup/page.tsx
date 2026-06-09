"use client"

import { authClient } from "@/lib/auth-client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { DecorIcon } from "@/components/shared/decor-icon"
import { cn } from "@/lib/utils"

export default function OrgSetupPage() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkOrg() {
      const { data: orgs } = await authClient.organization.list()
      if (orgs && orgs.length > 0) {
        router.push("/dashboard")
      } else {
        setChecking(false)
      }
    }
    checkOrg()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await authClient.organization.create({
        name,
        slug,
      })
      if (error) {
        toast.error(error.message || "Failed to create organization")
        return
      }
      toast.success("Organization created successfully")
      router.push("/dashboard")
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8">
      <div className="absolute -inset-y-6 -left-px w-px bg-border" />
      <div className="absolute -inset-y-6 -right-px w-px bg-border" />
      <div className="absolute -inset-x-6 -top-px h-px bg-border" />
      <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
      <DecorIcon position="top-left" />
      <DecorIcon position="bottom-right" />

      <div
        className={cn(
          "relative flex w-full max-w-md flex-col justify-between p-6 md:p-8",
          "dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]"
        )}
      >
        <div className="absolute -inset-y-6 -left-px w-px bg-border" />
        <div className="absolute -inset-y-6 -right-px w-px bg-border" />
        <div className="absolute -inset-x-6 -top-px h-px bg-border" />
        <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
        <DecorIcon position="top-left" />
        <DecorIcon position="bottom-right" />

        <div className="w-full space-y-8">
          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold tracking-wide">Setup Your Organization</h1>
            <p className="text-base text-muted-foreground">
              Create an organization to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => {
                    setName(e.target.value)
                    // Auto-generate slug
                    if (!slug || slug === name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")) {
                        setSlug(e.target.value.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""))
                    }
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Organization Slug</Label>
              <Input
                id="slug"
                placeholder="acme-corp"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be your unique identifier.
              </p>
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Organization"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
