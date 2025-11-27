import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getUser } from "@/lib/utils/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ProgressCheckWithDetails } from "@/lib/types/progress-check.types";
import { SimpleProgressCheckDetailPage } from "@/components/features/simple/progress-checks/simple-progress-check-detail-page";

export const metadata: Metadata = {
  title: "Progress Check",
  description: "Dettaglio progress check",
};

export default async function SimpleProgressCheckDetailRoute({
  params,
}: {
  params: Promise<{ checkId: string }>;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { checkId } = await params;

  // Fetch check with server-side Supabase client
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("progress_checks")
    .select("*, photos:progress_photos(*), measurements:body_measurements(*)")
    .eq("id", checkId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    redirect("/simple/progress-checks");
  }

  const check = data as unknown as ProgressCheckWithDetails;

  // Refresh signed URLs for photos (server-side)
  if (check.photos && check.photos.length > 0) {
    const refreshedPhotos = await Promise.all(
      check.photos.map(async (photo) => {
        try {
          // Extract file path from existing URL
          const url = new URL(photo.photo_url);
          const pathMatch = url.pathname.match(
            /\/storage\/v1\/object\/(sign|public)\/progress-photos\/(.+)/
          );

          if (!pathMatch || !pathMatch[2]) {
            return photo;
          }

          const filePath = pathMatch[2];

          // Generate new signed URL with server client
          const { data: urlData, error: urlError } = await supabase.storage
            .from("progress-photos")
            .createSignedUrl(filePath, 86400); // 24 hours

          if (urlError || !urlData) {
            console.error("Failed to refresh signed URL:", urlError);
            return photo;
          }

          return {
            ...photo,
            photo_url: urlData.signedUrl,
          };
        } catch (error) {
          console.error("Error refreshing photo URL:", error);
          return photo;
        }
      })
    );
    check.photos = refreshedPhotos;
  }

  return <SimpleProgressCheckDetailPage check={check} userId={user.id} />;
}
