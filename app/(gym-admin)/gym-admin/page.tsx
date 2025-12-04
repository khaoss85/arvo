import { getOwnedGym, getUser } from "@/lib/utils/auth.server";
import { GymAdminDashboard } from "@/components/features/gym-admin/gym-admin-dashboard";

export default async function GymAdminPage() {
  const [user, gym] = await Promise.all([getUser(), getOwnedGym()]);

  if (!gym || !user) {
    return null;
  }

  return <GymAdminDashboard gymId={gym.id} gymName={gym.name} />;
}
