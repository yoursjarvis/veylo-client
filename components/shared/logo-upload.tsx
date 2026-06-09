"use client"

import { useState, useEffect } from "react"
import { axiosInstance } from "@/lib/axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon, Building03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface LogoUploadProps {
  initialUrl?: string | null
  onUploadSuccess?: (url: string) => void
}

export function LogoUpload({ initialUrl, onUploadSuccess }: LogoUploadProps) {
  const [url, setUrl] = useState<string | null>(initialUrl || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setUrl(initialUrl || null)
  }, [initialUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append("logo", file)

    try {
      const response = await axiosInstance.post("media/org/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const newUrl = response.data.data.url
      setUrl(newUrl)
      toast.success("Logo uploaded successfully")
      if (onUploadSuccess) onUploadSuccess(newUrl)
    } catch (error) {
      toast.error("Failed to upload logo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-border rounded-lg">
          <AvatarImage src={url || undefined} className="rounded-lg object-contain" />
          <AvatarFallback className="rounded-lg">
            <HugeiconsIcon icon={Building03Icon} className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <label
          htmlFor="logo-upload"
          className="absolute bottom-[-8px] right-[-8px] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <HugeiconsIcon icon={Camera01Icon} className="h-4 w-4" />
          <input
            id="logo-upload"
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
