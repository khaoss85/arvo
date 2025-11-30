import { redirect } from "next/navigation"
import { Metadata } from "next"
import { getUser } from "@/lib/utils/auth.server"
import { getUserLanguage } from "@/lib/utils/get-user-language"
import { getTranslations } from "next-intl/server"
import { UserProfileService } from "@/lib/services/user-profile.service"
import { TrainingApproachService } from "@/lib/services/training-approach.service"
import { SettingsClientWrapper } from "@/components/features/settings/settings-client-wrapper"
import { CaloricPhaseSelector } from "@/components/features/settings/caloric-phase-selector"
import { WeakPointsEditor } from "@/components/features/settings/weak-points-editor"
import { PhysicalLimitationsManager } from "@/components/features/settings/physical-limitations-manager"
import { EquipmentInventoryEditor } from "@/components/features/settings/equipment-inventory-editor"
import { CustomEquipmentManager } from "@/components/features/settings/custom-equipment-manager"
import { ResetDataSection } from "@/components/features/settings/reset-data-section"
import { DeleteAccountSection } from "@/components/features/settings/delete-account-section"
import { MethodDetails } from "@/components/features/settings/method-details"
import { ApproachSwitcher } from "@/components/features/settings/approach-switcher"
import { ApproachHistoryTimeline } from "@/components/features/settings/approach-history-timeline"
import { AudioCoachingSettings } from "@/components/features/settings/audio-coaching-settings"
import { PersonalInfoEditor } from "@/components/features/settings/personal-info-editor"
import { AppModeToggle } from "@/components/features/settings/app-mode-toggle"
import { RestartTourSection } from "@/components/features/settings/restart-tour-section"
import { Card } from "@/components/ui/card"
import type { SportGoal } from "@/lib/types/schemas"

// Helper to convert experience years to level
function getExperienceLevel(years: number | null): 'beginner' | 'intermediate' | 'advanced' {
  if (years === null || years < 2) return 'beginner'
  if (years < 5) return 'intermediate'
  return 'advanced'
}

// Helper to map caloric phase to training objective
function mapCaloricPhaseToObjective(
  phase: string | null
): 'bulk' | 'cut' | 'maintain' | 'recomp' | null {
  switch (phase) {
    case 'bulk':
      return 'bulk'
    case 'cut':
      return 'cut'
    case 'maintenance':
      return 'maintain'
    default:
      return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const user = await getUser()
  if (!user) {
    return { title: 'Settings' }
  }

  const locale = await getUserLanguage(user.id)
  const t = await getTranslations({ locale, namespace: 'settings.page.metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function SettingsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const profile = await UserProfileService.getByUserIdServer(user.id)

  if (!profile) {
    redirect("/onboarding/approach")
  }

  // Redirect to simple settings if user is in simple mode
  if (profile.app_mode === 'simple') {
    redirect('/simple/settings')
  }

  // Get current training approach
  const currentApproach = profile.approach_id
    ? await TrainingApproachService.getAllServer().then(
      approaches => approaches.find(a => a.id === profile.approach_id)
    )
    : null

  // Get translations
  const locale = await getUserLanguage(user.id)
  const t = await getTranslations({ locale, namespace: 'settings.page' })
  const tSimple = await getTranslations({ locale, namespace: 'simpleMode.settings' })

  return (
    <SettingsClientWrapper userId={user.id}>
      {/* App Mode Section */}
      <section id="app-mode" className="scroll-mt-20">
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
      </section>

      {/* Tour Section */}
      <section id="tour" className="scroll-mt-20">
        <RestartTourSection />
      </section>

      {/* Caloric Phase Section */}
      <section id="caloric" className="scroll-mt-20">
        <Card className="p-4 sm:p-6">
          <CaloricPhaseSelector
            userId={user.id}
            currentPhase={profile.caloric_phase as 'bulk' | 'cut' | 'maintenance' | null}
            currentCaloricIntake={profile.caloric_intake_kcal}
          />
        </Card>
      </section>

      {/* Weak Points Section */}
      <section id="weak-points" className="scroll-mt-20">
        <Card className="p-4 sm:p-6">
          <WeakPointsEditor
            userId={user.id}
            initialWeakPoints={profile.weak_points || []}
          />
        </Card>
      </section>

      {/* Physical Limitations Section */}
      <PhysicalLimitationsManager userId={user.id} />

      {/* Equipment Inventory Section */}
      <section id="equipment" className="scroll-mt-20">
        <Card className="p-4 sm:p-6">
          <EquipmentInventoryEditor
            userId={user.id}
            initialEquipment={profile.available_equipment || []}
          />
        </Card>
      </section>

      {/* Custom Equipment Section */}
      <CustomEquipmentManager
        userId={user.id}
        initialCustomEquipment={(profile.custom_equipment as Array<any>) || []}
      />

      {/* Training Approach Section */}
      <section id="approach" className="scroll-mt-20">
        <Card className="p-4 sm:p-6">
          <ApproachSwitcher
            userId={user.id}
            currentApproachId={profile.approach_id}
            currentApproachName={currentApproach?.name}
            availableEquipment={profile.available_equipment || []}
            experienceLevel={getExperienceLevel(profile.experience_years)}
            trainingObjective={mapCaloricPhaseToObjective(profile.caloric_phase)}
            weeklyFrequency={4}
            age={profile.age}
            gender={profile.gender as 'male' | 'female' | 'other' | null}
            sportGoal={(profile as any).sport_goal as SportGoal}
          />
        </Card>
      </section>

      {/* Method Details - Educational view of training methodology */}
      {profile.approach_id && (
        <MethodDetails approachId={profile.approach_id} />
      )}

      {/* Approach History Timeline */}
      <Card className="p-6">
        <ApproachHistoryTimeline userId={user.id} />
      </Card>

      {/* Audio Coaching Section */}
      <Card className="p-6">
        <AudioCoachingSettings />
      </Card>

      {/* Personal Information Section */}
      <section id="personal" className="scroll-mt-20">
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
      </section>

      {/* Account Info Section */}
      <section id="account" className="scroll-mt-20">
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('accountInfo.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('accountInfo.description')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('accountInfo.email')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('accountInfo.userId')}</span>
                <span className="text-sm font-mono text-gray-500 dark:text-gray-500">
                  {user.id.slice(0, 8)}...
                </span>
              </div>
              {profile.experience_years !== null && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('accountInfo.trainingExperience')}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('accountInfo.experienceYears', { years: profile.experience_years })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* Account Management Section */}
      <div className="pt-8 border-t-2 border-gray-300 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('accountManagement.title')}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('accountManagement.description')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Reset Data Section */}
          <ResetDataSection />

          {/* Delete Account Section */}
          <DeleteAccountSection userId={user.id} userEmail={user.email} />
        </div>
      </div>
    </SettingsClientWrapper>
  )
}
