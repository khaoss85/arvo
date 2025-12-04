import { getOwnedGym } from "@/lib/utils/auth.server";
import { BrandingEditor } from "@/components/features/gym-admin/branding/branding-editor";

export default async function BrandingPage() {
  const gym = await getOwnedGym();

  if (!gym) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Branding
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Personalizza l&apos;aspetto della tua palestra
        </p>
      </div>
      <BrandingEditor gymId={gym.id} />
    </div>
  );
}
