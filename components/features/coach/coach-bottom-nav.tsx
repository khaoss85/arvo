"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Calendar, Library, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function CoachBottomNav() {
  const t = useTranslations("coach.nav");
  const pathname = usePathname();

  const navigation = [
    { href: "/coach", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/coach/calendar", label: t("calendar"), icon: Calendar },
    { href: "/coach/library", label: t("library"), icon: Library },
    { href: "/coach/invite", label: t("invite"), icon: UserPlus },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          // Library tab should be active for /coach/library, /coach/templates, and /coach/split-plan-templates
          const isActive =
            item.href === "/coach"
              ? pathname === "/coach"
              : item.href === "/coach/library"
              ? pathname.startsWith("/coach/library") ||
                pathname.startsWith("/coach/templates") ||
                pathname.startsWith("/coach/split-plan-templates")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[72px]",
                isActive
                  ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
