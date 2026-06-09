import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { orgService } from "../services/org-service";

export const orgKeys = {
  members: (filters: any) => ["org", "members", filters] as const,
};

export function useMembers(filters: { search?: string; role?: string; status?: string }) {
  return useInfiniteQuery({
    queryKey: orgKeys.members(filters),
    queryFn: ({ pageParam }) => orgService.getMembers({ ...filters, pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
  });
}

export function useBanMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      orgService.banMember(userId, reason),
    onSuccess: () => {
      // Invalidate relevant queries (e.g., members list)
    },
  });
}

export function useUnbanMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => orgService.unbanMember(userId),
    onSuccess: () => {
      // Invalidate
    },
  });
}

export function useRevokeSessions() {
  return useMutation({
    mutationFn: (userId: string) => orgService.revokeSessions(userId),
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: (userId: string) => orgService.impersonateUser(userId),
  });
}

export function useBulkInvite() {
  return useMutation({
    mutationFn: (file: File) => orgService.bulkInvite(file),
  });
}

export function useInviteMember() {
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      orgService.inviteMember(email, role),
  });
}
