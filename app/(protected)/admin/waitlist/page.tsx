import { requireAdmin } from '@/lib/utils/auth.server';
import { WaitlistTable } from '@/components/features/admin/waitlist-table';
import { StatsCards } from '@/components/features/admin/stats-cards';

export default async function AdminWaitlistPage() {
  // Require admin access (will redirect if not admin)
  await requireAdmin();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Waitlist Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage early access requests and approve users
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Waitlist Table */}
      <div className="mt-8">
        <WaitlistTable />
      </div>
    </div>
  );
}
