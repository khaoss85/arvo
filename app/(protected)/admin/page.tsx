import { requireAdmin } from '@/lib/utils/auth.server';
import Link from 'next/link';
import { Users, UserPlus, Zap, ArrowRight } from 'lucide-react';

export default async function AdminPage() {
  await requireAdmin();

  const links = [
    {
      href: '/admin/users',
      title: 'Users',
      description: 'View registered users, activity, and credit consumption',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      href: '/admin/waitlist',
      title: 'Waitlist',
      description: 'Manage early access requests and approve users',
      icon: UserPlus,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users, waitlist, and monitor platform activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className={`${link.color} p-3 rounded-lg`}>
                <link.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {link.title}
                  </h2>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {link.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
