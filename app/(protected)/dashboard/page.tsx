import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getUser } from "@/lib/utils/auth.server";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { DashboardClient } from "@/components/features/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View your workout progress, upcoming training sessions, and track your fitness journey.',
};

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has completed onboarding
  const profile = await UserProfileService.getByUserIdServer(user.id);
  if (!profile) {
    redirect("/onboarding/approach");
  }

  // Get user's workouts
  const workouts = await WorkoutService.getByUserIdServer(user.id);

  return <DashboardClient user={user} workouts={workouts} />;
}
