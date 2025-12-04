import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getUser, requireCoach } from "@/lib/utils/auth.server";
import { CoachService } from "@/lib/services/coach.service";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { WorkoutAssignmentClient } from "@/components/features/coach/workout-assignment-client";

export const metadata: Metadata = {
  title: "Assign Workout",
  description: "Create and assign a workout for your client.",
};

interface AssignWorkoutPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function AssignWorkoutPage({ params }: AssignWorkoutPageProps) {
  // Require coach role
  await requireCoach();

  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { clientId } = await params;

  // Verify coach-client relationship
  const relationship = await CoachService.getClientRelationshipServer(
    user.id,
    clientId
  );

  if (!relationship || relationship.status !== "active") {
    notFound();
  }

  // Get client profile
  const clientProfile = await UserProfileService.getByUserIdServer(clientId);
  if (!clientProfile) {
    notFound();
  }

  // Get coach's templates
  const templates = await CoachService.getTemplatesServer(user.id);

  // Get split plan templates (coach's custom + system templates)
  const splitPlanTemplates = await CoachService.getSplitPlanTemplatesServer(user.id);

  return (
    <WorkoutAssignmentClient
      coachId={user.id}
      clientId={clientId}
      clientProfile={clientProfile}
      templates={templates}
      splitPlanTemplates={splitPlanTemplates}
    />
  );
}
