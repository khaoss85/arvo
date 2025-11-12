import { redirect } from "next/navigation"
import Link from "next/link"
import { Metadata } from "next"
import { getUser } from "@/lib/utils/auth.server"
import { UserProfileService } from "@/lib/services/user-profile.service"
import { SplitSelector } from "@/components/features/settings/split-selector"
import { WeakPointsEditor } from "@/components/features/settings/weak-points-editor"
import { EquipmentInventoryEditor } from "@/components/features/settings/equipment-inventory-editor"
import { CustomEquipmentManager } from "@/components/features/settings/custom-equipment-manager"
import { ResetDataSection } from "@/components/features/settings/reset-data-section"
import { DeleteAccountSection } from "@/components/features/settings/delete-account-section"
import { MethodDetails } from "@/components/features/settings/method-details"
import { ApproachSwitcher } from "@/components/features/settings/approach-switcher"
import { ApproachHistoryTimeline } from "@/components/features/settings/approach-history-timeline"
import { TrainingApproachService } from "@/lib/services/training-approach.service"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Customize your training preferences, manage your profile, and configure your workout experience.',
};

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

  // Get current training approach
  const currentApproach = profile.approach_id
    ? await TrainingApproachService.getAllServer().then(
        approaches => approaches.find(a => a.id === profile.approach_id)
      )
    : null

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold sm:text-4xl">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your training preferences and profile
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Split System Section */}
          <Card className="p-6">
            <SplitSelector
              userId={user.id}
              currentSplit={profile.preferred_split}
            />
          </Card>

          {/* Weak Points Section */}
          <Card className="p-6">
            <WeakPointsEditor
              userId={user.id}
              initialWeakPoints={profile.weak_points || []}
            />
          </Card>

          {/* Equipment Inventory Section */}
          <Card className="p-6">
            <EquipmentInventoryEditor
              userId={user.id}
              initialEquipment={profile.available_equipment || []}
            />
          </Card>

          {/* Custom Equipment Section */}
          <CustomEquipmentManager
            userId={user.id}
            initialCustomEquipment={(profile.custom_equipment as Array<any>) || []}
          />

          {/* Training Approach Section */}
          <Card className="p-6">
            <ApproachSwitcher
              userId={user.id}
              currentApproachId={profile.approach_id}
              currentApproachName={currentApproach?.name}
            />
          </Card>

          {/* Method Details - Educational view of training methodology */}
          {profile.approach_id && (
            <MethodDetails approachId={profile.approach_id} />
          )}

          {/* Approach History Timeline */}
          <Card className="p-6">
            <ApproachHistoryTimeline userId={user.id} />
          </Card>

          {/* Account Info Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Information</h3>
                <p className="text-sm text-muted-foreground">
                  Your account details
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">User ID</span>
                  <span className="text-sm font-mono text-gray-500 dark:text-gray-500">
                    {user.id.slice(0, 8)}...
                  </span>
                </div>
                {profile.experience_years !== null && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Training Experience</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {profile.experience_years} {profile.experience_years === 1 ? 'year' : 'years'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Account Management Section */}
          <div className="pt-8 border-t-2 border-gray-300 dark:border-gray-700">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Management</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Reset your training data or permanently delete your account
              </p>
            </div>

            <div className="space-y-6">
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
