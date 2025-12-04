import Link from "next/link";

export default function GymSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
              Arvo
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            Torna alla dashboard
          </Link>
        </div>
      </header>

      {/* Main content with top padding for header */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
