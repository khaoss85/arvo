"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, BarChart3, Camera, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ModeQuickSwitch } from "@/components/ui/mode-quick-switch";
import { Logo } from "@/components/ui/logo";

interface SimpleHeaderProps {
  userName?: string;
}

export function SimpleHeader({ userName }: SimpleHeaderProps) {
  const t = useTranslations("simpleMode.navigation");
  const pathname = usePathname();

  const navigation = [
    { href: "/simple", label: t("home"), icon: Home },
    { href: "/simple/report", label: t("progress"), icon: BarChart3 },
    { href: "/simple/progress-checks", label: t("check"), icon: Camera },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo - compact version without taglines */}
        <Link href="/simple" className="flex items-center">
          <Logo size="sm" showTagline={false} showSubtitle={false} animated={false} />
        </Link>

        {/* Mode Switch */}
        <ModeQuickSwitch />
      </div>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around px-2 py-2 border-t border-gray-100 dark:border-gray-800">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/simple"
              ? pathname === "/simple"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
