import { redirect } from "next/navigation";

// Redirect to unified library page
export default function CoachSplitPlanTemplatesPage() {
  redirect("/coach/library?tab=programs");
}
