"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ROLES } from "@/constants/roles"
import { RoleAssignmentModal } from "@/features/rbac/components/role-assignment-modal"
import { authClient } from "@/lib/auth-client"
import {
  Cancel01Icon,
  Key01Icon,
  LeftToRightListBulletIcon,
  MoreHorizontalIcon,
  Shield01Icon,
  StopIcon,
  UserAdd01Icon,
  UserBlock01Icon,
  UserEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useQueryState } from "nuqs"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  useBanMember,
  useImpersonateUser,
  useMembers,
  usePendingInvitations,
  useRevokeInvitation,
  useRevokeSessions,
  useUnbanMember,
} from "../hooks/use-org"
import { BulkInviteModal } from "./bulk-invite-modal"
import { EditMemberModal, type MemberProps } from "./edit-member-modal"
import { InviteMemberModal } from "./invite-member-modal"

type Member = {
  id: string
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
    banned: boolean
    _count?: {
      roleAssignments: number
    }
    roleAssignments?: Array<{
      role: {
        name: string
      }
    }>
  }
  role: string
}

const columnHelper = createColumnHelper<Member>()

export function MembersTable() {
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })
  const [role, setRole] = useQueryState("role", { defaultValue: "" })
  const [status, setStatus] = useQueryState("status", { defaultValue: "" })
  const [isBulkInviteOpen, setIsBulkInviteOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  // State for Role Assignment Modal
  const [assignmentModal, setAssignmentModal] = useState<{
    isOpen: boolean
    userId: string
    userName: string
  }>({
    isOpen: false,
    userId: "",
    userName: "",
  })
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    member: MemberProps | null
  }>({
    isOpen: false,
    member: null,
  })

  const { data: activeOrganization } = authClient.useActiveOrganization()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useMembers({ search, role, status })

  const banMutation = useBanMember()
  const unbanMutation = useUnbanMember()
  const revokeMutation = useRevokeSessions()
  const impersonateMutation = useImpersonateUser()

  const flatData = useMemo(
    () => data?.pages.flatMap((page) => page.members) || [],
    [data]
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor("user", {
        header: "User",
        size: 350,
        cell: (info) => {
          const user = info.getValue()
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor("role", {
        header: "Roles",
        size: 400,
        cell: (info) => {
          const member = info.row.original
          const roles = member.user.roleAssignments || []

          return (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-2 text-xs"
                onClick={() => {
                  setAssignmentModal({
                    isOpen: true,
                    userId: member.user.id,
                    userName: member.user.name || "User",
                  })
                }}
              >
                <HugeiconsIcon
                  icon={Shield01Icon}
                  className="h-3.5 w-3.5 text-muted-foreground"
                />
                Manage Roles
              </Button>
              {roles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {roles.slice(0, 2).map((assignment, index) => (
                    <span
                      key={index}
                      className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground capitalize"
                    >
                      {assignment.role.name.replace(/_/g, " ")}
                    </span>
                  ))}
                  {roles.length > 2 && (
                    <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                      +{roles.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor("user.banned", {
        header: "Status",
        size: 150,
        cell: (info) => {
          const isBanned = info.getValue()
          return (
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${isBanned ? "bg-destructive/10 text-destructive" : "bg-secondary/50 text-secondary-foreground"}`}
            >
              {isBanned ? "Banned" : "Active"}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        size: 80,
        cell: (info) => {
          const member = info.row.original
          const user = member.user

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" className="h-8 w-8 p-0" />}
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setEditModal({ isOpen: true, member })}
                  >
                    <HugeiconsIcon
                      icon={UserEdit01Icon}
                      className="mr-2 h-4 w-4"
                    />
                    Edit User
                  </DropdownMenuItem>
                  {user.banned ? (
                    <DropdownMenuItem
                      onClick={() => {
                        unbanMutation.mutate(user.id, {
                          onSuccess: () => {
                            toast.success("User unbanned")
                            refetch()
                          },
                        })
                      }}
                    >
                      <HugeiconsIcon
                        icon={Shield01Icon}
                        className="mr-2 h-4 w-4"
                      />{" "}
                      Unban
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        banMutation.mutate(
                          { userId: user.id },
                          {
                            onSuccess: () => {
                              toast.success("User banned")
                            },
                          }
                        )
                      }}
                    >
                      <HugeiconsIcon
                        icon={UserBlock01Icon}
                        className="mr-2 h-4 w-4"
                      />{" "}
                      Ban
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => {
                      revokeMutation.mutate(user.id, {
                        onSuccess: () => toast.success("Sessions revoked"),
                      })
                    }}
                  >
                    <HugeiconsIcon icon={StopIcon} className="mr-2 h-4 w-4" />{" "}
                    Revoke Sessions
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      impersonateMutation.mutate(user.id, {
                        onSuccess: () => {
                          toast.success("Impersonation started")
                          window.location.reload() // Reload to pick up new session token
                        },
                      })
                    }}
                  >
                    <HugeiconsIcon icon={Key01Icon} className="mr-2 h-4 w-4" />{" "}
                    Impersonate
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      }),
    ],
    [banMutation, unbanMutation, revokeMutation, impersonateMutation, refetch]
  )

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const parentRef = useRef<HTMLDivElement>(null)

  const rows = table.getRowModel().rows

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 5 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 73,
    overscan: 20,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse()

    if (!lastItem) {
      return
    }

    if (
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    hasNextPage,
    fetchNextPage,
    rows.length,
    isFetchingNextPage,
    virtualItems,
  ])

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() -
        (virtualItems[virtualItems.length - 1]?.end || 0)
      : 0

  const handleReset = () => {
    setSearch("")
    setRole("")
    setStatus("")
  }

  const hasFilters = search || role || status

  return (
    <Tabs defaultValue="members" className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-px sm:flex-row sm:items-center">
        <TabsList variant="line" className="gap-6 bg-transparent p-0">
          <TabsTrigger
            value="members"
            className="rounded-none px-1 pb-3 text-sm font-semibold"
          >
            Active Members
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="rounded-none px-1 pb-3 text-sm font-semibold"
          >
            Pending Invitations
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2 pb-2 sm:pb-0">
          <Button variant="outline" onClick={() => setIsBulkInviteOpen(true)}>
            <HugeiconsIcon
              icon={LeftToRightListBulletIcon}
              className="mr-2 h-4 w-4"
            />
            Bulk Invite
          </Button>
          <Button onClick={() => setIsInviteOpen(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </div>

      <TabsContent value="members" className="space-y-4 outline-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />

            <Combobox
              items={ROLES}
              value={role}
              onValueChange={(value) => setRole(value || "")}
            >
              <ComboboxInput placeholder="Select a role" className="w-full" />

              <ComboboxContent>
                <ComboboxEmpty>No roles found.</ComboboxEmpty>

                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            <Select
              value={status}
              onValueChange={(value) => setStatus(value || "")}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                onClick={handleReset}
                className="h-10 px-3"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {isLoading && flatData.length === 0 ? (
          <div className="relative h-[calc(100vh-300px)] min-h-100 overflow-hidden rounded-md border">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 align-middle" style={{ width: 350 }}>
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="h-10 px-4 align-middle" style={{ width: 400 }}>
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="h-10 px-4 align-middle" style={{ width: 150 }}>
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th
                    className="h-10 px-4 text-right align-middle"
                    style={{ width: 80 }}
                  >
                    <Skeleton className="ml-auto h-4 w-12" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-6 w-20 rounded-md" />
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="p-4 text-right align-middle">
                      <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : flatData.length === 0 ? (
          <Empty className="my-8">
            <EmptyTitle>No members found</EmptyTitle>
            <EmptyDescription>
              There are no members matching your current filters.
            </EmptyDescription>
          </Empty>
        ) : (
          <div
            ref={parentRef}
            className="relative h-[calc(100vh-300px)] min-h-100 overflow-auto rounded-md border"
          >
            <table className="w-full table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted/50 shadow-sm backdrop-blur-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="h-10 bg-muted/50 px-4 align-middle font-medium text-muted-foreground"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {paddingTop > 0 && (
                  <tr>
                    <td
                      style={{ height: `${paddingTop}px` }}
                      colSpan={columns.length}
                    />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const isLoaderRow = virtualRow.index > rows.length - 1
                  const row = rows[virtualRow.index]

                  if (isLoaderRow) {
                    return (
                      <tr key={`loader-${virtualRow.index}`} className="h-14">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex flex-col gap-1.5">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-6 w-20 rounded-md" />
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </td>
                        <td className="p-4 text-right align-middle">
                          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr
                      key={row.id}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td
                      style={{ height: `${paddingBottom}px` }}
                      colSpan={columns.length}
                    />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="invitations" className="space-y-4 outline-none">
        <PendingInvitationsList />
      </TabsContent>

      <BulkInviteModal
        open={isBulkInviteOpen}
        onOpenChange={setIsBulkInviteOpen}
        onSuccess={() => refetch()}
      />

      <InviteMemberModal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSuccess={() => refetch()}
      />

      <RoleAssignmentModal
        userId={assignmentModal.userId}
        userName={assignmentModal.userName}
        organizationId={activeOrganization?.id || ""}
        open={assignmentModal.isOpen}
        onOpenChange={(open) =>
          setAssignmentModal((prev) => ({ ...prev, isOpen: open }))
        }
      />

      <EditMemberModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, member: null })}
        member={editModal.member}
      />
    </Tabs>
  )
}

function PendingInvitationsList() {
  const { data: invitations, isLoading } = usePendingInvitations()
  const revokeMutation = useRevokeInvitation()

  const handleRevoke = (id: string) => {
    revokeMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Invitation revoked successfully")
      },
      onError: (error) => {
        const responseError = error as { message?: string }
        toast.error(responseError.message || "Failed to revoke invitation")
      },
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="h-10 px-4 align-middle" style={{ width: "30%" }}>
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="h-10 px-4 align-middle" style={{ width: "25%" }}>
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="h-10 px-4 align-middle" style={{ width: "20%" }}>
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="h-10 px-4 align-middle" style={{ width: "15%" }}>
                <Skeleton className="h-4 w-16" />
              </th>
              <th
                className="h-10 px-4 text-right align-middle"
                style={{ width: "10%" }}
              >
                <Skeleton className="ml-auto h-4 w-16" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="p-4 align-middle">
                  <Skeleton className="h-4 w-48" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="p-4 text-right align-middle">
                  <Skeleton className="ml-auto h-8 w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Empty className="my-8">
        <EmptyTitle>No pending invitations</EmptyTitle>
        <EmptyDescription>
          There are no members matching your current filters.
        </EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="rounded-md border">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th
              className="h-10 px-4 align-middle font-medium text-muted-foreground"
              style={{ width: "30%" }}
            >
              Email
            </th>
            <th
              className="h-10 px-4 align-middle font-medium text-muted-foreground"
              style={{ width: "25%" }}
            >
              Role
            </th>
            <th
              className="h-10 px-4 align-middle font-medium text-muted-foreground"
              style={{ width: "20%" }}
            >
              Status
            </th>
            <th
              className="h-10 px-4 align-middle font-medium text-muted-foreground"
              style={{ width: "15%" }}
            >
              Sent At
            </th>
            <th
              className="h-10 px-4 text-right align-middle font-medium text-muted-foreground"
              style={{ width: "10%" }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invitations.map(
            (invite: {
              id: string
              email: string
              role?: string
              status: string
              createdAt: string
            }) => (
              <tr
                key={invite.id}
                className="transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle font-medium">{invite.email}</td>
                <td className="p-4 align-middle">
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground capitalize">
                    {invite.role?.replace("_", " ")}
                  </span>
                </td>
                <td className="p-4 align-middle">
                  <span className="rounded-full bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground capitalize">
                    {invite.status}
                  </span>
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {new Date(invite.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="p-4 text-right align-middle">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={revokeMutation.isPending}
                    onClick={() => handleRevoke(invite.id)}
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}
