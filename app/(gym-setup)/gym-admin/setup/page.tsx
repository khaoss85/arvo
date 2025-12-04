import { redirect } from "next/navigation";
import { getUser, isGymOwner, getOwnedGym } from "@/lib/utils/auth.server";
import { GymSetupForm } from "@/components/features/gym-admin/setup/gym-setup-form";

export default async function GymSetupPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Check if user can access gym admin
  const canAccess = await isGymOwner();
  if (!canAccess) {
    redirect("/dashboard");
  }

  // If user already has a gym, redirect to dashboard
  const gym = await getOwnedGym();
  if (gym) {
    redirect("/gym-admin");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <GymSetupForm />
    </div>
  );
}
