export interface SignUpRequest {
  first_name: string
  last_name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
  redirect_to?: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface VerifyEmailQueryRequest {
  token: string
}

export interface ChecklistTemplateCreateRequest {
  name: string
  description?: string | null
  items: string[]
  workspaceId: string
  organizationId: string
}

export interface ChecklistTemplateUpdateRequest {
  name?: string
  description?: string | null
  items?: string[]
}

export interface DependencyCreateRequest {
  dependencyTaskId: string
  direction: "blocks" | "blocked_by"
}

export interface EpicCreateRequest {
  title: string
  description?: string | null
  color?: string
  startDate?: string | null
  endDate?: string | null
}

export interface EpicUpdateRequest {
  title?: string
  description?: string | null
  color?: string
  status?: "open" | "in_progress" | "done"
  startDate?: string | null
  endDate?: string | null
}

export interface LabelCreateRequest {
  name: string
  color: string
}

export interface MilestoneCreateRequest {
  title: string
  description?: string | null
  dueDate?: string | null
}

export interface MilestoneUpdateRequest {
  title?: string
  description?: string | null
  dueDate?: string | null
  isCompleted?: boolean
}

export interface SetupOrgRequest {
  name: string
  slug: string
  workspaceName: string
}

export interface ProjectCreateRequest {
  title: string
  projectKey: string
  description?: string
  icon?: string
  template?: string
  teamMode?: string
}

export interface ProjectUpdateRequest {
  title?: string
  description?: string
  icon?: string
  template?: string
  teamMode?: string
}

export interface VaultServiceRequest {
  name: string
}

export interface VaultItemRequest {
  key: string
  value: string
  note?: string | null
}

export interface UpdateVaultItemRequest {
  value?: string
  note?: string | null
}

export interface CreateRoleRequest {
  name: string
  organizationId: string
  permissionIds?: string[]
  bypassPermissions?: boolean
}

export interface UpdateRoleRequest {
  name?: string
  permissionIds?: string[]
  bypassPermissions?: boolean
}

export interface AssignRoleRequest {
  userId: string
  roleIds: string[]
  scopeType: "ORGANIZATION" | "PROJECT" | "WORKSPACE" | "DEPARTMENT"
  scopeId: string
}

export interface WebhookRequest {
  url: string
  channel?: string | null
  isActive?: boolean
}

export interface SprintCreateRequest {
  name: string
  goal?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface SprintUpdateRequest {
  name?: string
  goal?: string | null
  startDate?: string | null
  endDate?: string | null
  status?: "planned" | "active" | "completed"
  uncompletedTasksDestination?: string | null
}

export interface StatusRequest {
  name: string
  category: "backlog" | "todo" | "in_progress" | "done"
  order?: number
  color?: string
  progressWeight?: number
}

export interface StatusUpdateRequest {
  name?: string
  category?: "backlog" | "todo" | "in_progress" | "done"
  order?: number
  color?: string
  progressWeight?: number
}

export interface SubtaskRequest {
  title: string
  assigneeId?: string | null
  statusId?: string
  isCompleted?: boolean
}

export interface CommentRequest {
  content: string
  parentId?: string | null
}

export interface CustomFieldRequest {
  name: string
  type: "text" | "number" | "date" | "select" | "checkbox"
  options?: string[] | null
}

export interface CommentReactionRequest {
  emoji: string
}

export interface TaskCreateRequest {
  title: string
  description?: string | null
  statusId: string
  sprintId?: string | null
  epicId?: string | null
  milestoneId?: string | null
  type?: "task" | "bug" | "feature" | "subtask"
  priority?: "lowest" | "low" | "medium" | "high" | "highest" | "urgent"
  estimate?: number | null
  estimatedPoints?: number
  awardedPoints?: number
  dueDate?: string | null
  assigneeId?: string | null
  reporterId?: string | null
  parentTaskId?: string | null
  position?: number
  customFields?: Record<string, unknown>
  labelIds?: string[]
  isPrivate?: boolean
}

export interface TaskUpdateRequest {
  title?: string
  description?: string | null
  statusId?: string
  sprintId?: string | null
  epicId?: string | null
  milestoneId?: string | null
  type?: "task" | "bug" | "feature" | "subtask"
  priority?: "lowest" | "low" | "medium" | "high" | "highest" | "urgent"
  estimate?: number | null
  estimatedPoints?: number
  awardedPoints?: number
  dueDate?: string | null
  createdAt?: string
  assigneeId?: string | null
  reporterId?: string | null
  position?: number
  customFields?: Record<string, unknown>
  labelIds?: string[]
  isPrivate?: boolean
}

export interface WorkLogCreateRequest {
  hoursLogged: number
  loggedAt?: string
  description?: string | null
}

export interface WorkLogUpdateRequest {
  hoursLogged?: number
  loggedAt?: string
  description?: string | null
}

export interface WorkspaceRequest {
  name: string
  slug: string
  icon?: string
}
