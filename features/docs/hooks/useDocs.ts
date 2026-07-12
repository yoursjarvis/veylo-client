import { axiosInstance } from "@/lib/axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface UserSummary {
  id: string
  name: string
  image: string | null
}

export interface ProjectDoc {
  id: string
  projectId: string
  parentId: string | null
  title: string
  slug: string
  emoji: string | null
  icon: string | null
  coverImage: string | null
  content: any
  plainText: string | null
  order: number
  createdBy: string
  updatedBy: string
  archived: boolean
  deleted: boolean
  createdAt: string
  updatedAt: string
  creator: UserSummary
  updater?: UserSummary
  favorites?: { isFavorite: boolean; isPinned: boolean }[]
  permissions?: { userId: string; permission: string }[]
}

export interface DocComment {
  id: string
  docId: string
  userId: string
  content: string
  resolved: boolean
  createdAt: string
  updatedAt: string
  user: UserSummary
}

export interface DocVersion {
  id: string
  docId: string
  content: any
  createdBy: string
  version: number
  createdAt: string
  creator: UserSummary
}

export interface DocPermission {
  id: string
  docId: string
  userId: string
  permission: "view" | "comment" | "edit"
  createdAt: string
  user: UserSummary
}

export interface DocActivity {
  id: string
  docId: string
  action: string
  userId: string
  createdAt: string
  user: UserSummary
  metadata?: any
}

export const useDocs = (projectId: string) => {
  const queryClient = useQueryClient()

  const useProjectDocsQuery = () => {
    return useQuery<ProjectDoc[]>({
      queryKey: ["project-docs", projectId],
      queryFn: async () => {
        const response = await axiosInstance.get(`/projects/${projectId}/docs`)
        return response.data.data
      },
      enabled: !!projectId,
    })
  }

  const useRecentDocsQuery = () => {
    return useQuery<ProjectDoc[]>({
      queryKey: ["recent-docs", projectId],
      queryFn: async () => {
        const response = await axiosInstance.get(`/projects/${projectId}/docs/recent?limit=5`)
        return response.data.data
      },
      enabled: !!projectId,
    })
  }

  const useFavoritesQuery = () => {
    return useQuery<ProjectDoc[]>({
      queryKey: ["favorite-docs", projectId],
      queryFn: async () => {
        const response = await axiosInstance.get(`/projects/${projectId}/docs/favorites`)
        return response.data.data
      },
      enabled: !!projectId,
    })
  }

  const useDocDetailsQuery = (docId: string) => {
    return useQuery<ProjectDoc>({
      queryKey: ["doc-details", docId],
      queryFn: async () => {
        const response = await axiosInstance.get(`/docs/${docId}`)
        return response.data.data
      },
      enabled: !!docId,
    })
  }

  const useDocCommentsQuery = (docId: string) => {
    return useQuery<DocComment[]>({
      queryKey: ["doc-comments", docId],
      queryFn: async () => {
        const response = await axiosInstance.get(`/docs/${docId}/comments`)
        return response.data.data
      },
      enabled: !!docId,
    })
  }

  const useDocVersionsQuery = (docId: string) => {
    return useQuery<DocVersion[]>({
      queryKey: ["doc-versions", docId],
      queryFn: async () => {
        const response = await axiosInstance.get(`/docs/${docId}/versions`)
        return response.data.data
      },
      enabled: !!docId,
    })
  }

  const useDocPermissionsQuery = (docId: string) => {
    return useQuery<DocPermission[]>({
      queryKey: ["doc-permissions", docId],
      queryFn: async () => {
        const response = await axiosInstance.get(`/docs/${docId}/permissions`)
        return response.data.data
      },
      enabled: !!docId,
    })
  }

  const useDocActivitiesQuery = (docId: string) => {
    return useQuery<DocActivity[]>({
      queryKey: ["doc-activities", docId],
      queryFn: async () => {
        const response = await axiosInstance.get(`/docs/${docId}/activities`)
        return response.data.data
      },
      enabled: !!docId,
    })
  }

  // Mutations
  const createDocMutation = useMutation({
    mutationFn: async (data: { title: string; parentId?: string | null; emoji?: string | null }) => {
      const response = await axiosInstance.post(`/projects/${projectId}/docs`, data)
      return response.data.data
    },
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ["project-docs", projectId] })
      queryClient.invalidateQueries({ queryKey: ["recent-docs", projectId] })
      toast.success(`Document "${newDoc.title}" created`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create document")
    },
  })

  const updateDocMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectDoc> }) => {
      const response = await axiosInstance.patch(`/docs/${id}`, data)
      return response.data.data
    },
    onSuccess: (updatedDoc) => {
      queryClient.invalidateQueries({ queryKey: ["project-docs", projectId] })
      queryClient.invalidateQueries({ queryKey: ["recent-docs", projectId] })
      queryClient.invalidateQueries({ queryKey: ["favorite-docs", projectId] })
      queryClient.invalidateQueries({ queryKey: ["doc-details", updatedDoc.id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update document")
    },
  })

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/docs/${id}`)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["project-docs", projectId] })
      queryClient.invalidateQueries({ queryKey: ["recent-docs", projectId] })
      queryClient.invalidateQueries({ queryKey: ["favorite-docs", projectId] })
      queryClient.removeQueries({ queryKey: ["doc-details", id] })
      toast.success("Document deleted")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete document")
    },
  })

  const restoreDocMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.post(`/docs/${id}/restore`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-docs", projectId] })
      toast.success("Document restored")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to restore document")
    },
  })

  const duplicateDocMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.post(`/docs/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ["project-docs", projectId] })
      toast.success(`Duplicated to "${newDoc.title}"`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to duplicate document")
    },
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { isFavorite?: boolean; isPinned?: boolean } }) => {
      const response = await axiosInstance.post(`/docs/${id}/favorite`, data)
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["project-docs", projectId] })
      queryClient.invalidateQueries({ queryKey: ["favorite-docs", projectId] })
      queryClient.invalidateQueries({ queryKey: ["doc-details", id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update favorite status")
    },
  })

  // Comments mutations
  const createCommentMutation = useMutation({
    mutationFn: async ({ docId, content }: { docId: string; content: string }) => {
      const response = await axiosInstance.post(`/docs/${docId}/comments`, { content })
      return response.data.data
    },
    onSuccess: (_, { docId }) => {
      queryClient.invalidateQueries({ queryKey: ["doc-comments", docId] })
      queryClient.invalidateQueries({ queryKey: ["doc-activities", docId] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to post comment")
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, data }: { commentId: string; data: { content?: string; resolved?: boolean } }) => {
      const response = await axiosInstance.patch(`/comments/${commentId}`, data)
      return response.data.data
    },
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: ["doc-comments", comment.docId] })
      queryClient.invalidateQueries({ queryKey: ["doc-activities", comment.docId] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update comment")
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId, docId }: { commentId: string; docId: string }) => {
      await axiosInstance.delete(`/comments/${commentId}`)
    },
    onSuccess: (_, { docId }) => {
      queryClient.invalidateQueries({ queryKey: ["doc-comments", docId] })
      queryClient.invalidateQueries({ queryKey: ["doc-activities", docId] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete comment")
    },
  })

  // Permissions mutations
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ docId, userId, permission }: { docId: string; userId: string; permission: string }) => {
      const response = await axiosInstance.post(`/docs/${docId}/permissions`, { userId, permission })
      return response.data.data
    },
    onSuccess: (_, { docId }) => {
      queryClient.invalidateQueries({ queryKey: ["doc-permissions", docId] })
      queryClient.invalidateQueries({ queryKey: ["doc-details", docId] })
      toast.success("Permissions updated")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update permissions")
    },
  })

  const deletePermissionMutation = useMutation({
    mutationFn: async ({ docId, targetUserId }: { docId: string; targetUserId: string }) => {
      await axiosInstance.delete(`/docs/${docId}/permissions/${targetUserId}`)
    },
    onSuccess: (_, { docId }) => {
      queryClient.invalidateQueries({ queryKey: ["doc-permissions", docId] })
      queryClient.invalidateQueries({ queryKey: ["doc-details", docId] })
      toast.success("Permission removed")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove permission")
    },
  })

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async ({ docId, versionId }: { docId: string; versionId: string }) => {
      const response = await axiosInstance.post(`/docs/${docId}/versions/${versionId}/restore`)
      return response.data.data
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["project-docs", projectId] })
      queryClient.invalidateQueries({ queryKey: ["doc-details", doc.id] })
      queryClient.invalidateQueries({ queryKey: ["doc-versions", doc.id] })
      queryClient.invalidateQueries({ queryKey: ["doc-activities", doc.id] })
      toast.success("Document version restored")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to restore version")
    },
  })

  return {
    useProjectDocsQuery,
    useRecentDocsQuery,
    useFavoritesQuery,
    useDocDetailsQuery,
    useDocCommentsQuery,
    useDocVersionsQuery,
    useDocPermissionsQuery,
    useDocActivitiesQuery,
    createDoc: createDocMutation.mutateAsync,
    isCreatingDoc: createDocMutation.isPending,
    updateDoc: updateDocMutation.mutateAsync,
    isUpdatingDoc: updateDocMutation.isPending,
    deleteDoc: deleteDocMutation.mutateAsync,
    isDeletingDoc: deleteDocMutation.isPending,
    restoreDoc: restoreDocMutation.mutateAsync,
    duplicateDoc: duplicateDocMutation.mutateAsync,
    toggleFavorite: toggleFavoriteMutation.mutateAsync,
    createComment: createCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    updatePermission: updatePermissionMutation.mutateAsync,
    deletePermission: deletePermissionMutation.mutateAsync,
    restoreVersion: restoreVersionMutation.mutateAsync,
  }
}
