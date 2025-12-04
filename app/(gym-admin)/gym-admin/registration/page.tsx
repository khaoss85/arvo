import { getOwnedGym } from "@/lib/utils/auth.server";
import { RegistrationSettings } from "@/components/features/gym-admin/registration/registration-settings";

export default async function RegistrationPage() {
  const gym = await getOwnedGym();

  if (!gym) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Registrazione
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestisci i link e codici per la registrazione dei membri
        </p>
      </div>
      <RegistrationSettings
        gymId={gym.id}
        gymSlug={gym.slug}
        inviteCode={gym.invite_code}
      />
    </div>
  );
}
