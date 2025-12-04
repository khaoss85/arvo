import { getOwnedGym } from "@/lib/utils/auth.server";
import { redirect } from "next/navigation";
import { GymAdminHeader } from "@/components/features/gym-admin/gym-admin-header";
import { GymAdminSidebar } from "@/components/features/gym-admin/gym-admin-sidebar";

export default async function GymAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the owned gym
  const gym = await getOwnedGym();

  // If no gym, redirect to setup
  if (!gym) {
    redirect("/gym-admin/setup");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <GymAdminHeader gymName={gym.name} />
      <div className="flex">
        <GymAdminSidebar />
        <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
