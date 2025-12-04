import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getUser, requireCoach } from "@/lib/utils/auth.server";
import { CoachService } from "@/lib/services/coach.service";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { ClientDetailClient } from "@/components/features/coach/client-detail-client";

export const metadata: Metadata = {
  title: "Client Details",
  description: "View and manage client workouts and progress.",
};

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
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

  // Get client workouts
  const workouts = await WorkoutService.getByUserIdServer(clientId);

  // Get assignments for this client
  const assignments = await CoachService.getAssignmentsForClientServer(clientId);

  // Get coach profile for display
  const coachProfile = await CoachService.getProfileServer(user.id);

  return (
    <ClientDetailClient
      coachId={user.id}
      clientId={clientId}
      clientProfile={clientProfile}
      relationship={relationship}
      workouts={workouts}
      assignments={assignments}
      coachProfile={coachProfile}
    />
  );
}
