import { CoachHeader } from "@/components/features/coach/coach-header";
import { CoachBottomNav } from "@/components/features/coach/coach-bottom-nav";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <CoachHeader />
      <main className="flex-1 pb-20">
        {children}
      </main>
      <CoachBottomNav />
    </div>
  );
}
