import axios from "axios"
import { toast } from "sonner"

const apiBaseURL =
  (process.env.NEXT_PUBLIC_API_URL ?? "/api/v1").replace(/\/$/, "") + "/"

export const axiosInstance = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Helper to keep frontend cache in sync even on failed requests
const syncPermissionsVersion = (headers: any) => {
  const permissionsVersion = headers?.["x-permissions-version"]
  if (permissionsVersion && typeof window !== "undefined") {
    const currentVersion = localStorage.getItem("permissions_version")
    if (currentVersion !== permissionsVersion) {
      localStorage.setItem("permissions_version", permissionsVersion)
      window.dispatchEvent(
        new CustomEvent("permissions-version-changed", {
          detail: permissionsVersion,
        })
      )
    }
  }
}

// Response interceptor to handle errors and headers
axiosInstance.interceptors.response.use(
  (response) => {
    syncPermissionsVersion(response.headers)
    return response
  },
  async (error) => {
    // Ensure we sync versions even if the request fails (e.g. 403 Forbidden)
    if (error.response?.headers) {
      syncPermissionsVersion(error.response.headers)
    }

    if (error.response?.status === 401) {
      // Handle 401 (Unauthorized) - e.g., redirect to login or try to refresh token
      // For now, we'll just let the hooks handle it
    }

    if (error.response?.status === 403) {
      if (typeof window !== "undefined") {
        toast.error(
          "Your permissions were recently updated by an administrator. Please retry if applicable."
        )
      }
    }

    if (
      error.response?.status === 429 ||
      error.response?.data?.message === "Too many requests"
    ) {
      if (typeof window !== "undefined") {
        toast.error(error.response?.data?.message || "Too many requests")
      }
    }
    return Promise.reject(error)
  }
)
