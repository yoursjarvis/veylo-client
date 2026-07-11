"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserAdd01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

interface ProjectMember {
  id: string
  role: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

interface ProjectTeamProps {
  members: ProjectMember[]
  workspaceSlug: string
  projectId: string
}

export function ProjectTeam({
  members,
  workspaceSlug,
  projectId,
}: ProjectTeamProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
            <HugeiconsIcon
              icon={UserGroupIcon}
              className="h-4.5 w-4.5 text-primary"
            />{" "}
            Project Team & Roles
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Key stakeholders and contributors responsible for project outcomes.
          </CardDescription>
        </div>
        <Link href={`/${workspaceSlug}/projects/${projectId}/settings/members`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-2xs font-bold uppercase"
          >
            <HugeiconsIcon icon={UserAdd01Icon} className="mr-1 h-3.5 w-3.5" />{" "}
            Manage Members
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-2.5"
            >
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={member.user?.image || ""} />
                <AvatarFallback className="bg-muted text-sm font-bold text-muted-foreground">
                  {member.user?.name
                    ? member.user.name.charAt(0).toUpperCase()
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {member.user?.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {member.role?.replace("_", " ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
