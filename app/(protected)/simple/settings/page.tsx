import { redirect } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { getUser } from "@/lib/utils/auth.server"
import { getUserLanguage } from "@/lib/utils/get-user-language"
import { getTranslations } from "next-intl/server"
import { UserProfileService } from "@/lib/services/user-profile.service"
import { Card } from "@/components/ui/card"
import { AppModeToggle } from "@/components/features/settings/app-mode-toggle"
import { PersonalInfoEditor } from "@/components/features/settings/personal-info-editor"
import { ResetDataSection } from "@/components/features/settings/reset-data-section"
import { DeleteAccountSection } from "@/components/features/settings/delete-account-section"
import { LanguageSelector } from "@/components/features/settings/language-selector"

export async function generateMetadata(): Promise<Metadata> {
  const user = await getUser()
  if (!user) {
    return { title: 'Impostazioni' }
  }

  const locale = await getUserLanguage(user.id)
  const t = await getTranslations({ locale, namespace: 'settings.page.metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function SimpleSettingsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const profile = await UserProfileService.getByUserIdServer(user.id)

  if (!profile) {
    redirect("/onboarding")
  }

  // Redirect to full settings if user is in advanced mode
  if (profile.app_mode === 'advanced') {
    redirect('/settings')
  }

  // Get translations
  const locale = await getUserLanguage(user.id)
  const t = await getTranslations({ locale, namespace: 'settings' })
  const tSimple = await getTranslations({ locale, namespace: 'simpleMode.settings' })

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/simple"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("backToDashboard")}
          </Link>
          <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        </div>

        <div className="space-y-6">
          {/* App Mode Section */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{tSimple('title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {tSimple('description')}
                </p>
              </div>
              <AppModeToggle />
            </div>
          </Card>

          {/* Language Preferences */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">{t("preferences.title")}</h3>
            <LanguageSelector userId={user.id} />
          </Card>

          {/* Personal Information Section */}
          <Card className="p-4 sm:p-6">
            <PersonalInfoEditor
              userId={user.id}
              initialData={{
                first_name: profile.first_name,
                gender: profile.gender,
                body_type: profile.body_type ?? null,
                age: profile.age,
                weight: profile.weight,
                height: profile.height,
              }}
            />
          </Card>

          {/* Account Management Section */}
          <div className="pt-6 border-t-2 border-gray-300 dark:border-gray-700">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("page.accountManagement.title")}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t("page.accountManagement.description")}
              </p>
            </div>

            <div className="space-y-4">
              {/* Reset Data Section */}
              <ResetDataSection />

              {/* Delete Account Section */}
              <DeleteAccountSection userId={user.id} userEmail={user.email} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
