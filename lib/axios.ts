import axios from "axios"
import { toast } from "sonner"

const apiBaseURL = (process.env.NEXT_PUBLIC_API_URL ?? "/api/v1").replace(/\/$/, "") + "/"

export const axiosInstance = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle 401 (Unauthorized) - e.g., redirect to login or try to refresh token
      // For now, we'll just let the hooks handle it
    }
    if (error.response?.status === 429 || error.response?.data?.message === "Too many requests") {
      if (typeof window !== "undefined") {
        toast.error(error.response?.data?.message || "Too many requests")
      }
    }
    return Promise.reject(error)
  }
)
