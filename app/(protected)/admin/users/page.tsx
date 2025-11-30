import { requireAdmin } from '@/lib/utils/auth.server';
import { UsersTable } from '@/components/features/admin/users-table';
import { UsersStatsCards } from '@/components/features/admin/users-stats';
import { CreditStatsSection } from '@/components/features/admin/credit-stats';

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Users Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View registered users, their activity, and resource consumption
        </p>
      </div>

      <UsersStatsCards />

      <div className="mt-8">
        <UsersTable />
      </div>

      <div className="mt-12">
        <CreditStatsSection />
      </div>
    </div>
  );
}
