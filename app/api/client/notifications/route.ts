import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/client/notifications
 * Returns the user's in-app notifications (booking reminders, confirmations, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const includeRead = searchParams.get("includeRead") === "true";

    // Fetch notifications for this user
    // Note: bookings.coach_id references auth.users, not coach_profiles directly
    // So we fetch coach info separately if needed
    let query = supabase
      .from("booking_notifications")
      .select(`
        id,
        notification_type,
        channel,
        scheduled_for,
        sent_at,
        status,
        metadata,
        created_at,
        booking:bookings (
          id,
          scheduled_date,
          start_time,
          end_time,
          status,
          coach_id
        )
      `)
      .eq("recipient_id", user.id)
      .eq("channel", "in_app")
      .order("created_at", { ascending: false })
      .limit(limit);

    // By default, only show sent notifications (not pending future ones)
    if (!includeRead) {
      query = query.eq("status", "sent");
    } else {
      query = query.in("status", ["sent", "read"]);
    }

    const { data: notifications, error: notifError } = await query;

    if (notifError) {
      console.error("[Notifications] Error fetching notifications:", notifError);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    // Count unread notifications
    const { count: unreadCount, error: countError } = await supabase
      .from("booking_notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("channel", "in_app")
      .eq("status", "sent");

    if (countError) {
      console.error("[Notifications] Error counting unread:", countError);
    }

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("[Notifications] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/client/notifications
 * Mark notifications as read
 * Body: { notificationIds: string[] } or { markAllRead: true }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all user's notifications as read
      const { error: updateError } = await supabase
        .from("booking_notifications")
        .update({ status: "read" })
        .eq("recipient_id", user.id)
        .eq("channel", "in_app")
        .eq("status", "sent");

      if (updateError) {
        console.error("[Notifications] Error marking all read:", updateError);
        return NextResponse.json(
          { error: "Failed to update notifications" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, markedRead: "all" });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: "notificationIds array required" },
        { status: 400 }
      );
    }

    // Mark specific notifications as read (verify ownership)
    const { error: updateError } = await supabase
      .from("booking_notifications")
      .update({ status: "read" })
      .eq("recipient_id", user.id)
      .in("id", notificationIds);

    if (updateError) {
      console.error("[Notifications] Error marking read:", updateError);
      return NextResponse.json(
        { error: "Failed to update notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, markedRead: notificationIds.length });
  } catch (error) {
    console.error("[Notifications] PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
