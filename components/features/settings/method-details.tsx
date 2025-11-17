'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronRight, BookOpen, TrendingUp, Target, Zap, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { KnowledgeEngine } from '@/lib/knowledge/engine'
import type { TrainingApproach } from '@/lib/knowledge/types'

interface MethodDetailsProps {
  approachId: string
}

export function MethodDetails({ approachId }: MethodDetailsProps) {
  const t = useTranslations('settings.methodDetails')
  const [approach, setApproach] = useState<TrainingApproach | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['philosophy']))

  useEffect(() => {
    const loadApproach = async () => {
      try {
        const knowledge = new KnowledgeEngine()
        const data = await knowledge.loadApproach(approachId)
        setApproach(data)
      } catch (error) {
        console.error('Failed to load approach:', error)
      } finally {
        setLoading(false)
      }
    }

    loadApproach()
  }, [approachId])

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

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">{t('loading')}</div>
        </div>
      </Card>
    )
  }

  if (!approach) {
    return (
      <Card className="p-6">
        <div className="text-gray-400">{t('notFound')}</div>
      </Card>
    )
  }

  const SectionHeader = ({ icon: Icon, title, section }: { icon: any; title: string; section: string }) => {
    const isExpanded = expandedSections.has(section)
    return (
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
    )
  }

  const formatTempo = (tempo: any) => {
    if (!tempo) return null
    return `${tempo.eccentric}-${tempo.pauseBottom}-${tempo.concentric}-${tempo.pauseTop}`
  }

  return (
    <Card className="p-6 bg-gray-900/50 border-gray-800">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">{approach.name}</h2>
        </div>
        {approach.creator && (
          <p className="text-sm text-gray-400">{t('byCreator', { creator: approach.creator })}</p>
        )}
      </div>

      <div className="space-y-2">
        {/* Philosophy */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <SectionHeader icon={BookOpen} title={t('sections.philosophy')} section="philosophy" />
          {expandedSections.has('philosophy') && (
            <div className="p-4 bg-gray-900/30">
              <p className="text-gray-300 leading-relaxed">{approach.philosophy}</p>
            </div>
          )}
        </div>

        {/* Training Variables */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <SectionHeader icon={Target} title={t('sections.trainingVariables')} section="variables" />
          {expandedSections.has('variables') && (
            <div className="p-4 bg-gray-900/30 space-y-4">
              {/* Sets & Reps */}
              <div>
                <h4 className="text-sm font-semibold text-blue-300 mb-2">{t('variables.setsReps')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">{t('variables.workingSets')}</div>
                    <div className="text-white font-semibold">{approach.variables.setsPerExercise.working} sets</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">{t('variables.warmup')}</div>
                    <div className="text-white font-semibold">{approach.variables.setsPerExercise.warmup}</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">{t('variables.compoundReps')}</div>
                    <div className="text-white font-semibold">{approach.variables.repRanges.compound.join('-')} reps</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">{t('variables.isolationReps')}</div>
                    <div className="text-white font-semibold">{approach.variables.repRanges.isolation.join('-')} reps</div>
                  </div>
                </div>
              </div>

              {/* RIR */}
              <div>
                <h4 className="text-sm font-semibold text-blue-300 mb-2">{t('variables.rirTarget')}</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">{t('variables.normal')}</div>
                    <div className="text-white font-semibold">{approach.variables.rirTarget.normal} RIR</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">{t('variables.intense')}</div>
                    <div className="text-white font-semibold">{approach.variables.rirTarget.intense} RIR</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">{t('variables.deload')}</div>
                    <div className="text-white font-semibold">{approach.variables.rirTarget.deload} RIR</div>
                  </div>
                </div>
              </div>

              {/* Rest Periods */}
              <div>
                <h4 className="text-sm font-semibold text-blue-300 mb-2">{t('variables.restPeriods')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded flex justify-between">
                    <span className="text-gray-400">{t('variables.compoundExercises')}</span>
                    <span className="text-white font-semibold">{approach.variables.restPeriods.compound.join('-')}s</span>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded flex justify-between">
                    <span className="text-gray-400">{t('variables.isolationExercises')}</span>
                    <span className="text-white font-semibold">{approach.variables.restPeriods.isolation.join('-')}s</span>
                  </div>
                  {approach.variables.restPeriods.autoRegulation && (
                    <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                      <div className="text-blue-300 text-xs mb-1">{t('variables.autoRegulation')}</div>
                      <div className="text-gray-300">{approach.variables.restPeriods.autoRegulation}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tempo */}
              {approach.variables.tempo && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">{t('variables.executionTempo')}</h4>
                  <div className="bg-gray-800/50 p-4 rounded">
                    <div className="text-center mb-2">
                      <div className="text-3xl font-mono font-bold text-white">{formatTempo(approach.variables.tempo)}</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-blue-300 font-semibold">{approach.variables.tempo.eccentric}s</div>
                        <div className="text-gray-400">{t('variables.eccentric')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-300 font-semibold">{approach.variables.tempo.pauseBottom}s</div>
                        <div className="text-gray-400">{t('variables.pauseBottom')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-300 font-semibold">{approach.variables.tempo.concentric}s</div>
                        <div className="text-gray-400">{t('variables.concentric')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-amber-300 font-semibold">{approach.variables.tempo.pauseTop}s</div>
                        <div className="text-gray-400">{t('variables.pauseTop')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Frequency */}
              <div>
                <h4 className="text-sm font-semibold text-blue-300 mb-2">{t('variables.trainingFrequency')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded flex justify-between">
                    <span className="text-gray-400">{t('variables.perMuscleGroup')}</span>
                    <span className="text-white font-semibold">{approach.variables.frequency.muscleGroupDays}x/{t('variables.week')}</span>
                  </div>
                  <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                    <div className="text-blue-300 text-xs mb-1">{t('variables.weeklyPattern')}</div>
                    <div className="text-gray-300">{approach.variables.frequency.weeklyPattern}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progression Rules */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <SectionHeader icon={TrendingUp} title={t('sections.progressionRules')} section="progression" />
          {expandedSections.has('progression') && (
            <div className="p-4 bg-gray-900/30 space-y-4">
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-gray-400 text-sm mb-1">{t('variables.priority')}</div>
                <div className="text-white font-semibold capitalize">{approach.progression.priority.replace('_', ' ')}</div>
              </div>
              <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                <div className="text-blue-300 text-sm mb-2">{t('variables.whenToAddWeight')}</div>
                <div className="text-gray-300">{approach.progression.rules.whenToAddWeight}</div>
              </div>
              {approach.progression.setProgression && (
                <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                  <div className="text-blue-300 text-sm mb-2">{t('variables.setProgressionStrategy')}</div>
                  <div className="text-gray-300 mb-1">{approach.progression.setProgression.strategy.replace(/_/g, ' ')}</div>
                  <div className="text-gray-400 text-sm">
                    {typeof approach.progression.setProgression.conditions === 'string'
                      ? approach.progression.setProgression.conditions
                      : JSON.stringify(approach.progression.setProgression.conditions)}
                  </div>
                </div>
              )}
              {approach.progression.rules.deloadTriggers && approach.progression.rules.deloadTriggers.length > 0 && (
                <div className="bg-amber-900/20 p-3 rounded border border-amber-500/30">
                  <div className="text-amber-300 text-sm mb-2">⚠️ {t('variables.deloadTriggers')}</div>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    {approach.progression.rules.deloadTriggers.map((trigger, idx) => (
                      <li key={idx}>{trigger}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Volume Landmarks */}
        {approach.volumeLandmarks && (
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <SectionHeader icon={Target} title={t('sections.volumeLandmarks')} section="volume" />
            {expandedSections.has('volume') && (
              <div className="p-4 bg-gray-900/30">
                <div className="mb-3 p-3 bg-blue-900/20 rounded border border-blue-500/30">
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>{t('volumeLandmarks.mevDesc')}</div>
                    <div>{t('volumeLandmarks.mavDesc')}</div>
                    <div>{t('volumeLandmarks.mrvDesc')}</div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {Object.entries(approach.volumeLandmarks.muscleGroups).map(([muscle, landmarks]) => (
                    <div key={muscle} className="bg-gray-800/50 p-3 rounded">
                      <div className="text-white font-semibold mb-2 capitalize">{muscle}</div>
                      <div className="flex gap-3 text-sm">
                        <div className="flex-1 bg-green-900/30 p-2 rounded border border-green-500/30">
                          <div className="text-green-300 text-xs">MEV</div>
                          <div className="text-white font-semibold">{landmarks.mev} sets/week</div>
                        </div>
                        <div className="flex-1 bg-blue-900/30 p-2 rounded border border-blue-500/30">
                          <div className="text-blue-300 text-xs">MAV</div>
                          <div className="text-white font-semibold">{landmarks.mav} sets/week</div>
                        </div>
                        <div className="flex-1 bg-red-900/30 p-2 rounded border border-red-500/30">
                          <div className="text-red-300 text-xs">MRV</div>
                          <div className="text-white font-semibold">{landmarks.mrv} sets/week</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced Techniques */}
        {approach.advancedTechniques && Object.keys(approach.advancedTechniques).length > 0 && (
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <SectionHeader icon={Zap} title={t('sections.advancedTechniques')} section="advanced" />
            {expandedSections.has('advanced') && (
              <div className="p-4 bg-gray-900/30 space-y-3">
                {Object.entries(approach.advancedTechniques).map(([name, technique]) => (
                  <div key={name} className="bg-gray-800/50 p-3 rounded">
                    <h4 className="text-white font-semibold mb-2 capitalize">{name.replace(/_/g, ' ')}</h4>
                    <div className="space-y-2 text-sm">
                      {technique.when && (
                        <div className="text-gray-300">
                          <span className="text-blue-300">{t('advancedTechniques.when')}</span> {technique.when}
                        </div>
                      )}
                      {technique.protocol && (
                        <div className="text-gray-300">
                          <span className="text-blue-300">{t('advancedTechniques.protocol')}</span> {technique.protocol}
                        </div>
                      )}
                      {technique.frequency && (
                        <div className="text-gray-300">
                          <span className="text-blue-300">{t('advancedTechniques.frequency')}</span> {technique.frequency}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Periodization */}
        {approach.periodization && (
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <SectionHeader icon={Calendar} title={t('sections.periodization')} section="periodization" />
            {expandedSections.has('periodization') && (
              <div className="p-4 bg-gray-900/30 space-y-4">
                {approach.periodization.mesocycleLength && (
                  <div className="bg-gray-800/50 p-3 rounded flex justify-between">
                    <span className="text-gray-400">{t('periodization.mesocycleLength')}</span>
                    <span className="text-white font-semibold">{approach.periodization.mesocycleLength} {t('periodization.weeks')}</span>
                  </div>
                )}

                {approach.periodization.accumulationPhase && (
                  <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
                    <h4 className="text-green-300 font-semibold mb-2">{t('periodization.accumulation')}</h4>
                    <div className="text-sm space-y-1">
                      <div className="text-gray-300">{t('periodization.duration')} {approach.periodization.accumulationPhase.weeks} {t('periodization.weeks')}</div>
                      <div className="text-gray-300">{t('periodization.focus')} {approach.periodization.accumulationPhase.focus}</div>
                      <div className="text-gray-300">{t('periodization.volume')} {t('periodization.baselinePercent', { percent: (approach.periodization.accumulationPhase.volumeMultiplier * 100) })}</div>
                    </div>
                  </div>
                )}

                {approach.periodization.intensificationPhase && (
                  <div className="bg-orange-900/20 p-3 rounded border border-orange-500/30">
                    <h4 className="text-orange-300 font-semibold mb-2">{t('periodization.intensification')}</h4>
                    <div className="text-sm space-y-1">
                      <div className="text-gray-300">{t('periodization.duration')} {approach.periodization.intensificationPhase.weeks} {t('periodization.weeks')}</div>
                      <div className="text-gray-300">{t('periodization.focus')} {approach.periodization.intensificationPhase.focus}</div>
                      <div className="text-gray-300">{t('periodization.volume')} {t('periodization.baselinePercent', { percent: (approach.periodization.intensificationPhase.volumeMultiplier * 100) })}</div>
                      {approach.periodization.intensificationPhase.techniquesIntroduced && (
                        <div className="text-gray-300 mt-2">
                          <span className="text-orange-300">{t('periodization.techniquesIntroduced')}</span>
                          <div className="ml-4 mt-1">
                            {approach.periodization.intensificationPhase.techniquesIntroduced.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {approach.periodization.deloadPhase && (
                  <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                    <h4 className="text-blue-300 font-semibold mb-2">{t('periodization.deload')}</h4>
                    <div className="text-sm space-y-1">
                      <div className="text-gray-300">{t('periodization.frequency')} {approach.periodization.deloadPhase.frequency}</div>
                      <div className="text-gray-300">{t('periodization.volumeReduction')} {approach.periodization.deloadPhase.volumeReduction}%</div>
                      <div className="text-gray-300">{t('periodization.intensity')} {approach.periodization.deloadPhase.intensityMaintenance}</div>
                      <div className="text-gray-300">{t('periodization.duration')} {approach.periodization.deloadPhase.duration}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
