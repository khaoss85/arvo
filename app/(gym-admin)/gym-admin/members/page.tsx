import { getOwnedGym } from "@/lib/utils/auth.server";
import { MembersList } from "@/components/features/gym-admin/members/members-list";

export default async function MembersPage() {
  const gym = await getOwnedGym();

  if (!gym) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Membri
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visualizza e gestisci i membri della tua palestra
        </p>
      </div>
      <MembersList gymId={gym.id} />
    </div>
  );
}
