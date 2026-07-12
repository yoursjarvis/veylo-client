export interface CollaboratorUser {
  id?: string
  name: string
  email: string
  avatar: string | null
  color: string
}

export interface CollaboratorMouse {
  x: number
  y: number
  inside: boolean
}

export interface CollaboratorSelection {
  anchor: number
  head: number
}

export interface CollaboratorState {
  user: CollaboratorUser
  mouse?: CollaboratorMouse
  selection?: CollaboratorSelection
}

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
  const image = new window.Image()
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

export const resolveAvatarUrl = (
  avatarUrl: string | null | undefined
): string | undefined => {
  if (!avatarUrl) return undefined
  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://") ||
    avatarUrl.startsWith("blob:")
  ) {
    return avatarUrl
  }
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api.veylo.com:4000/api/v1"
    const origin = new URL(apiUrl).origin
    const relativePath = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`
    return `${origin}${relativePath}`
  } catch {
    return avatarUrl
  }
}
