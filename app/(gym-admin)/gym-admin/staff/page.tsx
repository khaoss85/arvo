import { getOwnedGym } from "@/lib/utils/auth.server";
import { StaffList } from "@/components/features/gym-admin/staff/staff-list";

export default async function StaffPage() {
  const gym = await getOwnedGym();

  if (!gym) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Staff
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestisci i coach e lo staff della tua palestra
        </p>
      </div>
      <StaffList gymId={gym.id} />
    </div>
  );
}
