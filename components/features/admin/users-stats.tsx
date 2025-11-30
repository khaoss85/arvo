'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, UserPlus, Zap } from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalWorkoutsGenerated: number;
  totalCreditsUsed: number;
}

export function UsersStatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Failed to load stats
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Active (30d)',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      subtitle: 'with workouts',
    },
    {
      title: 'New This Week',
      value: stats.newUsersThisWeek,
      icon: UserPlus,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: 'Total Credits Used',
      value: stats.totalCreditsUsed.toLocaleString(),
      icon: Zap,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      subtitle: `${stats.totalWorkoutsGenerated} workouts`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {card.title}
            </p>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {card.value}
          </p>
          {card.subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {card.subtitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
