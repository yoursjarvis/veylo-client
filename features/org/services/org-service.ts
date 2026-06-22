import { authClient } from "@/lib/auth-client";
import { axiosInstance } from "@/lib/axios";

export const orgService = {
  // Use public endpoint for initial invitation view
  getInvitation: async (id: string) => {
    const { data } = await axiosInstance.get(`/org/invitations/${id}/public`);
    return data.data; // ok() wrapper returns { success, message, data }
  },

  acceptInvitation: async (id: string) => {

    const { data, error } = await authClient.organization.acceptInvitation({
      invitationId: id,
    });
    if (error) throw error;
    return data;
  },

  updateMemberRole: async (memberId: string, role: string) => {
    const { data, error } = await authClient.organization.updateMemberRole({
      memberId,
      role,
    });
    if (error) throw error;
    return data;
  },

  inviteMember: async (email: string, role: string) => {
    const { data } = await axiosInstance.post("/org/members/invite", {
      email,
      role,
    });
    return data;
  },

  // Use axiosInstance for custom backend routes
  banMember: async (userId: string, reason?: string) => {
    const { data } = await axiosInstance.post(`/org/members/${userId}/ban`, { reason });
    return data;
  },

  unbanMember: async (userId: string) => {
    const { data } = await axiosInstance.post(`/org/members/${userId}/unban`);
    return data;
  },

  revokeSessions: async (userId: string) => {
    const { data } = await axiosInstance.post(`/org/members/${userId}/revoke-sessions`);
    return data;
  },

  impersonateUser: async (userId: string) => {
    const { data } = await axiosInstance.post(`/org/members/${userId}/impersonate`);
    return data;
  },

  bulkInvite: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await axiosInstance.post("/org/members/invite-bulk", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  getMembers: async ({ pageParam, search, role, status }: { pageParam?: string; search?: string; role?: string; status?: string }) => {
    const { data } = await axiosInstance.get("/org/members", {
      params: { cursor: pageParam, search, role, status },
    });
    return data.data;
  },

  getPendingInvitations: async () => {
    const { data } = await axiosInstance.get("/org/invitations");
    return data.data;
  },

  revokeInvitation: async (id: string) => {
    const { data } = await axiosInstance.post(`/org/invitations/${id}/revoke`);
    return data;
  },
};
