"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Clock03Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"

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

interface ProjectHistoryProps {
  members: ProjectMember[]
  projectCreatedAt?: string
}

export function ProjectHistory({
  members,
  projectCreatedAt,
}: ProjectHistoryProps) {
  // Sort members by join date for timeline
  const sortedMembers = [...members].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
          <HugeiconsIcon
            icon={Clock03Icon}
            className="h-4.5 w-4.5 text-primary"
          />{" "}
          Project History
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Audit trail of team membership and setup milestones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6 border-l border-border pl-6">
          {sortedMembers.map((member) => (
            <div key={member.id} className="relative">
              {/* Avatar dot indicator on the timeline line */}
              <span className="absolute top-0 -left-8.75 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={member.user?.image || ""} />
                  <AvatarFallback className="bg-muted text-[6px] font-bold text-muted-foreground">
                    {member.user?.name
                      ? member.user.name.charAt(0).toUpperCase()
                      : "?"}
                  </AvatarFallback>
                </Avatar>
              </span>

              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  <span className="font-bold text-foreground">
                    {member.user?.name}
                  </span>{" "}
                  joined the project team
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {format(new Date(member.createdAt), "PPP")}
                </p>
              </div>
            </div>
          ))}

          {projectCreatedAt && (
            <div className="relative">
              <span className="absolute top-0 -left-8.75 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                <HugeiconsIcon
                  icon={SparklesIcon}
                  className="h-2 w-2 text-primary"
                />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Project record initialized in workspace
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {format(new Date(projectCreatedAt), "PPP")}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
