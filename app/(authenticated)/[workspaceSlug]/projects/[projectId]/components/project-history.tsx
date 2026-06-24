"use client";

import React from "react";
import { Clock, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface ProjectMember {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface ProjectHistoryProps {
  members: ProjectMember[];
  projectCreatedAt?: string;
}

export function ProjectHistory({ members, projectCreatedAt }: ProjectHistoryProps) {
  // Sort members by join date for timeline
  const sortedMembers = [...members].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-primary" /> Project History
        </CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground">
          Audit trail of team membership and setup milestones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 border-l border-border space-y-6">
          {sortedMembers.map((member) => (
            <div key={member.id} className="relative">
              {/* Avatar dot indicator on the timeline line */}
              <span className="absolute -left-[35px] top-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={member.user?.image || ""} />
                  <AvatarFallback className="bg-muted text-[6px] font-bold text-muted-foreground">
                    {member.user?.name ? member.user.name.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
              </span>

              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  <span className="font-bold text-foreground">{member.user?.name}</span> joined the project team
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {format(new Date(member.createdAt), "PPP")}
                </p>
              </div>
            </div>
          ))}

          {projectCreatedAt && (
            <div className="relative">
              <span className="absolute -left-[35px] top-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                <Sparkles className="h-2 w-2 text-primary" />
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  Project record initialized in workspace
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {format(new Date(projectCreatedAt), "PPP")}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
