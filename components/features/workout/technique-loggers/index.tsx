'use client'

import type { AppliedTechnique, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'
import {
  isDropSetConfig,
  isRestPauseConfig,
  isMyoRepsConfig,
  isClusterSetConfig,
  isFst7ProtocolConfig,
  isLoadedStretchingConfig,
  isMechanicalDropSetConfig,
  isTopSetBackoffConfig,
  isPyramidConfig,
  isSupersetConfig,
  isGiantSetConfig,
  isPreExhaustConfig,
} from '@/lib/types/advanced-techniques'

import { DropSetLogger } from './drop-set-logger'
import { RestPauseLogger } from './rest-pause-logger'
import { MyoRepsLogger } from './myo-reps-logger'
import { ClusterSetLogger } from './cluster-set-logger'
import { Fst7Logger } from './fst7-logger'
import { LoadedStretchingLogger } from './loaded-stretching-logger'
import { MechanicalDropSetLogger } from './mechanical-drop-set-logger'
import { TopSetBackoffLogger } from './top-set-backoff-logger'
import { PyramidLogger } from './pyramid-logger'
import { SupersetLogger } from './superset-logger'
import { GiantSetLogger } from './giant-set-logger'
import { PreExhaustLogger } from './pre-exhaust-logger'

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

  if (isFst7ProtocolConfig(config)) {
    return (
      <Fst7Logger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isLoadedStretchingConfig(config)) {
    return (
      <LoadedStretchingLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isMechanicalDropSetConfig(config)) {
    return (
      <MechanicalDropSetLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isTopSetBackoffConfig(config)) {
    return (
      <TopSetBackoffLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isPyramidConfig(config)) {
    return (
      <PyramidLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isSupersetConfig(config)) {
    return (
      <SupersetLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isGiantSetConfig(config)) {
    return (
      <GiantSetLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  if (isPreExhaustConfig(config)) {
    return (
      <PreExhaustLogger
        config={config}
        initialWeight={initialWeight}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )
  }

  // For techniques without specialized loggers (lengthened_partials, forced_reps),
  // return null - these will use the standard set logger with technique info displayed
  console.warn(`No specialized logger for technique: ${technique.technique}`)
  return null
}

// Re-export individual loggers for direct use if needed
export { DropSetLogger } from './drop-set-logger'
export { RestPauseLogger } from './rest-pause-logger'
export { MyoRepsLogger } from './myo-reps-logger'
export { ClusterSetLogger } from './cluster-set-logger'
export { Fst7Logger } from './fst7-logger'
export { LoadedStretchingLogger } from './loaded-stretching-logger'
export { MechanicalDropSetLogger } from './mechanical-drop-set-logger'
export { TopSetBackoffLogger } from './top-set-backoff-logger'
export { PyramidLogger } from './pyramid-logger'
export { SupersetLogger } from './superset-logger'
export { GiantSetLogger } from './giant-set-logger'
export { PreExhaustLogger } from './pre-exhaust-logger'
