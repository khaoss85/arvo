"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationCenter } from "./notification-center";
import { cn } from "@/lib/utils/cn";

interface Notification {
  id: string;
  notification_type: string;
  channel: string;
  scheduled_for: string;
  sent_at: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  booking?: {
    id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    status: string;
    coach_id: string;
  };
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/client/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      const res = await fetch("/api/client/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });
      if (res.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            notificationIds.includes(n.id) ? { ...n, status: "read" } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/client/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, status: "read" }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        <NotificationCenter
          notifications={notifications}
          isLoading={isLoading}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
