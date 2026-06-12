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
import { ROLES } from "@/constants/roles"
import {
  Cancel01Icon,
  Key01Icon,
  LeftToRightListBulletIcon,
  MoreHorizontalIcon,
  Shield01Icon,
  StopIcon,
  UserAdd01Icon,
  UserBlock01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useQueryState } from "nuqs"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  useBanMember,
  useImpersonateUser,
  useMembers,
  useRevokeSessions,
  useUnbanMember,
} from "../hooks/use-org"
import { BulkInviteModal } from "./bulk-invite-modal"
import { InviteMemberModal } from "./invite-member-modal"

type Member = {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
    banned: boolean
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
        header: "Role",
        cell: (info) => (
          <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground capitalize">
            {info.getValue()?.replace("_", " ")}
          </span>
        ),
      }),
      columnHelper.accessor("user.banned", {
        header: "Status",
        cell: (info) => {
          const isBanned = info.getValue()
          return (
            <span
              className={`rounded-full px-2 py-1 text-xs ${isBanned ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}
            >
              {isBanned ? "Banned" : "Active"}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
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
                              refetch()
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

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Infinite scrolling observer
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = observerRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage])

  const handleReset = () => {
    setSearch("")
    setRole("")
    setStatus("")
  }

  const hasFilters = search || role || status

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          {/* <Select value={role} onValueChange={(value) => setRole(value || "")}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="workspace_admin">Workspace Admin</SelectItem>
              <SelectItem value="project_admin">Project Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select> */}

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
            <Button variant="ghost" onClick={handleReset} className="h-10 px-3">
              <HugeiconsIcon icon={Cancel01Icon} className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
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

      {flatData.length === 0 && !isLoading ? (
        <Empty className="my-8">
          <EmptyTitle>No members found</EmptyTitle>
          <EmptyDescription>
            There are no members matching your current filters.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-10 px-4 align-middle font-medium text-muted-foreground"
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
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
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
              ))}
            </tbody>
          </table>

          {/* Infinite Scroll trigger */}
          <div
            ref={observerRef}
            className="py-4 text-center text-sm text-muted-foreground"
          >
            {isFetchingNextPage
              ? "Loading more..."
              : hasNextPage
                ? "Scroll down for more"
                : "No more members"}
          </div>
        </div>
      )}

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
    </div>
  )
}
