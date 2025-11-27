import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getUser } from "@/lib/utils/auth.server";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { getVolumeProgressAction } from "@/lib/actions/volume-progress-actions";
import { getActiveSplitPlanAction } from "@/app/actions/split-actions";
import { WorkoutService } from "@/lib/services/workout.service";
import { SimpleReportPage } from "@/components/features/simple/report/simple-report-page";

export const metadata: Metadata = {
  title: "Progressi",
  description: "I tuoi progressi di allenamento",
};

export default async function SimpleReportPageRoute() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await UserProfileService.getByUserIdServer(user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  // Get volume data for radar chart
  const volumeProgressResult = await getVolumeProgressAction(user.id);
  const volumeProgress =
    volumeProgressResult.success && volumeProgressResult.data
      ? volumeProgressResult.data
      : [];

  // Get active split plan for target data
  const splitPlanResult = await getActiveSplitPlanAction(user.id);
  const splitPlan =
    splitPlanResult.success && splitPlanResult.data
      ? splitPlanResult.data
      : null;

  // Get completed workouts for calendar
  const workouts = await WorkoutService.getByUserIdServer(user.id);
  const completedWorkouts = workouts.filter((w) => w.status === 'completed');

  // Calculate target and actual data for radar chart
  const targetData: Record<string, number> = splitPlan?.volume_distribution || {};
  const actualData: Record<string, number> = {};

  volumeProgress.forEach((entry) => {
    if (entry.muscle && entry.current) {
      actualData[entry.muscle] =
        (actualData[entry.muscle] || 0) + entry.current;
    }
  });

  return (
    <SimpleReportPage
      targetData={targetData}
      actualData={actualData}
      completedWorkouts={completedWorkouts}
    />
  );
}
