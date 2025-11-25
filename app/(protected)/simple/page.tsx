import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getUser } from "@/lib/utils/auth.server";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { getSplitTimelineDataAction } from "@/app/actions/split-actions";
import { SimpleDashboard } from "@/components/features/simple/dashboard/simple-dashboard";

export const metadata: Metadata = {
  title: "Home",
  description: "Il tuo workout di oggi",
};

export default async function SimpleDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await UserProfileService.getByUserIdServer(user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  // Get timeline data for workout days
  const timelineResult = await getSplitTimelineDataAction(user.id);
  // SplitTimelineData has { splitPlan, currentCycleDay, days: TimelineDayData[] }
  const timelineData = timelineResult.success && timelineResult.data ? timelineResult.data.days : [];

  return (
    <SimpleDashboard
      user={user}
      profile={profile}
      timelineData={timelineData || []}
    />
  );
}
