'use client'

import { useState } from 'react'
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
      return { level: 'Beginner-Friendly', color: 'green', description: 'Perfect for those new to structured training' }
    } else if (name.includes('advanced') || name.includes('powerlifting') || name.includes('heavy duty')) {
      return { level: 'Advanced', color: 'red', description: 'Best suited for experienced lifters' }
    }
    return { level: 'All Levels', color: 'blue', description: 'Suitable for beginners to advanced athletes' }
  }

  // Extract "perfect for" criteria
  const getPerfectForCriteria = () => {
    const criteria = []
    const name = approach.name.toLowerCase()
    const philosophy = approach.philosophy?.toLowerCase() || ''

    if (philosophy.includes('hypertrophy') || name.includes('hypertrophy')) {
      criteria.push('Building muscle mass and size')
    }
    if (philosophy.includes('strength') || name.includes('strength')) {
      criteria.push('Increasing maximal strength')
    }
    if (philosophy.includes('volume')) {
      criteria.push('Those who can handle high training volumes')
    }
    if (philosophy.includes('recovery') || philosophy.includes('sustainable')) {
      criteria.push('Sustainable long-term progress')
    }
    if (philosophy.includes('powerlifting') || name.includes('powerlifting')) {
      criteria.push('Powerlifting-specific goals')
    }
    if (philosophy.includes('general') || name.includes('balanced')) {
      criteria.push('Balanced, well-rounded development')
    }

    if (criteria.length === 0) {
      criteria.push('Structured progressive training')
      criteria.push('Evidence-based programming')
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
              by {approach.creator}
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
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">Philosophy</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {approach.philosophy}
            </p>
          </div>
        )}

        {/* Training Variables - Accordion */}
        <div className="border rounded-lg overflow-hidden">
          <SectionHeader icon={Target} title="Training Variables" section="variables" />
          {expandedSections.has('variables') && (
            <div className="p-4 bg-accent/50 space-y-4">
              {/* Sets & Reps */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">Sets & Reps</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">Working Sets</div>
                    <div className="font-semibold">{variables?.setsPerExercise?.working || 'N/A'}</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">Warmup</div>
                    <div className="font-semibold text-xs">{variables?.setsPerExercise?.warmup || 'None specified'}</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">Compound Reps</div>
                    <div className="font-semibold">{variables?.repRanges?.compound?.join('-') || 'N/A'}</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">Isolation Reps</div>
                    <div className="font-semibold">{variables?.repRanges?.isolation?.join('-') || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* RIR Target */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">RIR Target (Reps In Reserve)</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">Normal</div>
                    <div className="font-semibold">{variables?.rirTarget?.normal ?? 'N/A'} RIR</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">Intense</div>
                    <div className="font-semibold">{variables?.rirTarget?.intense ?? 'N/A'} RIR</div>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <div className="text-muted-foreground">Deload</div>
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
                  <h4 className="text-sm font-semibold text-primary mb-2">Rest Periods</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {variables?.restPeriods?.compound && (
                      <div className="bg-background p-3 rounded border">
                        <div className="text-muted-foreground">Compound</div>
                        <div className="font-semibold">
                          {variables.restPeriods.compound.join('-')}s
                        </div>
                      </div>
                    )}
                    {variables?.restPeriods?.isolation && (
                      <div className="bg-background p-3 rounded border">
                        <div className="text-muted-foreground">Isolation</div>
                        <div className="font-semibold">
                          {variables.restPeriods.isolation.join('-')}s
                        </div>
                      </div>
                    )}
                    {variables?.rest?.betweenSets && (
                      <div className="bg-background p-3 rounded border col-span-2">
                        <div className="text-muted-foreground">Between Sets</div>
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
                  <h4 className="text-sm font-semibold text-primary mb-2">Tempo (Execution Speed)</h4>
                  <div className="bg-background p-4 rounded border">
                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold font-mono">
                        {formatTempo(variables.tempo)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Eccentric - Pause - Concentric - Top
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold">{variables.tempo.eccentric}s</div>
                        <div className="text-muted-foreground">Eccentric</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{variables.tempo.pauseBottom}s</div>
                        <div className="text-muted-foreground">Pause</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{variables.tempo.concentric}s</div>
                        <div className="text-muted-foreground">Concentric</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{variables.tempo.pauseTop}s</div>
                        <div className="text-muted-foreground">Top</div>
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
                  <h4 className="text-sm font-semibold text-primary mb-2">Training Frequency</h4>
                  <div className="bg-background p-3 rounded border space-y-2 text-sm">
                    {variables.frequency.muscleGroupDays && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Muscle Group:</span>
                        <span className="font-semibold">{variables.frequency.muscleGroupDays}x/week</span>
                      </div>
                    )}
                    {variables.frequency.weeklyPattern && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pattern:</span>
                        <span className="font-semibold text-xs">{variables.frequency.weeklyPattern}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Session Duration */}
              {variables?.sessionDuration && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">Session Duration</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-background p-3 rounded border">
                      <div className="text-muted-foreground">Duration</div>
                      <div className="font-semibold">
                        {variables.sessionDuration.typical?.join('-')} min
                      </div>
                    </div>
                    {variables.sessionDuration.totalSets && (
                      <div className="bg-background p-3 rounded border">
                        <div className="text-muted-foreground">Total Sets</div>
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
            <SectionHeader icon={TrendingUp} title="Progression Strategy" section="progression" />
            {expandedSections.has('progression') && (
              <div className="p-4 bg-accent/50 space-y-3">
                <div className="bg-background p-3 rounded border">
                  <div className="text-sm font-semibold mb-1">Priority</div>
                  <div className="text-sm capitalize">{progression?.priority?.replace('_', ' ') || 'N/A'}</div>
                </div>
                {progression?.weightIncrement && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1">Weight Increment</div>
                    <div className="text-sm">{progression.weightIncrement.default}kg default</div>
                  </div>
                )}
                {progression?.whenToAddWeight && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1">When to Add Weight</div>
                    <div className="text-sm">{progression.whenToAddWeight}</div>
                  </div>
                )}
                {progression?.setProgression && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1">Set Progression Strategy</div>
                    <div className="text-sm">{progression.setProgression}</div>
                  </div>
                )}
                {progression?.deloadTriggers && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1">Deload Triggers</div>
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
            <SectionHeader icon={Activity} title="Volume Guidelines (MEV/MAV/MRV)" section="volume" />
            {expandedSections.has('volume') && (
              <div className="p-4 bg-accent/50 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded border border-green-200 dark:border-green-800">
                    <div className="font-semibold text-green-900 dark:text-green-200">MEV</div>
                    <div className="text-green-700 dark:text-green-300">Minimum Effective</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                    <div className="font-semibold text-blue-900 dark:text-blue-200">MAV</div>
                    <div className="text-blue-700 dark:text-blue-300">Maximum Adaptive</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded border border-orange-200 dark:border-orange-800">
                    <div className="font-semibold text-orange-900 dark:text-orange-200">MRV</div>
                    <div className="text-orange-700 dark:text-orange-300">Maximum Recoverable</div>
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
            <SectionHeader icon={Zap} title="Advanced Techniques" section="techniques" />
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
                        <span className="text-muted-foreground">When:</span> {technique.when}
                      </div>
                    )}
                    {technique.protocol && (
                      <div className="text-xs mb-1">
                        <span className="text-muted-foreground">How:</span> {technique.protocol}
                      </div>
                    )}
                    {technique.frequency && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Frequency:</span> {technique.frequency}
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
            <SectionHeader icon={Calendar} title="Periodization" section="periodization" />
            {expandedSections.has('periodization') && (
              <div className="p-4 bg-accent/50 space-y-3">
                {periodization.model && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold">Model</div>
                    <div className="text-sm">{periodization.model}</div>
                  </div>
                )}
                {periodization.cycleDuration && (
                  <div className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold">Cycle Duration</div>
                    <div className="text-sm">{periodization.cycleDuration}</div>
                  </div>
                )}
                {periodization.phases && Object.entries(periodization.phases).map(([phase, details]: [string, any]) => (
                  <div key={phase} className="bg-background p-3 rounded border">
                    <div className="text-sm font-semibold mb-1 capitalize">{phase.replace('_', ' ')} Phase</div>
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
            <SectionHeader icon={Info} title="Key Principles" section="rationales" />
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
              Perfect For You If...
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
          Got it, thanks!
        </Button>
      </div>
    </div>
  )
}
