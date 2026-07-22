import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query"
import { orgService } from "../services/org-service"

export const orgKeys = {
  members: (filters: Record<string, unknown>) =>
    ["org", "members", filters] as const,
  invitations: () => ["org", "invitations"] as const,
}

export function useMembers(filters: {
  search?: string
  role?: string
  status?: string
}) {
  return useInfiniteQuery({
    queryKey: orgKeys.members(filters),
    queryFn: ({ pageParam }) =>
      orgService.getMembers({ ...filters, pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
  })
}

export function useBanMember() {
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      orgService.banMember(userId, reason),
    onSuccess: () => {
      // Invalidate relevant queries (e.g., members list)
    },
  })
}

export function useUnbanMember() {
  return useMutation({
    mutationFn: (userId: string) => orgService.unbanMember(userId),
    onSuccess: () => {
      // Invalidate
    },
  })
}

export function useRevokeSessions() {
  return useMutation({
    mutationFn: (userId: string) => orgService.revokeSessions(userId),
  })
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: (userId: string) => orgService.impersonateUser(userId),
  })
}

export function useBulkInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => orgService.bulkInvite(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.invitations() })
    },
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      orgService.inviteMember(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.invitations() })
    },
  })
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: orgKeys.invitations(),
    queryFn: () => orgService.getPendingInvitations(),
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => orgService.revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.invitations() })
    },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => orgService.resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.invitations() })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      orgService.updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", "members"] })
    },
  })
}
