export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  deletedAt?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  updatedAt: string;
  createdAt: string;
  twoFactorEnabled?: boolean | null;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
  browser?: string | null;
  os?: string | null;
  country?: string | null;
  location?: string | null;
  lastActiveAt?: string | null;
  revokedAt?: string | null;
  activeOrganizationId?: string | null;
  impersonatedBy?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string | null;
  logo?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface Member {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: string;
  organization?: Organization;
  user?: User;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  organizationId: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  projectKey: string;
  description?: string | null;
  icon?: string | null;
  template: string;
  teamMode: string;
  workspaceId: string;
  organizationId: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: string;
  user?: User;
}

export interface Task {
  id: string;
  taskKey: string;
  title: string;
  description?: string | null;
  projectId: string;
  organizationId: string;
  epicId?: string | null;
  milestoneId?: string | null;
  sprintId?: string | null;
  statusId: string;
  position: number;
  type: string;
  priority: string;
  estimate?: number | null;
  dueDate?: string | null;
  creatorId: string;
  assigneeId?: string | null;
  reporterId?: string | null;
  parentTaskId?: string | null;
  customFields?: Record<string, unknown> | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: TaskStatus;
  creator?: User;
  assignee?: User;
  reporter?: User;
  epic?: Epic;
  milestone?: Milestone;
  sprint?: Sprint;
  subtasks?: Task[];
  comments?: Comment[];
  activityLogs?: TaskActivity[];
  labels?: TaskLabel[];
  attachments?: Media[];
  blockingDependencies?: TaskDependency[];
  blockedByDependencies?: TaskDependency[];
}

export interface TaskStatus {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  category: string;
  order: number;
  createdAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  goal?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
}



export interface CustomFieldDefinition {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  type: string;
  options?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  organizationId: string;
  parentId?: string | null;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  replies?: Comment[];
  reactions?: CommentReaction[];
}

export interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: User;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  organizationId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: User;
}

export interface Epic {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description?: string | null;
  color: string;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TaskLabel {
  taskId: string;
  labelId: string;
  label?: Label;
}

export interface Milestone {
  id: string;
  projectId: string;
  organizationId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string | null;
  taskId?: string | null;
  projectId?: string | null;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  task?: Task;
  project?: Project;
}

export interface Vault {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultService {
  id: string;
  vaultId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultItem {
  id: string;
  serviceId: string;
  key: string;
  value: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  id: string;
  blockingTaskId: string;
  blockedTaskId: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  blockingTask?: Task;
  blockedTask?: Task;
}

export interface Account {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
  accessTokenExpiresAt?: string | null;
  refreshTokenExpiresAt?: string | null;
  scope?: string | null;
  password?: string | null;
  updatedAt: string;
  createdAt: string;
  user?: User;
}

export interface Verification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: string;
  updatedAt: string;
  createdAt: string;
}

export interface Media {
  id: string;
  modelType: string;
  modelId: string;
  collectionName: string;
  name: string;
  fileName: string;
  mimeType?: string | null;
  disk: string;
  conversionsDisk?: string | null;
  size: number;
  manipulations?: Record<string, unknown> | null;
  customProperties?: Record<string, unknown> | null;
  generatedConversions?: Record<string, unknown> | null;
  responsiveImages?: Record<string, unknown> | null;
  orderColumn?: number | null;
  createdAt: string;
  updatedAt: string;
  url: string;
  originalUrl: string;
}

export interface TwoFactor {
  id: string;
  secret: string;
  backupCodes: string;
  userId: string;
  user?: User;
  verified: boolean;
}

export interface SlackWebhook {
  id: string;
  projectId: string;
  url: string;
  channel?: string | null;
  isActive: boolean;
  createdAt: string;
  project?: Project;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  category: string;
  isSystem: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
