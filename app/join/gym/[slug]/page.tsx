import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/utils/auth.server";
import { GymRegistrationForm } from "@/components/features/gym-admin/registration/gym-registration-form";

type LocalizedText = { en?: string; it?: string } | null;

interface GymJoinPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GymJoinPage({ params }: GymJoinPageProps) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();

  // Get gym by slug with branding
  const { data: gym, error } = await supabase.rpc("get_gym_branding_by_slug", {
    p_slug: slug,
  });

  // If no gym found, show 404
  if (error || !gym || gym.length === 0) {
    notFound();
  }

  const gymData = gym[0];

  // Check if user is already logged in
  const user = await getUser();
  if (user) {
    // Check if user is already a member of this gym
    const { data: existingMembership } = await supabase
      .from("gym_members")
      .select("id")
      .eq("gym_id", gymData.gym_id)
      .eq("user_id", user.id)
      .single();

    if (existingMembership) {
      // Already a member, redirect to dashboard
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <GymRegistrationForm
        gymId={gymData.gym_id}
        gymName={gymData.gym_name}
        gymDescription={gymData.gym_description}
        branding={{
          logo_url: gymData.logo_url,
          logo_dark_url: gymData.logo_dark_url,
          splash_image_url: gymData.splash_image_url,
          primary_color: gymData.primary_color,
          secondary_color: gymData.secondary_color,
          accent_color: gymData.accent_color,
          font_family: gymData.font_family,
          welcome_message: gymData.welcome_message as LocalizedText,
          tagline: gymData.tagline as LocalizedText,
          app_name: gymData.app_name,
        }}
        slug={slug}
        isLoggedIn={!!user}
        userId={user?.id}
      />
    </div>
  );
}
