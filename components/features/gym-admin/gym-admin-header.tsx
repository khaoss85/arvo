"use client";

import Link from "next/link";
import { Building2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface GymAdminHeaderProps {
  gymName: string;
}

export function GymAdminHeader({ gymName }: GymAdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Logo and gym name */}
        <div className="flex items-center gap-3">
          <Link
            href="/gym-admin"
            className="flex items-center gap-2 text-gray-900 dark:text-white"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold hidden sm:inline">{gymName}</span>
          </Link>
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Torna all&apos;app
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-gray-600 dark:text-gray-400"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
          <nav className="flex flex-col gap-2">
            <Link
              href="/gym-admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Dashboard
            </Link>
            <Link
              href="/gym-admin/branding"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Branding
            </Link>
            <Link
              href="/gym-admin/staff"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Staff
            </Link>
            <Link
              href="/gym-admin/members"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Membri
            </Link>
            <Link
              href="/gym-admin/registration"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Registrazione
            </Link>
            <hr className="my-2 border-gray-200 dark:border-gray-800" />
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Torna all&apos;app
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
