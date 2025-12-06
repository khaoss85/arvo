'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { it, enUS, type Locale } from 'date-fns/locale'
import { Package, Plus, RefreshCw, Calendar, Hash, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getClientPackagesAction,
  createPackageAction,
  updatePackageAction,
  getPackageSlotSuggestionsAction,
  confirmPackageSlotsAction
} from '@/app/actions/booking-actions'
import type { BookingPackage, InsertBookingPackage } from '@/lib/types/schemas'
import { AISuggestionsPanel, type AISlotSuggestion } from './ai-suggestions-panel'

interface PackageManagerProps {
  coachId: string
  clientId: string
  clientName: string
  onPackageChange?: () => void
}

export function PackageManager({
  coachId,
  clientId,
  clientName,
  onPackageChange
}: PackageManagerProps) {
  const t = useTranslations('coach.packages')
  const tCommon = useTranslations('common')
  const locale = useTranslations('coach.calendar')('locale') === 'it' ? it : enUS

  const [packages, setPackages] = useState<BookingPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<AISlotSuggestion[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    totalSessions: 10,
    sessionsPerWeek: 2,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: ''
  })

  // Load packages
  useEffect(() => {
    loadPackages()
  }, [clientId, coachId])

  const loadPackages = async () => {
    setIsLoading(true)
    try {
      const result = await getClientPackagesAction(clientId, coachId)
      if (result.success && result.packages) {
        setPackages(result.packages as BookingPackage[])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePackage = async () => {
    setIsCreating(true)
    try {
      const pkg: InsertBookingPackage = {
        coach_id: coachId,
        client_id: clientId,
        name: formData.name || `${t('title')} ${packages.length + 1}`,
        total_sessions: formData.totalSessions,
        sessions_per_week: formData.sessionsPerWeek,
        sessions_used: 0,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        status: 'active',
        ai_suggested_slots: null,
        slots_confirmed: false
      }

      const result = await createPackageAction(pkg)
      if (result.success) {
        setShowCreateModal(false)
        resetForm()
        loadPackages()
        onPackageChange?.()
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleRenewPackage = async (pkg: BookingPackage) => {
    try {
      // Create a new package based on the old one
      const newPkg: InsertBookingPackage = {
        coach_id: coachId,
        client_id: clientId,
        name: pkg.name,
        total_sessions: pkg.total_sessions,
        sessions_per_week: pkg.sessions_per_week,
        sessions_used: 0,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: null,
        status: 'active',
        ai_suggested_slots: null,
        slots_confirmed: false
      }

      // Mark old package as completed
      await updatePackageAction(pkg.id, { status: 'completed' })

      // Create new package
      await createPackageAction(newPkg)

      loadPackages()
      onPackageChange?.()
    } catch (error) {
      console.error('Error renewing package:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      totalSessions: 10,
      sessionsPerWeek: 2,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: ''
    })
    setAiSuggestions([])
    setShowAISuggestions(false)
  }

  // Get AI suggestions for optimal slots
  const handleGetAISuggestions = async () => {
    setIsLoadingAI(true)
    try {
      const targetLanguage = locale === it ? 'it' : 'en'
      const result = await getPackageSlotSuggestionsAction(
        coachId,
        clientId,
        undefined, // packageId - will be created later
        formData.sessionsPerWeek,
        targetLanguage as 'en' | 'it'
      )

      if (result.success && result.suggestions) {
        setAiSuggestions(result.suggestions)
        setShowAISuggestions(true)
      }
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Create package with AI-confirmed slots
  const handleConfirmSlotsAndCreate = async (slots: AISlotSuggestion[]) => {
    setIsCreating(true)
    try {
      // First create the package
      const pkg: InsertBookingPackage = {
        coach_id: coachId,
        client_id: clientId,
        name: formData.name || `${t('title')} ${packages.length + 1}`,
        total_sessions: formData.totalSessions,
        sessions_per_week: formData.sessionsPerWeek,
        sessions_used: 0,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        status: 'active',
        ai_suggested_slots: slots,
        slots_confirmed: true
      }

      const createResult = await createPackageAction(pkg)
      if (createResult.success && createResult.package) {
        // Then confirm slots to create recurring bookings
        const confirmResult = await confirmPackageSlotsAction(
          createResult.package.id,
          coachId,
          clientId,
          slots,
          4 // Generate 4 weeks of bookings
        )

        if (confirmResult.success) {
          setShowCreateModal(false)
          resetForm()
          loadPackages()
          onPackageChange?.()
        }
      }
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'expired': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const activePackages = packages.filter(p => p.status === 'active')
  const otherPackages = packages.filter(p => p.status !== 'active')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            {t('title')}
          </h3>
          <span className="text-sm text-gray-500">({clientName})</span>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          {t('create')}
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && packages.length === 0 && (
        <Card className="p-6 text-center">
          <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">{t('empty')}</p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('create')}
          </Button>
        </Card>
      )}

      {/* Active Packages */}
      {activePackages.length > 0 && (
        <div className="space-y-2">
          {activePackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              locale={locale}
              t={t}
              getStatusColor={getStatusColor}
              onRenew={() => handleRenewPackage(pkg)}
            />
          ))}
        </div>
      )}

      {/* Other Packages */}
      {otherPackages.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t('history')}</p>
          {otherPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              locale={locale}
              t={t}
              getStatusColor={getStatusColor}
              compact
            />
          ))}
        </div>
      )}

      {/* Create Package Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('create')}</DialogTitle>
            <DialogDescription>
              {t('createDescription', { client: clientName })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Package Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={`${t('title')} ${packages.length + 1}`}
              />
            </div>

            {/* Sessions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalSessions">{t('totalSessions')}</Label>
                <Input
                  id="totalSessions"
                  type="number"
                  min={1}
                  value={formData.totalSessions}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalSessions: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionsPerWeek">{t('perWeek')}</Label>
                <Input
                  id="sessionsPerWeek"
                  type="number"
                  min={1}
                  max={7}
                  value={formData.sessionsPerWeek}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, sessionsPerWeek: parseInt(e.target.value) || 1 }))
                    // Reset AI suggestions when sessions per week changes
                    setAiSuggestions([])
                    setShowAISuggestions(false)
                  }}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t('startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t('endDate')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* AI Suggestions Section */}
            {formData.sessionsPerWeek >= 1 && !showAISuggestions && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-purple-900 dark:text-purple-100">
                    {t('aiSlotSuggestion')}
                  </span>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                  {t('aiWillSuggestOptimalSlots', { count: formData.sessionsPerWeek })}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetAISuggestions}
                  disabled={isLoadingAI}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300"
                >
                  {isLoadingAI ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('getSuggestions')}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* AI Suggestions Panel */}
            {showAISuggestions && aiSuggestions.length > 0 && (
              <AISuggestionsPanel
                suggestions={aiSuggestions}
                onConfirm={handleConfirmSlotsAndCreate}
                onSavePackageOnly={handleCreatePackage}
                isLoading={isCreating}
              />
            )}
          </div>

          {/* Only show footer if not showing AI suggestions */}
          {!showAISuggestions && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                {tCommon('buttons.cancel')}
              </Button>
              <Button onClick={handleCreatePackage} disabled={isCreating}>
                {isCreating ? tCommon('buttons.loading') : t('create')}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface PackageCardProps {
  pkg: BookingPackage
  locale: Locale
  t: any
  getStatusColor: (status: string) => string
  onRenew?: () => void
  compact?: boolean
}

function PackageCard({ pkg, locale, t, getStatusColor, onRenew, compact = false }: PackageCardProps) {
  const remaining = pkg.total_sessions - pkg.sessions_used
  const progress = (pkg.sessions_used / pkg.total_sessions) * 100
  const isLow = remaining <= 2 && pkg.status === 'active'

  return (
    <Card className={cn(
      "p-4 transition-colors",
      compact && "py-3",
      isLow && "border-orange-500/30"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Name and Status */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "font-medium truncate",
              compact ? "text-sm" : ""
            )}>
              {pkg.name}
            </span>
            <Badge className={`${getStatusColor(pkg.status)} border text-xs`}>
              {pkg.status}
            </Badge>
          </div>

          {/* Progress */}
          {!compact && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{pkg.sessions_used} / {pkg.total_sessions} {t('used')}</span>
                <span className={isLow ? 'text-orange-400 font-medium' : ''}>
                  {remaining} {t('remaining')}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isLow ? "bg-orange-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Info */}
          <div className={cn(
            "flex items-center gap-4 text-gray-500",
            compact ? "text-xs" : "text-sm"
          )}>
            <div className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              <span>{pkg.sessions_per_week}/week</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(pkg.start_date), 'd MMM', { locale })}</span>
            </div>
            {compact && (
              <span>{remaining} {t('remaining')}</span>
            )}
          </div>
        </div>

        {/* Renew button */}
        {onRenew && pkg.status === 'active' && remaining <= 2 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRenew}
            className="shrink-0"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            {t('renew')}
          </Button>
        )}
      </div>
    </Card>
  )
}
