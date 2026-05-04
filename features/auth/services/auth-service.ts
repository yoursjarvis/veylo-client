import { axiosInstance } from "@/lib/axios"
import { getAuthErrorMessage } from "../lib/auth-errors"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "../types"

export const authService = {
  async signup(data: RegisterInput) {
    const parsed = registerSchema.parse(data)

    try {
      await axiosInstance.post("/auth/signup", {
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        email: parsed.email,
        password: parsed.password,
      })
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "Registration failed"))
    }
  },

  async login(data: LoginInput & { callbackUrl?: string }) {
    const parsed = loginSchema.parse(data)

    try {
      await axiosInstance.post("/auth/login", {
        email: parsed.email,
        password: parsed.password,
      })
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "Login failed"))
    }
  },

  async logout() {
    try {
      await axiosInstance.post("/auth/logout")
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "Logout failed"))
    }
  },

  async me() {
    try {
      const response = await axiosInstance.get("/auth/me")
      return response.data.data
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "Failed to load session"))
    }
  },

  async forgotPassword(data: ForgotPasswordInput) {
    const parsed = forgotPasswordSchema.parse(data)

    try {
      await axiosInstance.post("/auth/forgot-password", {
        email: parsed.email,
      })
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "Failed to send reset link"))
    }
  },

  async resetPassword(token: string, data: ResetPasswordInput) {
    const parsed = resetPasswordSchema.parse(data)

    try {
      await axiosInstance.post("/auth/reset-password", {
        token,
        new_password: parsed.password,
      })
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "Failed to reset password"))
    }
  },

  async verifyEmail(token: string) {
    try {
      await axiosInstance.get("/auth/verify-email", {
        params: { token },
      })
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "Verification failed"))
    }
  },
}
