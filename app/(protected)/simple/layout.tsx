import { redirect } from "next/navigation";
import { getUser } from "@/lib/utils/auth.server";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { SimpleHeader } from "@/components/features/simple/layout/simple-header";

export default async function SimpleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await UserProfileService.getByUserIdServer(user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  // If user is in advanced mode, redirect to advanced dashboard
  if (profile.app_mode === "advanced") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SimpleHeader userName={profile.first_name || undefined} />
      <main className="pb-safe">{children}</main>
    </div>
  );
}
