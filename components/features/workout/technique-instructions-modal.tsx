'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import type { AppliedTechnique } from '@/lib/types/advanced-techniques'
import {
  TECHNIQUE_I18N_KEYS,
  TECHNIQUE_COMPATIBILITY,
  isDropSetConfig,
  isRestPauseConfig,
  isSupersetConfig,
  isTopSetBackoffConfig,
  isMyoRepsConfig,
  isClusterSetConfig,
  isPyramidConfig,
} from '@/lib/types/advanced-techniques'
import {
  Zap,
  Timer,
  Repeat,
  TrendingUp,
  Flame,
  Target,
  ArrowUpDown,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TechniqueInstructionsModalProps {
  technique: AppliedTechnique | null
  exerciseName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TechniqueInstructionsModal({
  technique,
  exerciseName,
  open,
  onOpenChange,
}: TechniqueInstructionsModalProps) {
  const t = useTranslations('workout.techniques')

  if (!technique) return null

  const i18nKey = TECHNIQUE_I18N_KEYS[technique.technique]
  const compatibility = TECHNIQUE_COMPATIBILITY[technique.technique]

  // Get technique name with fallback
  const techniqueName = (() => {
    try {
      return t(`${i18nKey}.name`)
    } catch {
      return technique.technique.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  })()

  // Get technique description with fallback
  const techniqueDescription = (() => {
    try {
      return t(`${i18nKey}.description`)
    } catch {
      return compatibility.description
    }
  })()

  // Generate step-by-step instructions based on technique type and config
  const instructions = generateInstructions(technique)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <TechniqueIcon type={technique.technique} className="h-5 w-5" />
            {techniqueName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Exercise name if provided */}
          {exerciseName && (
            <div className="text-sm text-gray-400">
              Applied to: <span className="font-medium text-white">{exerciseName}</span>
            </div>
          )}

          {/* Description */}
          <div className="text-sm text-gray-400">
            {techniqueDescription}
          </div>

          {/* Configuration summary */}
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
              <Info className="h-4 w-4" />
              Configuration
            </div>
            <ConfigSummary technique={technique} />
          </div>

          {/* Step-by-step instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              How to Execute
            </div>
            <ol className="space-y-2 ml-1">
              {instructions.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* AI Rationale */}
          {technique.rationale && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                Why this technique?
              </div>
              <p className="text-sm text-gray-300 italic">
                {technique.rationale}
              </p>
            </div>
          )}

          {/* Experience level badge */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-gray-400">Recommended level:</span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded border',
              compatibility.minExperience === 'beginner' && 'border-green-500/30 text-green-400 bg-green-500/10',
              compatibility.minExperience === 'intermediate' && 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
              compatibility.minExperience === 'advanced' && 'border-red-500/30 text-red-400 bg-red-500/10'
            )}>
              {compatibility.minExperience.charAt(0).toUpperCase() + compatibility.minExperience.slice(1)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper component for technique icons
function TechniqueIcon({ type, className }: { type: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    drop_set: <Zap className={className} />,
    rest_pause: <Timer className={className} />,
    superset: <Repeat className={className} />,
    top_set_backoff: <TrendingUp className={className} />,
    myo_reps: <Flame className={className} />,
    cluster_set: <Target className={className} />,
    pyramid: <ArrowUpDown className={className} />,
  }
  return <>{icons[type] || <Zap className={className} />}</>
}

// Helper component for config summary
function ConfigSummary({ technique }: { technique: AppliedTechnique }) {
  const { config } = technique

  if (isDropSetConfig(config)) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Drops:</span>{' '}
          <span className="font-medium text-white">{config.drops}</span>
        </div>
        <div>
          <span className="text-gray-400">Weight reduction:</span>{' '}
          <span className="font-medium text-white">{config.dropPercentage}%</span>
        </div>
      </div>
    )
  }

  if (isRestPauseConfig(config)) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Mini-sets:</span>{' '}
          <span className="font-medium text-white">{config.miniSets}</span>
        </div>
        <div>
          <span className="text-gray-400">Rest between:</span>{' '}
          <span className="font-medium text-white">{config.restSeconds}s</span>
        </div>
      </div>
    )
  }

  if (isSupersetConfig(config)) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Paired with:</span>{' '}
          <span className="font-medium text-white">Exercise #{config.pairedExerciseIndex + 1}</span>
        </div>
        <div>
          <span className="text-gray-400">Rest after both:</span>{' '}
          <span className="font-medium text-white">{config.restAfterBoth}s</span>
        </div>
      </div>
    )
  }

  if (isTopSetBackoffConfig(config)) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Top set:</span>{' '}
          <span className="font-medium text-white">{config.topSetReps} reps</span>
        </div>
        <div>
          <span className="text-gray-400">Backoff sets:</span>{' '}
          <span className="font-medium text-white">{config.backoffSets} x {config.backoffReps} reps</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-400">Backoff weight:</span>{' '}
          <span className="font-medium text-white">-{config.backoffPercentage}%</span>
        </div>
      </div>
    )
  }

  if (isMyoRepsConfig(config)) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Activation:</span>{' '}
          <span className="font-medium text-white">{config.activationReps} reps</span>
        </div>
        <div>
          <span className="text-gray-400">Mini-sets:</span>{' '}
          <span className="font-medium text-white">{config.miniSets} x {config.miniSetReps} reps</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-400">Rest between mini-sets:</span>{' '}
          <span className="font-medium text-white">{config.restSeconds}s</span>
        </div>
      </div>
    )
  }

  if (isClusterSetConfig(config)) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Clusters:</span>{' '}
          <span className="font-medium text-white">{config.clusters}</span>
        </div>
        <div>
          <span className="text-gray-400">Reps per cluster:</span>{' '}
          <span className="font-medium text-white">{config.repsPerCluster}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-400">Intra-rest:</span>{' '}
          <span className="font-medium text-white">{config.intraRestSeconds}s</span>
        </div>
      </div>
    )
  }

  if (isPyramidConfig(config)) {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Direction:</span>{' '}
          <span className="font-medium text-white capitalize">{config.direction}</span>
        </div>
        <div>
          <span className="text-gray-400">Steps:</span>{' '}
          <span className="font-medium text-white">{config.steps}</span>
        </div>
      </div>
    )
  }

  return null
}

// Generate step-by-step instructions based on technique
function generateInstructions(technique: AppliedTechnique): string[] {
  const { config } = technique

  if (isDropSetConfig(config)) {
    return [
      'Perform your set to near failure with your working weight',
      `Immediately reduce weight by ${config.dropPercentage}% (no rest!)`,
      'Continue to near failure with the reduced weight',
      `Repeat the drop ${config.drops - 1} more time(s)`,
      'Rest only after completing all drops',
    ]
  }

  if (isRestPauseConfig(config)) {
    return [
      'Perform your initial set to near failure',
      `Rest for exactly ${config.restSeconds} seconds (use a timer)`,
      'Continue with the same weight, perform as many reps as possible',
      `Repeat rest-pause ${config.miniSets - 1} more time(s)`,
      'Take your full rest period after all mini-sets',
    ]
  }

  if (isSupersetConfig(config)) {
    return [
      'Complete your set of this exercise',
      'Immediately move to the paired exercise (no rest)',
      'Complete your set of the paired exercise',
      `Rest ${config.restAfterBoth} seconds after completing both exercises`,
      'Repeat for all planned sets',
    ]
  }

  if (isTopSetBackoffConfig(config)) {
    return [
      `Warm up progressively to your top set weight`,
      `Perform 1 heavy top set of ${config.topSetReps} reps at RPE 8-9`,
      `Reduce weight by ${config.backoffPercentage}%`,
      `Perform ${config.backoffSets} backoff sets of ${config.backoffReps} reps`,
      'Focus on quality reps with the lighter weight',
    ]
  }

  if (isMyoRepsConfig(config)) {
    return [
      `Perform activation set: ${config.activationReps} reps to 1-2 RIR`,
      `Rest ${config.restSeconds} seconds (very brief!)`,
      `Perform ${config.miniSetReps} reps (mini-set 1)`,
      `Repeat rest + mini-set ${config.miniSets - 1} more times`,
      'Stop when you can no longer complete target mini-set reps',
    ]
  }

  if (isClusterSetConfig(config)) {
    return [
      'Load the bar with your heavy working weight',
      `Perform ${config.repsPerCluster} reps`,
      `Rest ${config.intraRestSeconds} seconds (stay in position)`,
      `Repeat for ${config.clusters} total clusters`,
      'Rack the weight and take your full rest',
    ]
  }

  if (isPyramidConfig(config)) {
    const direction = config.direction
    if (direction === 'ascending') {
      return [
        'Start with a lighter weight and higher reps',
        `Increase weight each set (${config.steps} total sets)`,
        'Decrease reps as weight increases',
        'Final set should be heaviest with lowest reps',
      ]
    } else if (direction === 'descending') {
      return [
        'Start with your heaviest weight and lowest reps',
        `Decrease weight each set (${config.steps} total sets)`,
        'Increase reps as weight decreases',
        'Final set should be lightest with highest reps',
      ]
    } else {
      return [
        'Start with lighter weight, higher reps',
        'Increase weight and decrease reps to the peak',
        `Then reverse: decrease weight, increase reps (${config.steps} total steps)`,
        'Form a pyramid pattern with your sets',
      ]
    }
  }

  return ['Follow the technique as prescribed by your coach']
}
