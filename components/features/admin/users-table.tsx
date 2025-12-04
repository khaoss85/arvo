'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail,
  Calendar,
  Dumbbell,
  Zap,
  Trophy,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/lib/hooks/use-toast';

type UserRole = 'user' | 'coach' | 'gym_owner' | 'admin';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  user: { label: 'User', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  coach: { label: 'Coach', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  gym_owner: { label: 'Gym Owner', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

interface UserEntry {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  approachId: string | null;
  approachName: string | null;
  workoutsGenerated: number;
  workoutsCompleted: number;
  creditsConsumed: number;
  milestonesCount: number;
  milestones: string[];
}

interface Approach {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface RoleSelectorProps {
  userId: string;
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
}

function RoleSelector({ userId, currentRole, onRoleChange }: RoleSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === currentRole) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }

      onRoleChange(newRole);
      toast({
        title: 'Role updated',
        description: `User role changed to ${ROLE_CONFIG[newRole].label}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <select
        value={currentRole}
        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
        disabled={isUpdating}
        className={`
          px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer
          ${ROLE_CONFIG[currentRole].color}
          ${isUpdating ? 'opacity-50 cursor-wait' : ''}
          focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
        `}
      >
        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
          <option key={role} value={role}>
            {config.label}
          </option>
        ))}
      </select>
      {isUpdating && (
        <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin" />
      )}
    </div>
  );
}

export function UsersTable() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [approaches, setApproaches] = useState<Approach[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [approachFilter, setApproachFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, approachFilter, dateFilter, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (approachFilter) params.append('approach', approachFilter);
      if (dateFilter) params.append('dateRange', dateFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/users/entries?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setApproaches(data.approaches || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApproachBadge = (approachName: string | null) => {
    if (!approachName) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          Not set
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
        {approachName}
      </span>
    );
  };

  const formatMilestones = (milestones: string[]) => {
    if (milestones.length === 0) return '—';

    const milestoneLabels: Record<string, string> = {
      onboarding_complete: '✓ Onboarding',
      first_workout_generated: '🎯 First Workout',
      first_workout_complete: '💪 First Complete',
      first_cycle_complete: '🔄 First Cycle',
    };

    return milestones.map(m => milestoneLabels[m] || m).join(', ');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Date Filter */}
            <div className="flex gap-1">
              <Button
                variant={dateFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                All Time
              </Button>
              <Button
                variant={dateFilter === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('7d');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                7d
              </Button>
              <Button
                variant={dateFilter === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('30d');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                30d
              </Button>
              <Button
                variant={dateFilter === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('90d');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                90d
              </Button>
            </div>

            {/* Approach Filter */}
            {approaches.length > 0 && (
              <select
                value={approachFilter}
                onChange={(e) => {
                  setApproachFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">All Approaches</option>
                {approaches.map((approach) => (
                  <option key={approach.id} value={approach.id}>
                    {approach.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Approach
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Workouts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Milestones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <RoleSelector
                      userId={user.id}
                      currentRole={user.role}
                      onRoleChange={(newRole) => {
                        setUsers(prev =>
                          prev.map(u =>
                            u.id === user.id ? { ...u, role: newRole } : u
                          )
                        );
                      }}
                    />
                  </td>

                  {/* Approach */}
                  <td className="px-6 py-4">
                    {getApproachBadge(user.approachName)}
                  </td>

                  {/* Registered */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </div>
                  </td>

                  {/* Last Login */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.lastSignInAt
                        ? formatDistanceToNow(new Date(user.lastSignInAt), { addSuffix: true })
                        : 'Never'}
                    </div>
                  </td>

                  {/* Workouts */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Dumbbell className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {user.workoutsGenerated}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        / {user.workoutsCompleted} done
                      </span>
                    </div>
                  </td>

                  {/* Credits */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {user.creditsConsumed.toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Milestones */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {user.milestonesCount}
                      </span>
                      {user.milestonesCount > 0 && (
                        <span
                          className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]"
                          title={formatMilestones(user.milestones)}
                        >
                          ({formatMilestones(user.milestones)})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            users
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
