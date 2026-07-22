import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authService } from "../services/auth-service"
import type { AuthResponse } from "../types"
import type { ResetPasswordInput } from "../types"

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
}

export function useCurrentUser() {
  const query = useQuery<AuthResponse>({
    queryKey: authKeys.me(),
    queryFn: authService.me,
  })

  return {
    ...query,
    isLoading: query.isPending,
  }
}

export function useLogin() {
  return useMutation({
    mutationFn: authService.login,
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: authService.signup,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authService.forgotPassword,
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({
      token,
      data,
    }: {
      token: string
      data: ResetPasswordInput
    }) => authService.resetPassword(token, data),
  })
}
