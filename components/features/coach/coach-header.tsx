"use client";

import Link from "next/link";
import { ModeQuickSwitch } from "@/components/ui/mode-quick-switch";
import { Logo } from "@/components/ui/logo";

export function CoachHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo - compact version */}
        <Link href="/coach" className="flex items-center">
          <Logo size="sm" showTagline={false} showSubtitle={false} animated={false} />
        </Link>

        {/* Mode Switch */}
        <ModeQuickSwitch />
      </div>
    </header>
  );
}
