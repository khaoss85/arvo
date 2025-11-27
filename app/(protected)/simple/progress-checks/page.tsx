import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getUser } from "@/lib/utils/auth.server";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { SimpleProgressChecksPage } from "@/components/features/simple/progress-checks/simple-progress-checks-page";

export const metadata: Metadata = {
  title: "Progress Checks",
  description: "I tuoi progress check fotografici",
};

export default async function SimpleProgressChecksRoute() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await UserProfileService.getByUserIdServer(user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  return <SimpleProgressChecksPage userId={user.id} />;
}
