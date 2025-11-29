'use client'

import type { AppliedTechnique, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'
import {
  isDropSetConfig,
  isRestPauseConfig,
  isMyoRepsConfig,
  isClusterSetConfig,
} from '@/lib/types/advanced-techniques'

import { DropSetLogger } from './drop-set-logger'
import { RestPauseLogger } from './rest-pause-logger'
import { MyoRepsLogger } from './myo-reps-logger'
import { ClusterSetLogger } from './cluster-set-logger'

interface TechniqueSetLoggerProps {
  technique: AppliedTechnique
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

/**
 * Wrapper component that renders the appropriate technique logger
 * based on the technique type.
 */
export function TechniqueSetLogger({
  technique,
  initialWeight,
  onComplete,
  onCancel,
}: TechniqueSetLoggerProps) {
  const { config } = technique

  // Render appropriate logger based on technique type
  if (isDropSetConfig(config)) {
    return (
      <DropSetLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isRestPauseConfig(config)) {
    return (
      <RestPauseLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isMyoRepsConfig(config)) {
    return (
      <MyoRepsLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isClusterSetConfig(config)) {
    return (
      <ClusterSetLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  // For techniques without specialized loggers (superset, pyramid, top_set_backoff, giant_set),
  // return null - these will use the standard set logger with technique info displayed
  // TODO: Implement specialized loggers for remaining techniques
  console.warn(`No specialized logger for technique: ${technique.technique}`)
  return null
}

// Re-export individual loggers for direct use if needed
export { DropSetLogger } from './drop-set-logger'
export { RestPauseLogger } from './rest-pause-logger'
export { MyoRepsLogger } from './myo-reps-logger'
export { ClusterSetLogger } from './cluster-set-logger'
