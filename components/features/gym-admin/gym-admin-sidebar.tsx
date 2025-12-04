"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  Users,
  UserPlus,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  {
    name: "Dashboard",
    href: "/gym-admin",
    icon: LayoutDashboard,
  },
  {
    name: "Branding",
    href: "/gym-admin/branding",
    icon: Palette,
  },
  {
    name: "Staff",
    href: "/gym-admin/staff",
    icon: UserPlus,
  },
  {
    name: "Membri",
    href: "/gym-admin/members",
    icon: Users,
  },
  {
    name: "Registrazione",
    href: "/gym-admin/registration",
    icon: Link2,
  },
];

export function GymAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-4">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/gym-admin"
              ? pathname === "/gym-admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
