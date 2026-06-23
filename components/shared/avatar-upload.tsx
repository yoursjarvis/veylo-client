"use client"

import { useState, useEffect } from "react"
import { axiosInstance } from "@/lib/axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface AvatarUploadProps {
  initialUrl?: string | null
  onUploadSuccess?: (url: string) => void
}

export function AvatarUpload({ initialUrl, onUploadSuccess }: AvatarUploadProps) {
  const [url, setUrl] = useState<string | null>(initialUrl || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize state with prop
    setUrl(initialUrl || null)
  }, [initialUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const response = await axiosInstance.post("media/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const newUrl = response.data.data.url
      setUrl(newUrl)
      toast.success("Avatar updated successfully")
      if (onUploadSuccess) onUploadSuccess(newUrl)
    } catch {
      toast.error("Failed to upload avatar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-border">
          <AvatarImage src={url || undefined} />
          <AvatarFallback>
            <HugeiconsIcon icon={Camera01Icon} className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <HugeiconsIcon icon={Camera01Icon} className="h-4 w-4" />
          <input
            id="avatar-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>
      </div>
      {loading && <p className="text-xs text-muted-foreground">Uploading...</p>}
    </div>
  )
}
