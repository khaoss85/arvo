import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, requireCoach } from "@/lib/utils/auth.server";
import { CoachService } from "@/lib/services/coach.service";
import { InviteClientPage } from "@/components/features/coach/invite-client-page";

export const metadata: Metadata = {
  title: "Invite Client",
  description: "Share your invite code to connect with new clients.",
};

export default async function CoachInvitePage() {
  // Require coach role
  await requireCoach();

  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Get coach profile
  const coachProfile = await CoachService.getProfileServer(user.id);

  // Get pending invites
  const pendingRelationships = await CoachService.getClientsServer(user.id, "pending");

  return (
    <InviteClientPage
      coachProfile={coachProfile}
      pendingInvites={pendingRelationships}
    />
  );
}
