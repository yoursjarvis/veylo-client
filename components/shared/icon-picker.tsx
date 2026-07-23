"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Briefcase02Icon,
  BugIcon,
  Building01Icon,
  Calendar01Icon,
  Camera01Icon,
  CheckListIcon,
  CloudIcon,
  Database01Icon,
  DashboardSquare01Icon,
  FlashlightIcon,
  FolderOpenIcon,
  GlobalIcon,
  HeartCheckIcon,
  Home01Icon,
  Image01Icon,
  Layers01Icon,
  LocationIcon,
  LockIcon,
  MagicWand01Icon,
  MoneyBag01Icon,
  MoonIcon,
  Package01Icon,
  PenIcon,
  PieChartIcon,
  RocketIcon,
  Search01Icon,
  SecurityLockIcon,
  StarIcon,
  Target01Icon,
  Task01Icon,
  TestTube01Icon,
  ThumbsUpIcon,
  TimeManagementIcon,
  UserGroupIcon,
  Wallet01Icon,
  WebProgrammingIcon,
  ZapIcon,
  // Correct replacements found in CJS bundle:
  BarChartIcon,
  CodeIcon,
  Settings01Icon,
  BulbIcon,
  BubbleChatIcon,
  NoteIcon,
  ServerStack01Icon,
  SecurityCheckIcon,
  SmartPhone01Icon,
  ToolsIcon,
  ChampionIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import NextImage from "next/image"
import { useRef, useState } from "react"
import Cropper from "react-easy-crop"

// ─── Icon Catalog ────────────────────────────────────────────────────────────

export const PRESET_ICONS: { name: string; icon: object; label: string }[] = [
  { name: "Briefcase02Icon", icon: Briefcase02Icon, label: "Briefcase" },
  { name: "RocketIcon", icon: RocketIcon, label: "Rocket" },
  { name: "Target01Icon", icon: Target01Icon, label: "Target" },
  { name: "StarIcon", icon: StarIcon, label: "Star" },
  { name: "ChampionIcon", icon: ChampionIcon, label: "Trophy" },
  { name: "BulbIcon", icon: BulbIcon, label: "Lightbulb" },
  { name: "MagicWand01Icon", icon: MagicWand01Icon, label: "Magic Wand" },
  { name: "FlashlightIcon", icon: FlashlightIcon, label: "Flash" },
  { name: "ZapIcon", icon: ZapIcon, label: "Zap" },
  { name: "CodeIcon", icon: CodeIcon, label: "Code" },
  { name: "WebProgrammingIcon", icon: WebProgrammingIcon, label: "Web Dev" },
  { name: "Database01Icon", icon: Database01Icon, label: "Database" },
  { name: "ServerStack01Icon", icon: ServerStack01Icon, label: "Server" },
  { name: "CloudIcon", icon: CloudIcon, label: "Cloud" },
  { name: "SmartPhone01Icon", icon: SmartPhone01Icon, label: "Mobile" },
  { name: "BugIcon", icon: BugIcon, label: "Bug" },
  { name: "TestTube01Icon", icon: TestTube01Icon, label: "Testing" },
  { name: "Settings01Icon", icon: Settings01Icon, label: "Settings" },
  { name: "ToolsIcon", icon: ToolsIcon, label: "Tools" },
  { name: "SecurityLockIcon", icon: SecurityLockIcon, label: "Security" },
  { name: "SecurityCheckIcon", icon: SecurityCheckIcon, label: "Shield" },
  { name: "LockIcon", icon: LockIcon, label: "Lock" },
  { name: "BarChartIcon", icon: BarChartIcon, label: "Bar Chart" },
  { name: "PieChartIcon", icon: PieChartIcon, label: "Pie Chart" },
  { name: "DashboardSquare01Icon", icon: DashboardSquare01Icon, label: "Dashboard" },
  { name: "Task01Icon", icon: Task01Icon, label: "Task" },
  { name: "CheckListIcon", icon: CheckListIcon, label: "Checklist" },
  { name: "NoteIcon", icon: NoteIcon, label: "Notes" },
  { name: "PenIcon", icon: PenIcon, label: "Pen" },
  { name: "Calendar01Icon", icon: Calendar01Icon, label: "Calendar" },
  { name: "TimeManagementIcon", icon: TimeManagementIcon, label: "Time" },
  { name: "BubbleChatIcon", icon: BubbleChatIcon, label: "Chat" },
  { name: "UserGroupIcon", icon: UserGroupIcon, label: "Team" },
  { name: "Layers01Icon", icon: Layers01Icon, label: "Layers" },
  { name: "Package01Icon", icon: Package01Icon, label: "Package" },
  { name: "FolderOpenIcon", icon: FolderOpenIcon, label: "Folder" },
  { name: "Building01Icon", icon: Building01Icon, label: "Building" },
  { name: "Home01Icon", icon: Home01Icon, label: "Home" },
  { name: "GlobalIcon", icon: GlobalIcon, label: "Global" },
  { name: "LocationIcon", icon: LocationIcon, label: "Location" },
  { name: "MoneyBag01Icon", icon: MoneyBag01Icon, label: "Money" },
  { name: "Wallet01Icon", icon: Wallet01Icon, label: "Wallet" },
  { name: "HeartCheckIcon", icon: HeartCheckIcon, label: "Health" },
  { name: "ThumbsUpIcon", icon: ThumbsUpIcon, label: "Thumbs Up" },
  { name: "Search01Icon", icon: Search01Icon, label: "Search" },
  { name: "MoonIcon", icon: MoonIcon, label: "Moon" },
]

// ─── Color Presets ───────────────────────────────────────────────────────────

const BG_COLOR_PRESETS = [
  { name: "Violet", hex: "#7c3aed" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Sky", hex: "#0284c7" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Emerald", hex: "#059669" },
  { name: "Green", hex: "#16a34a" },
  { name: "Amber", hex: "#d97706" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Pink", hex: "#db2777" },
  { name: "Slate", hex: "#475569" },
]

// ─── Encoding / Decoding ─────────────────────────────────────────────────────

/**
 * Encode a preset icon selection into a storable string.
 * Format: "icon:BriefcaseIcon:#6366f1"
 */
export function encodePresetIcon(iconName: string, bgColor: string): string {
  return `icon:${iconName}:${bgColor}`
}

/**
 * Parse a stored icon string.
 * Returns { type: "preset", iconName, bgColor } | { type: "image", url } | { type: "none" }
 */
export function parseIconValue(value: string | null | undefined):
  | { type: "preset"; iconName: string; bgColor: string }
  | { type: "image"; url: string }
  | { type: "none" } {
  if (!value) return { type: "none" }
  if (value.startsWith("icon:")) {
    const parts = value.split(":")
    // parts = ["icon", "BriefcaseIcon", "#6366f1"]
    const iconName = parts[1]
    const bgColor = parts[2] ?? "#4f46e5"
    return { type: "preset", iconName, bgColor }
  }
  if (
    value.startsWith("http") ||
    value.startsWith("/") ||
    value.startsWith("blob:")
  ) {
    return { type: "image", url: value }
  }
  return { type: "none" }
}

/**
 * Look up a PRESET_ICONS entry by its name string.
 */
export function getPresetIconEntry(iconName: string) {
  return PRESET_ICONS.find((i) => i.name === iconName)
}

// ─── Image Cropper helper ────────────────────────────────────────────────────

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
  if (!ctx) throw new Error("No 2d context")

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
      if (blob) resolve(blob)
      else reject(new Error("Canvas is empty"))
    }, "image/png")
  })
}

// ─── IconPicker Component ────────────────────────────────────────────────────

interface IconPickerProps {
  /** Stored icon string — either "icon:Name:#hex" or an image URL */
  value?: string | null
  onChange: (value: string | File) => void
  disabled?: boolean
  /** Optionally pass custom trigger */
  children?: React.ReactNode
}

export function IconPicker({
  value,
  onChange,
  disabled,
  children,
}: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"icon" | "image">("icon")

  // Icon tab state
  const [selectedIconName, setSelectedIconName] = useState<string>(
    () => {
      const parsed = parseIconValue(value)
      return parsed.type === "preset" ? parsed.iconName : "Briefcase02Icon"
    }
  )
  const [selectedBgColor, setSelectedBgColor] = useState<string>(
    () => {
      const parsed = parseIconValue(value)
      return parsed.type === "preset" ? parsed.bgColor : "#4f46e5"
    }
  )
  const [customHex, setCustomHex] = useState<string>(
    () => {
      const parsed = parseIconValue(value)
      return parsed.type === "preset" ? parsed.bgColor : "#4f46e5"
    }
  )

  // Crop states
  const [srcImage, setSrcImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const colorInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setOriginalFile(file)
      setSrcImage(imageUrl)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setOpen(false)
    }
  }

  const handleCancelCrop = () => {
    if (srcImage) URL.revokeObjectURL(srcImage)
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

  const handleApplyPreset = () => {
    onChange(encodePresetIcon(selectedIconName, selectedBgColor))
    setOpen(false)
  }

  const handleColorPresetClick = (hex: string) => {
    setSelectedBgColor(hex)
    setCustomHex(hex)
  }

  const handleCustomHexChange = (val: string) => {
    setCustomHex(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setSelectedBgColor(val)
    }
  }

  const handleNativeColorChange = (val: string) => {
    setSelectedBgColor(val)
    setCustomHex(val)
  }

  // ── Render the trigger button preview ──────────────────────────────────────
  const renderTriggerPreview = () => {
    const parsed = parseIconValue(value)

    if (parsed.type === "image") {
      return (
        <NextImage
          src={parsed.url}
          alt="Icon"
          width={48}
          height={48}
          className="h-full w-full rounded-lg object-cover"
        />
      )
    }

    if (parsed.type === "preset") {
      const entry = getPresetIconEntry(parsed.iconName)
      return (
        <div
          className="flex h-full w-full items-center justify-center rounded-lg"
          style={{ backgroundColor: parsed.bgColor }}
        >
          {entry && (
            <HugeiconsIcon
              icon={entry.icon as Parameters<typeof HugeiconsIcon>[0]["icon"]}
              className="h-5 w-5 text-white"
            />
          )}
        </div>
      )
    }

    return (
      <HugeiconsIcon
        icon={Briefcase02Icon}
        className="h-6 w-6 text-muted-foreground"
      />
    )
  }

  // ── Selected icon preview (inside popover) ─────────────────────────────────
  const selectedEntry = getPresetIconEntry(selectedIconName)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            children ? (
              (children as React.ReactElement)
            ) : (
              <button
                type="button"
                disabled={disabled}
                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {renderTriggerPreview()}
              </button>
            )
          }
        />

        <PopoverContent className="w-80 p-0" align="start">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setTab("icon")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors",
                tab === "icon"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={DashboardSquare01Icon} className="h-3.5 w-3.5" />
              Icons
            </button>
            <button
              type="button"
              onClick={() => setTab("image")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors",
                tab === "image"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={Image01Icon} className="h-3.5 w-3.5" />
              Image
            </button>
          </div>

          {/* ── ICONS TAB ── */}
          {tab === "icon" && (
            <div className="p-3 space-y-3">
              {/* Live Preview */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg shadow-sm"
                  style={{ backgroundColor: selectedBgColor }}
                >
                  {selectedEntry && (
                    <HugeiconsIcon
                      icon={selectedEntry.icon as Parameters<typeof HugeiconsIcon>[0]["icon"]}
                      className="h-5 w-5 text-white"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {selectedEntry?.label ?? "Select an icon"}
                  </p>
                  <p className="text-2xs text-muted-foreground font-mono">{selectedBgColor}</p>
                </div>
              </div>

              {/* Icon Grid */}
              <div>
                <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Icons
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {PRESET_ICONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      title={item.label}
                      onClick={() => setSelectedIconName(item.name)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md transition-all",
                        selectedIconName === item.name
                          ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                          : "hover:bg-muted"
                      )}
                      style={{
                        backgroundColor:
                          selectedIconName === item.name
                            ? selectedBgColor
                            : undefined,
                      }}
                    >
                      <HugeiconsIcon
                        icon={item.icon as Parameters<typeof HugeiconsIcon>[0]["icon"]}
                        className={cn(
                          "h-4 w-4",
                          selectedIconName === item.name
                            ? "text-white"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div>
                <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Background Color
                </p>
                {/* Color Presets */}
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                  {BG_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      title={preset.name}
                      onClick={() => handleColorPresetClick(preset.hex)}
                      className={cn(
                        "h-6 w-full rounded-md border-2 transition-all hover:scale-105",
                        selectedBgColor === preset.hex
                          ? "border-white shadow-md scale-105"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: preset.hex }}
                    />
                  ))}
                </div>
                {/* Custom Hex + Native Color Picker */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="#4f46e5"
                      value={customHex}
                      onChange={(e) => handleCustomHexChange(e.target.value)}
                      className="h-8 pl-8 font-mono text-xs"
                    />
                    <span
                      className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-border/40"
                      style={{ backgroundColor: selectedBgColor }}
                    />
                  </div>
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={selectedBgColor}
                    onChange={(e) => handleNativeColorChange(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
                  />
                </div>
              </div>

              {/* Apply Button */}
              <Button
                type="button"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={handleApplyPreset}
              >
                Apply Icon
              </Button>
            </div>
          )}

          {/* ── IMAGE TAB ── */}
          {tab === "image" && (
            <div className="p-3">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 hover:bg-muted/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <HugeiconsIcon
                    icon={Camera01Icon}
                    className="h-5 w-5 text-muted-foreground"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">
                    Upload image
                  </p>
                  <p className="text-2xs text-muted-foreground mt-0.5">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                </div>
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
      <Dialog
        open={!!srcImage}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancelCrop()
        }}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Crop Icon Image</DialogTitle>
            <DialogDescription>
              Drag to position and use the slider to zoom. Only square aspect
              ratio is allowed.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-4 h-75 w-full overflow-hidden rounded-md border bg-muted">
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
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancelCrop}>
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
