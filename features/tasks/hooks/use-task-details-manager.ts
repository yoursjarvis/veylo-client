import { useState } from "react"
import {
  useCreateComment,
  useCreateSubtask,
  useDeleteComment,
  useDeleteSubtask,
  useUpdateComment,
  useUpdateSubtask,
  useUpdateTask,
  useUploadTaskAttachment,
  useToggleCommentReaction,
  useDeleteTaskAttachment,
  useCreateTaskDependency,
  useDeleteTaskDependency,
} from "../hooks/use-tasks"

interface UseTaskDetailsManagerProps {
  taskId: string
  projectId: string
}

export function useTaskDetailsManager({ taskId, projectId }: UseTaskDetailsManagerProps) {
  const [localTitle, setLocalTitle] = useState("")
  const [localDesc, setLocalDesc] = useState("")
  const [newComment, setNewComment] = useState("")
  const [replyContent, setReplyContent] = useState("")
  const [editingContent, setEditingContent] = useState("")
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)

  const updateTaskMutation = useUpdateTask(projectId, taskId)
  const createSubtaskMutation = useCreateSubtask(projectId, taskId)
  const updateSubtaskMutation = useUpdateSubtask(taskId)
  const deleteSubtaskMutation = useDeleteSubtask(taskId)
  const createCommentMutation = useCreateComment(taskId)
  const deleteCommentMutation = useDeleteComment(taskId)
  const updateCommentMutation = useUpdateComment(taskId)
  const toggleReactionMutation = useToggleCommentReaction(taskId)
  const uploadAttachmentMutation = useUploadTaskAttachment(taskId)
  const deleteAttachmentMutation = useDeleteTaskAttachment(taskId)
  const createDependencyMutation = useCreateTaskDependency(taskId)
  const deleteDependencyMutation = useDeleteTaskDependency(taskId)


  const handleFieldChange = (field: string, value: unknown) => {
    updateTaskMutation.mutate({ [field]: value })
  }

  const handleCustomFieldChange = (fieldKey: string, value: unknown, currentCustomFields: Record<string, unknown> = {}) => {
    const updated = { ...currentCustomFields, [fieldKey]: value }
    handleFieldChange("customFields", updated)
  }

  const handleTitleBlur = (currentTitle: string) => {
    if (localTitle.trim() && localTitle !== currentTitle) {
      handleFieldChange("title", localTitle.trim())
    }
  }

  const handleDescBlur = (currentDesc: string) => {
    if (localDesc !== currentDesc) {
      handleFieldChange("description", localDesc)
    }
  }

  const handleAddComment = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    const cleanContent = newComment.replace(/<[^>]*>/g, "").trim()
    if (!cleanContent && !newComment.includes("<img")) return
    createCommentMutation.mutate({ content: newComment.trim() })
    setNewComment("")
  }

  const handleAddReply = (parentId: string) => {
    const cleanContent = replyContent.replace(/<[^>]*>/g, "").trim()
    if (!cleanContent && !replyContent.includes("<img")) return
    createCommentMutation.mutate(
      { content: replyContent.trim(), parentId },
      {
        onSuccess: () => {
          setReplyContent("")
        },
      }
    )
  }

  const handleUpdateComment = (commentId: string) => {
    const cleanContent = editingContent.replace(/<[^>]*>/g, "").trim()
    if (!cleanContent && !editingContent.includes("<img")) return
    updateCommentMutation.mutate(
      { commentId, content: editingContent.trim() },
      {
        onSuccess: () => {
          setEditingContent("")
        },
      }
    )
  }

  return {
    state: {
      localTitle,
      setLocalTitle,
      localDesc,
      setLocalDesc,
      newComment,
      setNewComment,
      replyContent,
      setReplyContent,
      editingContent,
      setEditingContent,
      replyingToCommentId,
      setReplyingToCommentId,
      editingCommentId,
      setEditingCommentId,
    },
    handlers: {
      handleFieldChange,
      handleCustomFieldChange,
      handleTitleBlur,
      handleDescBlur,
      handleAddComment,
      handleAddReply,
      handleUpdateComment,
    },
    mutations: {
      updateTaskMutation,
      createSubtaskMutation,
      updateSubtaskMutation,
      deleteSubtaskMutation,
      createCommentMutation,
      deleteCommentMutation,
      updateCommentMutation,
      toggleReactionMutation,
      uploadAttachmentMutation,
      deleteAttachmentMutation,
      createDependencyMutation,
      deleteDependencyMutation,
    },
  }
}
