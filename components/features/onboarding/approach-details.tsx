'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  X, BookOpen, TrendingUp, Users, CheckCircle, ChevronDown, ChevronRight,
  Target, Zap, Calendar, Clock, Activity, Dumbbell, Info
} from 'lucide-react'
import type { TrainingApproach } from '@/lib/types/schemas'
import { Button } from '@/components/ui/button'

interface ApproachDetailsProps {
  approach: TrainingApproach
  onClose: () => void
}

export function ApproachDetails({ approach, onClose }: ApproachDetailsProps) {
  const t = useTranslations('onboarding.approachDetails')
  const tExp = useTranslations('onboarding.approachDetails.experienceLevels')
  const tPerfect = useTranslations('onboarding.approachDetails.perfectFor')
  const tSections = useTranslations('onboarding.approachDetails.sections')
  const tVars = useTranslations('onboarding.approachDetails.variables')
  const tVol = useTranslations('onboarding.approachDetails.volumeLandmarks')
  const tPer = useTranslations('onboarding.approachDetails.periodization')

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['philosophy', 'variables'])
  )

  const variables = approach.variables as any
  const progression = approach.progression_rules as any
  const rationales = approach.rationales as any
  const volumeLandmarks = (approach as any).volume_landmarks
  const advancedTechniques = (approach as any).advanced_techniques
  const periodization = (approach as any).periodization

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // Determine experience level
  const getExperienceLevel = () => {
    const name = approach.name.toLowerCase()
    if (name.includes('beginner') || name.includes('starting')) {
      return { level: tExp('beginnerFriendly'), color: 'green', description: tExp('beginnerDescription') }
    } else if (name.includes('advanced') || name.includes('powerlifting') || name.includes('heavy duty')) {
      return { level: tExp('advanced'), color: 'red', description: tExp('advancedDescription') }
    }
    return { level: tExp('allLevels'), color: 'blue', description: tExp('allLevelsDescription') }
  }

  // Extract "perfect for" criteria
  const getPerfectForCriteria = () => {
    const criteria = []
    const name = approach.name.toLowerCase()
    const philosophy = approach.philosophy?.toLowerCase() || ''

    if (philosophy.includes('hypertrophy') || name.includes('hypertrophy')) {
      criteria.push(tPerfect('buildingMass'))
    }
    if (philosophy.includes('strength') || name.includes('strength')) {
      criteria.push(tPerfect('increasingStrength'))
    }
    if (philosophy.includes('volume')) {
      criteria.push(tPerfect('highVolume'))
    }
    if (philosophy.includes('recovery') || philosophy.includes('sustainable')) {
      criteria.push(tPerfect('sustainable'))
    }
    if (philosophy.includes('powerlifting') || name.includes('powerlifting')) {
      criteria.push(tPerfect('powerlifting'))
    }
    if (philosophy.includes('general') || name.includes('balanced')) {
      criteria.push(tPerfect('balanced'))
    }

    if (criteria.length === 0) {
      criteria.push(tPerfect('structured'))
      criteria.push(tPerfect('evidenceBased'))
    }

    return criteria
  }

  const experienceLevel = getExperienceLevel()
  const perfectForCriteria = getPerfectForCriteria()

  const SectionHeader = ({ icon: Icon, title, section }: { icon: any; title: string; section: string }) => {
    const isExpanded = expandedSections.has(section)
    return (
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
    )
  }

  const formatTempo = (tempo: any) => {
    if (!tempo) return null
    return `${tempo.eccentric}-${tempo.pauseBottom}-${tempo.concentric}-${tempo.pauseTop}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold">
            {approach.name}
          </h2>
          {approach.creator && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('by')} {approach.creator}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {/* Experience Level Badge */}
        <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <span className="font-semibold text-primary">
              {experienceLevel.level}
            </span>
            <p className="text-sm text-muted-foreground">
              {experienceLevel.description}
            </p>
          </div>
        </div>

        {/* Philosophy - Always visible */}
        {approach.philosophy && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">{tSections('philosophy')}</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {approach.philosophy}
            </p>
          </div>
        )}

        {/* Training Variables - Accordion */}
        <div className="border rounded-lg overflow-hidden">
          <SectionHeader icon={Target} title={tSections('trainingVariables')} section="variables" />
          {expandedSections.has('variables') && (
            <div className="p-4 bg-accent/50 space-y-4">
              {/* Sets & Reps */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">{tVars('setsReps')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">{tVars('workingSets')}</div>
                    <div className="font-semibold">{variables?.setsPerExercise?.working || 'N/A'}</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">{tVars('warmup')}</div>
                    <div className="font-semibold text-xs">{variables?.setsPerExercise?.warmup || tVars('noneSpecified')}</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">{tVars('compoundReps')}</div>
                    <div className="font-semibold">{variables?.repRanges?.compound?.join('-') || 'N/A'}</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">{tVars('isolationReps')}</div>
                    <div className="font-semibold">{variables?.repRanges?.isolation?.join('-') || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* RIR Target */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">{tVars('rirTarget')}</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">{tVars('normal')}</div>
                    <div className="font-semibold">{variables?.rirTarget?.normal ?? 'N/A'} RIR</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">{tVars('intense')}</div>
                    <div className="font-semibold">{variables?.rirTarget?.intense ?? 'N/A'} RIR</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">{tVars('deload')}</div>
                    <div className="font-semibold">{variables?.rirTarget?.deload ?? 'N/A'} RIR</div>
                  </div>
                </div>
                {variables?.rirTarget?.context && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-900 dark:text-blue-200">{variables.rirTarget.context}</p>
                  </div>
                )}
              </div>

              {/* Rest Periods */}
              {(variables?.restPeriods || variables?.rest) && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">{tVars('restPeriods')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {variables?.restPeriods?.compound && (
                      <div className="bg-background p-3 rounded border">
                        <div className="text-muted-foreground">{tVars('compound')}</div>
                        <div className="font-semibold">
                          {variables.restPeriods.compound.join('-')}s
                        </div>
                      </div>
                    )}
                    {variables?.restPeriods?.isolation && (
                      <div className="bg-background p-3 rounded border">
                        <div className="text-muted-foreground">{tVars('isolation')}</div>
                        <div className="font-semibold">
                          {variables.restPeriods.isolation.join('-')}s
                        </div>
                      </div>
                    )}
                    {variables?.rest?.betweenSets && (
                      <div className="bg-background p-3 rounded border col-span-2">
                        <div className="text-muted-foreground">{tVars('betweenSets')}</div>
                        <div className="font-semibold">
                          {variables.rest.betweenSets.join('-')}s ({Math.floor(variables.rest.betweenSets[0]/60)}-{Math.floor(variables.rest.betweenSets[1]/60)} min)
                        </div>
                      </div>
                    )}
                  </div>
                  {(variables?.restPeriods?.autoRegulation || variables?.rest?.rationale) && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-900 dark:text-blue-200">
                        {variables?.restPeriods?.autoRegulation || variables?.rest?.rationale}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tempo */}
              {variables?.tempo && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">{tVars('tempo')}</h4>
                  <div className="bg-background p-4 rounded border">
                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold font-mono">
                        {formatTempo(variables.tempo)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tVars('tempoFormat')}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold">{variables.tempo.eccentric}s</div>
                        <div className="text-muted-foreground">{tVars('eccentric')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{variables.tempo.pauseBottom}s</div>
                        <div className="text-muted-foreground">{tVars('pause')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{variables.tempo.concentric}s</div>
                        <div className="text-muted-foreground">{tVars('concentric')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{variables.tempo.pauseTop}s</div>
                        <div className="text-muted-foreground">{tVars('top')}</div>
                      </div>
                    </div>
                  </div>
                  {variables.tempo.rationale && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-900 dark:text-blue-200">{variables.tempo.rationale}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Frequency */}
              {variables?.frequency && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">{tVars('trainingFrequency')}</h4>
                  <div className="bg-background p-3 rounded border space-y-2 text-sm">
                    {variables.frequency.muscleGroupDays && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tVars('perMuscleGroup')}</span>
                        <span className="font-semibold">{variables.frequency.muscleGroupDays}x/week</span>
                      </div>
                    )}
                    {variables.frequency.weeklyPattern && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tVars('pattern')}</span>
                        <span className="font-semibold text-xs">{variables.frequency.weeklyPattern}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Session Duration */}
              {variables?.sessionDuration && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">{tVars('sessionDuration')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-background p-3 rounded border">
                      <div className="text-muted-foreground">{tVars('duration')}</div>
                      <div className="font-semibold">
                        {variables.sessionDuration.typical?.join('-')} min
                      </div>
                    </div>
                    {variables.sessionDuration.totalSets && (
                      <div className="bg-background p-3 rounded border">
                        <div className="text-muted-foreground">{tVars('totalSets')}</div>
                        <div className="font-semibold">
                          {variables.sessionDuration.totalSets.join('-')} sets
                        </div>
                      </div>
                    )}
                  </div>
                  {variables.sessionDuration.rationale && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-900 dark:text-blue-200">{variables.sessionDuration.rationale}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progression Strategy - Accordion */}
        {progression && (
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader icon={TrendingUp} title={tSections('progressionStrategy')} section="progression" />
            {expandedSections.has('progression') && (
              <div className="p-4 bg-accent/50 space-y-3">
                <div className="bg-background p-3 rounded border">
                  <div className="text-sm font-semibold mb-1">{tVars('priority')}</div>
                  <div className="text-sm">
                    {progression?.priority
                      ? progression.priority
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ')
                      : 'N/A'}
                  </div>
                </div>
                {progression?.weightIncrement && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1">{tVars('weightIncrement')}</div>
                    <div className="text-sm">{progression.weightIncrement.default}kg {tVars('default')}</div>
                  </div>
                )}
                {progression?.whenToAddWeight && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1">{tVars('whenToAddWeight')}</div>
                    <div className="text-sm">{progression.whenToAddWeight}</div>
                  </div>
                )}
                {progression?.setProgression && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1">{tVars('setProgressionStrategy')}</div>
                    <div className="text-sm">
                      {typeof progression.setProgression === 'string'
                        ? progression.setProgression
                        : progression.setProgression.strategy?.replace(/_/g, ' ') || 'N/A'}
                    </div>
                    {typeof progression.setProgression === 'object' && progression.setProgression.conditions && (
                      <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-900 dark:text-blue-200">
                          {typeof progression.setProgression.conditions === 'string'
                            ? progression.setProgression.conditions
                            : JSON.stringify(progression.setProgression.conditions)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {progression?.deloadTriggers && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1">{tVars('deloadTriggers')}</div>
                    <ul className="text-sm space-y-1 mt-2">
                      {progression.deloadTriggers.map((trigger: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{trigger}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Volume Landmarks - Accordion (if exists) */}
        {volumeLandmarks && (
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader icon={Activity} title={tSections('volumeGuidelines')} section="volume" />
            {expandedSections.has('volume') && (
              <div className="p-4 bg-accent/50 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded border border-green-200 dark:border-green-800">
                    <div className="font-semibold text-green-900 dark:text-green-200">{tVol('mev')}</div>
                    <div className="text-green-700 dark:text-green-300">{tVol('mevFull')}</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                    <div className="font-semibold text-blue-900 dark:text-blue-200">{tVol('mav')}</div>
                    <div className="text-blue-700 dark:text-blue-300">{tVol('mavFull')}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded border border-orange-200 dark:border-orange-800">
                    <div className="font-semibold text-orange-900 dark:text-orange-200">{tVol('mrv')}</div>
                    <div className="text-orange-700 dark:text-orange-300">{tVol('mrvFull')}</div>
                  </div>
                </div>
                {volumeLandmarks.muscleGroups && Object.entries(volumeLandmarks.muscleGroups).map(([muscle, volumes]: [string, any]) => (
                  <div key={muscle} className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-2 capitalize">{muscle.replace('_', ' ')}</div>
                    <div className="flex gap-4 text-xs">
                      <div><span className="text-muted-foreground">MEV:</span> <span className="font-semibold">{volumes.mev}</span></div>
                      <div><span className="text-muted-foreground">MAV:</span> <span className="font-semibold">{volumes.mav}</span></div>
                      <div><span className="text-muted-foreground">MRV:</span> <span className="font-semibold">{volumes.mrv}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Advanced Techniques - Accordion (if exists) */}
        {advancedTechniques && (
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader icon={Zap} title={tSections('advancedTechniques')} section="techniques" />
            {expandedSections.has('techniques') && (
              <div className="p-4 bg-accent/50 space-y-3">
                {Object.entries(advancedTechniques).map(([key, technique]: [string, any]) => (
                  <div key={key} className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-2 capitalize flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    {technique.when && (
                      <div className="text-xs mb-1">
                        <span className="text-muted-foreground">{tPer('when')}</span> {technique.when}
                      </div>
                    )}
                    {technique.protocol && (
                      <div className="text-xs mb-1">
                        <span className="text-muted-foreground">{tPer('how')}</span> {technique.protocol}
                      </div>
                    )}
                    {technique.frequency && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">{tPer('frequency')}</span> {technique.frequency}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Periodization - Accordion (if exists) */}
        {periodization && (
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader icon={Calendar} title={tSections('periodization')} section="periodization" />
            {expandedSections.has('periodization') && (
              <div className="p-4 bg-accent/50 space-y-3">
                {periodization.model && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold">{tPer('model')}</div>
                    <div className="text-sm">{periodization.model}</div>
                  </div>
                )}
                {periodization.cycleDuration && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold">{tPer('cycleDuration')}</div>
                    <div className="text-sm">{periodization.cycleDuration}</div>
                  </div>
                )}
                {periodization.phases && Object.entries(periodization.phases).map(([phase, details]: [string, any]) => (
                  <div key={phase} className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1 capitalize">{phase.replace('_', ' ')} {tPer('phase')}</div>
                    {typeof details === 'object' && details.description && (
                      <div className="text-xs">{details.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Key Principles/Rationales - Accordion (if exists) */}
        {rationales && Object.keys(rationales).length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader icon={Info} title={tSections('keyPrinciples')} section="rationales" />
            {expandedSections.has('rationales') && (
              <div className="p-4 bg-accent/50 space-y-3">
                {Object.entries(rationales).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-xs text-muted-foreground">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Perfect For You If... */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-900 dark:text-green-300">
              {tPerfect('title')}
            </h3>
          </div>
          <ul className="space-y-2">
            {perfectForCriteria.map((criterion, idx) => (
              <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t">
        <Button
          onClick={onClose}
          className="w-full"
        >
          {t('closeButton')}
        </Button>
      </div>
    </div>
  )
}
