"use client";

import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import {
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Package,
  XCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface NotificationCenterProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (ids: string[]) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationCenter({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllRead,
  onClose,
}: NotificationCenterProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const dateLocale = locale === "it" ? it : enUS;

  const getNotificationIcon = (type: string, bookingStatus?: string) => {
    switch (type) {
      case "booking_confirmation":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "booking_reminder_24h":
      case "booking_reminder_1h":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "booking_cancellation":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "coach_feedback":
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      case "waitlist_slot_available":
        return <Calendar className="h-5 w-5 text-green-500" />;
      case "no_show_alert":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "late_cancellation":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "waitlist_offer_expired":
        return <Users className="h-5 w-5 text-gray-500" />;
      case "package_low":
        return <Package className="h-5 w-5 text-orange-500" />;
      case "package_expired":
        return <Package className="h-5 w-5 text-red-500" />;
      case "booking_rescheduled":
        return <CalendarClock className="h-5 w-5 text-blue-500" />;
      default:
        return <Calendar className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationTitle = (notification: Notification) => {
    switch (notification.notification_type) {
      case "booking_confirmation":
        return t("types.bookingConfirmed");
      case "booking_reminder_24h":
        return t("types.reminder24h");
      case "booking_reminder_1h":
        return t("types.reminder1h");
      case "booking_cancellation":
        return t("types.bookingCancelled");
      case "coach_feedback":
        return t("types.coachFeedback");
      case "waitlist_slot_available":
        return t("types.waitlistSlotAvailable");
      case "no_show_alert":
        return t("types.noShowAlert");
      case "late_cancellation":
        return t("types.lateCancellation");
      case "waitlist_offer_expired":
        return t("types.waitlistOfferExpired");
      case "package_low":
        return t("types.packageLow");
      case "package_expired":
        return t("types.packageExpired");
      case "booking_rescheduled":
        return t("types.bookingRescheduled");
      default:
        return t("types.notification");
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    // Handle coach_feedback notifications (use metadata)
    if (notification.notification_type === "coach_feedback") {
      const metadata = notification.metadata as {
        workoutName?: string;
        coachName?: string;
      } | null;
      const workoutName = metadata?.workoutName || "Workout";
      const coachName = metadata?.coachName || t("yourCoach");
      return t("feedbackDetails", { coachName, workoutName });
    }

    // Handle waitlist slot available
    if (notification.notification_type === "waitlist_slot_available") {
      const metadata = notification.metadata as {
        slotDate?: string;
        slotTime?: string;
        coachName?: string;
      } | null;
      if (metadata?.slotDate && metadata?.slotTime) {
        const date = new Date(metadata.slotDate);
        const formattedDate = date.toLocaleDateString(locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        return t("waitlistSlotDetails", {
          date: formattedDate,
          time: metadata.slotTime.slice(0, 5),
        });
      }
      return t("waitlistSlotGeneric");
    }

    // Handle no-show alert
    if (notification.notification_type === "no_show_alert") {
      const metadata = notification.metadata as {
        clientName?: string;
        noShowCount?: number;
        sessionCount?: number;
      } | null;
      if (metadata?.clientName) {
        return t("noShowAlertDetails", {
          clientName: metadata.clientName,
          count: metadata.noShowCount || 0,
          total: metadata.sessionCount || 0,
        });
      }
      return t("noShowAlertGeneric");
    }

    // Handle late cancellation
    if (notification.notification_type === "late_cancellation") {
      const metadata = notification.metadata as {
        clientName?: string;
        hoursNotice?: number;
      } | null;
      if (metadata?.clientName) {
        return t("lateCancellationDetails", {
          clientName: metadata.clientName,
          hours: metadata.hoursNotice || 0,
        });
      }
      return t("lateCancellationGeneric");
    }

    // Handle waitlist offer expired
    if (notification.notification_type === "waitlist_offer_expired") {
      return t("waitlistOfferExpiredDetails");
    }

    // Handle package low
    if (notification.notification_type === "package_low") {
      const metadata = notification.metadata as {
        sessionsRemaining?: number;
        packageName?: string;
      } | null;
      return t("packageLowDetails", {
        sessions: metadata?.sessionsRemaining || 0,
        package: metadata?.packageName || "Package",
      });
    }

    // Handle package expired
    if (notification.notification_type === "package_expired") {
      const metadata = notification.metadata as {
        packageName?: string;
      } | null;
      return t("packageExpiredDetails", {
        package: metadata?.packageName || "Package",
      });
    }

    // Handle booking rescheduled
    if (notification.notification_type === "booking_rescheduled") {
      if (notification.booking) {
        const { scheduled_date, start_time } = notification.booking;
        const date = new Date(scheduled_date);
        const formattedDate = date.toLocaleDateString(locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        return t("rescheduledDetails", {
          date: formattedDate,
          time: start_time.slice(0, 5),
        });
      }
      return t("rescheduledGeneric");
    }

    // Handle booking notifications
    if (!notification.booking) return null;

    const { scheduled_date, start_time } = notification.booking;
    // Coach name can be stored in metadata, otherwise use fallback
    const metadata = notification.metadata as { coachName?: string } | null;
    const coachName = metadata?.coachName || t("yourCoach");

    // Format date
    const date = new Date(scheduled_date);
    const formattedDate = date.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    // Format time (HH:MM)
    const formattedTime = start_time.slice(0, 5);

    return t("bookingDetails", {
      coachName,
      date: formattedDate,
      time: formattedTime,
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: dateLocale,
    });
  };

  const unreadNotifications = notifications.filter((n) => n.status === "sent");

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">{t("title")}</h3>
          {unreadNotifications.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {unreadNotifications.length}
            </span>
          )}
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-xs"
          >
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500">{t("empty")}</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  if (notification.status === "sent") {
                    onMarkAsRead([notification.id]);
                  }
                }}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                  notification.status === "sent" &&
                    "bg-blue-50/50 dark:bg-blue-900/10"
                )}
              >
                <div className="mt-0.5">
                  {getNotificationIcon(
                    notification.notification_type,
                    notification.booking?.status
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        notification.status === "sent" && "font-semibold"
                      )}
                    >
                      {getNotificationTitle(notification)}
                    </p>
                    {notification.status === "sent" && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                  {(notification.booking ||
                    notification.notification_type === "coach_feedback" ||
                    notification.notification_type === "waitlist_slot_available" ||
                    notification.notification_type === "no_show_alert" ||
                    notification.notification_type === "late_cancellation" ||
                    notification.notification_type === "waitlist_offer_expired" ||
                    notification.notification_type === "package_low" ||
                    notification.notification_type === "package_expired" ||
                    notification.notification_type === "booking_rescheduled") && (
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 truncate">
                      {getNotificationMessage(notification)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm"
            onClick={onClose}
          >
            {t("close")}
          </Button>
        </div>
      )}
    </div>
  );
}
