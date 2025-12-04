import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, requireCoach } from "@/lib/utils/auth.server";
import { CoachService } from "@/lib/services/coach.service";
import { CoachDashboardClient } from "@/components/features/coach/coach-dashboard-client";

export const metadata: Metadata = {
  title: "Coach Dashboard",
  description: "Manage your clients, create workouts, and track their progress.",
};

export default async function CoachDashboardPage() {
  // Require coach role
  await requireCoach();

  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Get coach profile, create if doesn't exist
  let coachProfile = await CoachService.getProfileServer(user.id);

  if (!coachProfile) {
    // Auto-create coach profile for users with coach role
    const displayName = user.user_metadata?.name ||
                        user.user_metadata?.full_name ||
                        user.email?.split("@")[0] ||
                        "Coach";
    try {
      coachProfile = await CoachService.createProfileServer(user.id, { displayName });
    } catch (error) {
      console.error("[CoachDashboard] Error creating coach profile:", error);
    }
  }

  // Get dashboard stats (use server-side functions)
  let stats = null;
  let clients: Awaited<ReturnType<typeof CoachService.getClientsWithProfilesServer>> = [];

  try {
    stats = await CoachService.getDashboardStatsServer(user.id);
    clients = await CoachService.getClientsWithProfilesServer(user.id);
  } catch (error) {
    console.error("[CoachDashboard] Error loading data:", error);
  }

  return (
    <CoachDashboardClient
      user={user}
      coachProfile={coachProfile}
      stats={stats}
      clients={clients}
    />
  );
}
