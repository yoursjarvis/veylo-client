"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { axiosInstance } from "@/lib/axios"
import { Building03Icon, Camera01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface LogoUploadProps {
  initialUrl?: string | null
  onUploadSuccess?: (url: string) => void
}

export function LogoUpload({ initialUrl, onUploadSuccess }: LogoUploadProps) {
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
    } catch {
      toast.error("Failed to upload logo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 rounded-lg border-2 border-border">
          <AvatarImage
            src={url || undefined}
            className="rounded-lg object-contain"
          />
          <AvatarFallback className="rounded-lg">
            <HugeiconsIcon
              icon={Building03Icon}
              className="h-8 w-8 text-muted-foreground"
            />
          </AvatarFallback>
        </Avatar>
        <label
          htmlFor="logo-upload"
          className="absolute -right-2 -bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
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
