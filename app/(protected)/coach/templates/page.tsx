import { redirect } from "next/navigation";

// Redirect to unified library page
export default function CoachTemplatesPage() {
  redirect("/coach/library?tab=workouts");
}
