'use client'

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { LanguageSelector } from "./language-selector"

interface SettingsClientWrapperProps {
  userId: string
  children: React.ReactNode
}

export function SettingsClientWrapper({ userId, children }: SettingsClientWrapperProps) {
  const t = useTranslations("settings")

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("backToDashboard")}
          </Link>
          <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-8">
          {/* Language Preferences */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t("preferences.title")}</h2>
            <LanguageSelector userId={userId} />
          </Card>

          {/* Other settings sections */}
          {children}
        </div>
      </div>
    </div>
  )
}
