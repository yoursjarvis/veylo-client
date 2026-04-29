import { axiosInstance } from "@/lib/axios";
import {
  AuthResponse,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "../types";

export const authService = {
  async signup(data: RegisterInput) {
    const response = await axiosInstance.post<{ message: string }>(
      "/auth/signup",
      data
    );
    return response.data;
  },

  async login(data: LoginInput) {
    const response = await axiosInstance.post<{ message: string }>(
      "/auth/login",
      data
    );
    return response.data;
  },

  async logout() {
    const response = await axiosInstance.post<{ message: string }>(
      "/auth/logout"
    );
    return response.data;
  },

  async me() {
    const response = await axiosInstance.get<{ data: AuthResponse }>("/auth/me");
    return response.data.data;
  },

  async forgotPassword(data: ForgotPasswordInput) {
    const response = await axiosInstance.post<{ message: string }>(
      "/auth/forgot-password",
      data
    );
    return response.data;
  },

  async resetPassword(token: string, data: ResetPasswordInput) {
    const response = await axiosInstance.post<{ message: string }>(
      "/auth/reset-password",
      {
        token,
        new_password: data.password,
      }
    );
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await axiosInstance.get<{ message: string }>(
      `/auth/verify-email?token=${token}`
    );
    return response.data;
  },
};
