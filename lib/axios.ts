import axios from "axios"

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
    return Promise.reject(error)
  }
)
