"use client"

import React from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/features/tasks/hooks/use-tasks";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  UserPlus,
  RefreshCw,
  AlertCircle,
  FileText,
  FolderPlus,
  ThumbsUp,
  UserMinus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Notification as NotificationType } from "@/types/models";

export function NotificationCenter() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const { data: notifications = [] } = useNotifications();
  const { data: auth } = useCurrentUser();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const shownIds = React.useRef(new Set<string>());

  const handleNotificationClick = React.useCallback((n: NotificationType) => {
    // Mark as read
    if (!n.isRead) {
      markReadMutation.mutate(n.id);
    }

    // Redirect to task drawer or project
    if (n.taskId && workspaceSlug) {
      router.push(`/${workspaceSlug}/projects?taskId=${n.taskId}`);
    } else if (n.projectId && workspaceSlug) {
      router.push(`/${workspaceSlug}/projects/${n.projectId}`);
    }
  }, [markReadMutation, workspaceSlug, router]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  React.useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Check if push notifications are enabled by preference
    let pushEnabled = true;
    if (auth?.user?.notificationPreferences) {
      try {
        const parsed = JSON.parse(auth.user.notificationPreferences);
        if (parsed && typeof parsed === "object" && parsed.channels) {
          pushEnabled = parsed.channels.push !== false;
        }
      } catch (e) {
        console.error("Error parsing notification channel preferences:", e);
      }
    }

    if (!pushEnabled) return;

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const newUnread = notifications.filter(
        (n: NotificationType) => !n.isRead && !shownIds.current.has(n.id)
      );

      newUnread.forEach((n: NotificationType) => {
        shownIds.current.add(n.id);
        try {
          const notification = new Notification(n.title, {
            body: n.message,
          });
          notification.onclick = () => {
            window.focus();
            handleNotificationClick(n);
          };
        } catch (err) {
          console.error("Error triggering browser notification:", err);
        }
      });
    }
  }, [notifications, auth, handleNotificationClick]);

  const unreadNotifications = notifications.filter((n: NotificationType) => !n.isRead);
  const unreadCount = unreadNotifications.length;



  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <MessageSquare className="h-4 w-4 text-purple-400" />;
      case "assignment":
        return <UserPlus className="h-4 w-4 text-blue-400" />;
      case "status_change":
        return <RefreshCw className="h-4 w-4 text-teal-400" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      case "dependency":
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      case "project_added":
        return <FolderPlus className="h-4 w-4 text-emerald-400" />;
      case "reply":
        return <MessageSquare className="h-4 w-4 text-pink-400" />;
      case "reaction":
        return <ThumbsUp className="h-4 w-4 text-yellow-400" />;
      case "assignment_removed":
        return <UserMinus className="h-4 w-4 text-rose-400" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label="Notifications"
            size="icon-sm"
            variant="outline"
            className="relative bg-background border-border hover:bg-muted text-foreground"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-card border-border text-card-foreground shadow-lg rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border p-3 bg-card">
          <span className="text-xs font-bold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              className="text-[10px] text-primary hover:text-primary/80 h-auto p-0 flex items-center gap-1"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-xs font-semibold text-foreground">All caught up!</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                No notifications to display.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n: NotificationType) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-2.5 items-start ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8 border border-border flex-shrink-0">
                    <AvatarImage src={(n as NotificationType & { sender?: { image?: string | null; name?: string | null } }).sender?.image || ""} />
                    <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground">
                      {(n as NotificationType & { sender?: { image?: string | null; name?: string | null } }).sender?.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {n.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground">
                      {getNotificationIcon(n.type)}
                      <span className="capitalize">{n.type.replace("_", " ")}</span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
