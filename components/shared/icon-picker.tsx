"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import NextImage from "next/image"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon, SmileIcon, Briefcase02Icon, Camera01Icon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Cropper from "react-easy-crop"

const COMMON_EMOJIS = ["🚀", "💡", "💼", "🎨", "📈", "🔥", "🌍", "💻", "📚", "✨", "🎯", "⚡", "🧩", "🛠️"]

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
  const image = new Image()
  image.src = imageSrc
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("No 2d context")
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Canvas is empty"))
      }
    }, "image/png")
  })
}

interface IconPickerProps {
  value?: string | null
  onChange: (value: string | File) => void
  disabled?: boolean
  children?: React.ReactNode
}

export function IconPicker({ value, onChange, disabled, children }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"emoji" | "image">("emoji")

  // Crop states
  const [srcImage, setSrcImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setOriginalFile(file)
      setSrcImage(imageUrl)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setOpen(false) // Close the emoji/image selector popover
    }
  }

  const handleCancelCrop = () => {
    if (srcImage) {
      URL.revokeObjectURL(srcImage)
    }
    setSrcImage(null)
    setOriginalFile(null)
    setCroppedAreaPixels(null)
  }

  const handleCropConfirm = async () => {
    if (!srcImage || !originalFile || !croppedAreaPixels) return
    setIsCropping(true)
    try {
      const croppedBlob = await getCroppedImg(srcImage, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: originalFile.type || "image/png",
      })
      onChange(croppedFile)
      handleCancelCrop()
    } catch (err) {
      console.error("Error cropping image:", err)
    } finally {
      setIsCropping(false)
    }
  }

  const renderCurrentIcon = () => {
    if (!value) return <HugeiconsIcon icon={Briefcase02Icon} className="h-6 w-6 text-muted-foreground" />
    if (value.startsWith("http") || value.startsWith("/") || value.startsWith("blob:")) {
      return <NextImage src={value} alt="Icon" width={48} height={48} className="h-full w-full rounded-md object-cover" />
    }
    return <span className="text-xl leading-none">{value}</span>
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            children ? (
              children as React.ReactElement
            ) : (
              <button
                type="button"
                disabled={disabled}
                className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {renderCurrentIcon()}
              </button>
            )
          }
        />
        <PopoverContent className="w-64 p-2" align="start">
          <div className="flex gap-1 border-b pb-2 mb-2">
            <Button
              type="button"
              variant={tab === "emoji" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setTab("emoji")}
            >
              <HugeiconsIcon icon={SmileIcon} className="mr-2 h-4 w-4" />
              Emoji
            </Button>
            <Button
              type="button"
              variant={tab === "image" ? "secondary" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setTab("image")}
            >
              <HugeiconsIcon icon={Image01Icon} className="mr-2 h-4 w-4" />
              Image
            </Button>
          </div>

          {tab === "emoji" && (
            <div className="grid grid-cols-5 gap-2">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(emoji)
                    setOpen(false)
                  }}
                  className="flex h-8 items-center justify-center rounded-md hover:bg-accent text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {tab === "image" && (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-6 hover:bg-muted/50">
                <HugeiconsIcon icon={Camera01Icon} className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload image</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Cropper Dialog */}
      <Dialog open={!!srcImage} onOpenChange={(isOpen) => { if (!isOpen) handleCancelCrop() }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crop Workspace Icon</DialogTitle>
            <DialogDescription>
              Drag to position and use the slider to zoom. Only square aspect ratio is allowed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative h-[300px] w-full rounded-md overflow-hidden bg-muted border mt-4">
            {srcImage && (
              <Cropper
                image={srcImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 py-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCrop}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCropConfirm}
              disabled={isCropping}
            >
              {isCropping ? "Cropping..." : "Save Icon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
