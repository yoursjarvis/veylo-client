import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getThumbUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("blob:")) return url

  if (url.includes("/storage/")) {
    const parts = url.split("/storage/")
    const base = parts[0]
    const rest = parts[1]
    const pathParts = rest.split("/")
    if (pathParts.length >= 3) {
      const modelType = pathParts[0]
      const collectionName = pathParts[1]
      const fileName = pathParts.slice(2).join("/")
      return `${base}/storage/${modelType}/${collectionName}/conversions/thumb-${fileName}`
    }
  }
  return url
}
