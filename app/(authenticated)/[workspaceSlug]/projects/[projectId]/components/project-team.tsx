"use client";

import React from "react";
import Link from "next/link";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface ProjectTeamProps {
  members: ProjectMember[];
  workspaceSlug: string;
  projectId: string;
}

export function ProjectTeam({ members, workspaceSlug, projectId }: ProjectTeamProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-primary" /> Project Team & Roles
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Key stakeholders and contributors responsible for project outcomes.
          </CardDescription>
        </div>
        <Link href={`/${workspaceSlug}/projects/${projectId}/settings/members`}>
          <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold">
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Manage Members
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 border p-2.5 rounded-xl bg-card">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={member.user?.image || ""} />
                <AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground">
                  {member.user?.name ? member.user.name.charAt(0).toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{member.user?.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{member.role === "owner" ? "Project Owner" : "Member"}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
