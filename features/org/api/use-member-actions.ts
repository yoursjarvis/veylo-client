import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"

export function useMemberSessions(memberId: string) {
  return useQuery({
    queryKey: ["member-sessions", memberId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/org/members/${memberId}/sessions`)
      return data.data
    },
    enabled: !!memberId,
  })
}

export function useRevokeSpecificSession(memberId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await axiosInstance.delete(`/org/members/${memberId}/sessions/${sessionId}`)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-sessions", memberId] })
    },
  })
}

export function useChangeMemberPassword(memberId: string) {
  return useMutation({
    mutationFn: async (password: string) => {
      const { data } = await axiosInstance.put(`/org/members/${memberId}/password`, { password })
      return data.data
    },
  })
}

export function useUpdateMemberPhoto(memberId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("photo", file)
      const { data } = await axiosInstance.put(`/org/members/${memberId}/photo`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members"] })
    },
  })
}
