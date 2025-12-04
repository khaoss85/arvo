import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, requireCoach } from "@/lib/utils/auth.server";
import { CoachService } from "@/lib/services/coach.service";
import { CoachLibraryClient } from "@/components/features/coach/coach-library-client";

export const metadata: Metadata = {
  title: "Library",
  description: "Manage your workout and program templates",
};

export default async function CoachLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Require coach role
  await requireCoach();

  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Load both types of templates in parallel
  const [workoutTemplates, splitPlanTemplates] = await Promise.all([
    CoachService.getTemplatesServer(user.id),
    CoachService.getSplitPlanTemplatesServer(user.id),
  ]);

  // Get initial tab from search params
  const params = await searchParams;
  const initialTab = params.tab === "programs" ? "programs" : "workouts";

  return (
    <CoachLibraryClient
      coachId={user.id}
      initialWorkoutTemplates={workoutTemplates}
      initialSplitPlanTemplates={splitPlanTemplates}
      initialTab={initialTab}
    />
  );
}
