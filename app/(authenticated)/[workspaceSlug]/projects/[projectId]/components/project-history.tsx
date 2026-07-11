"use client"

import { Badge } from "@/components/reui/badge"
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame"
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  ArrowRightIcon,
  Clock03Icon,
  SparklesIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
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

  const events = [
    ...(projectCreatedAt
      ? [
          {
            id: "init",
            type: "initialization" as const,
            date: new Date(projectCreatedAt),
            title: "Project record initialized in workspace",
            description:
              "The project record was successfully created and initialized in this workspace.",
          },
        ]
      : []),
    ...sortedMembers.map((member) => ({
      id: member.id,
      type: "member_joined" as const,
      date: new Date(member.createdAt),
      title: `${member.user?.name || "Unknown User"} joined the project team`,
      description: `Added to the project team with the role of ${member.role || "Member"}.`,
      user: {
        name: member.user?.name || "Unknown User",
        email: member.user?.email || "",
        avatar: member.user?.image || null,
      },
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

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
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No history available yet.
          </p>
        ) : (
          <Timeline defaultValue={events.length}>
            {events.map((event, index) => (
              <TimelineItem
                key={event.id}
                step={index + 1}
                className="ms-10 pb-10"
              >
                <TimelineHeader>
                  <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-7" />
                  <div className="flex items-center gap-2">
                    <TimelineTitle className="text-sm font-semibold">
                      {event.title}
                    </TimelineTitle>
                    <Badge
                      variant={
                        event.type === "initialization"
                          ? "success-light"
                          : "primary-light"
                      }
                      size="sm"
                    >
                      {format(event.date, "PPP")}
                    </Badge>
                  </div>
                  <TimelineIndicator
                    className={cn(
                      "flex size-6 items-center justify-center border-none bg-muted text-muted-foreground group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground group-data-[orientation=vertical]/timeline:-left-7"
                    )}
                  >
                    <HugeiconsIcon
                      icon={
                        event.type === "initialization"
                          ? SparklesIcon
                          : UserAdd01Icon
                      }
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  </TimelineIndicator>
                </TimelineHeader>
                <TimelineContent className="mt-2">
                  <Frame stacked dense spacing="sm">
                    <Collapsible defaultOpen className="group/collapsible">
                      <CollapsibleTrigger className="flex w-full">
                        <FrameHeader className="flex grow flex-row items-center justify-between gap-2">
                          {event.type === "member_joined" && event.user ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="size-5">
                                <AvatarImage
                                  src={event.user.avatar || ""}
                                  alt={event.user.name}
                                />
                                <AvatarFallback className="bg-muted text-2xs font-bold text-muted-foreground">
                                  {event.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-muted-foreground">
                                {event.user.name} ({event.user.email})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">
                              System Milestone
                            </span>
                          )}
                          <HugeiconsIcon
                            icon={ArrowRightIcon}
                            strokeWidth={2}
                            className="size-4 text-muted-foreground transition-transform duration-200 group-data-open/collapsible:rotate-90"
                          />
                        </FrameHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <FramePanel>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {event.description}
                          </p>
                        </FramePanel>
                      </CollapsibleContent>
                    </Collapsible>
                  </Frame>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  )
}
