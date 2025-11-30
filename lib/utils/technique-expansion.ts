/**
 * Technique Expansion Utility for Simple Workout Mode
 *
 * Converts advanced techniques into "virtual sets" that users can follow
 * without understanding the underlying technique theory.
 *
 * Example: A drop_set with 2 drops on 3 working sets becomes:
 * Set 1: 50kg x 12
 * Set 2: 50kg x 12
 * Set 3: 50kg x 10 (trigger set)
 * Set 4: 35kg x 8 [DROP]
 * Set 5: 25kg x 8 [DROP]
 */

import type {
  AppliedTechnique,
  TechniqueType,
  DropSetConfig,
  RestPauseConfig,
  MyoRepsConfig,
  ClusterSetConfig,
  Fst7ProtocolConfig,
} from '@/lib/types/advanced-techniques'

import {
  isDropSetConfig,
  isRestPauseConfig,
  isMyoRepsConfig,
  isClusterSetConfig,
  isFst7ProtocolConfig,
} from '@/lib/types/advanced-techniques'

// =============================================================================
// Types
// =============================================================================

export type TechniqueLabel = 'DROP' | 'MYO' | 'CLUSTER' | '+15s' | 'FST-7'

export interface VirtualSet {
  /** 1-indexed set number */
  setNumber: number
  /** Target weight for this set */
  weight: number
  /** Target reps for this set */
  targetReps: number
  /** Optional label to display (DROP, MYO, etc.) */
  label?: TechniqueLabel
  /** Override rest seconds (e.g., 15s for rest-pause mini-sets) */
  restSeconds?: number
}

export interface TechniqueExpansionResult {
  /** Array of virtual sets to execute */
  virtualSets: VirtualSet[]
  /** Whether this technique is supported in simple mode */
  isSupported: boolean
  /** Reason if not supported */
  unsupportedReason?: string
}

// =============================================================================
// Techniques NOT supported in Simple Mode
// =============================================================================

const UNSUPPORTED_TECHNIQUES: Partial<Record<TechniqueType, string>> = {
  superset: 'Requires pairing with another exercise',
  giant_set: 'Requires multiple exercises in sequence',
  top_set_backoff: 'Requires understanding of top set vs backoff sets',
  pyramid: 'Requires understanding of weight progression direction',
  mechanical_drop_set: 'Requires changing exercise variation',
  loaded_stretching: 'Requires timer and RPE tracking',
  forced_reps: 'Requires a training partner',
  pre_exhaust: 'Requires exercise pairing',
  lengthened_partials: 'Requires understanding of partial ROM',
}

// =============================================================================
// Main Expansion Function
// =============================================================================

/**
 * Expands an advanced technique into virtual sets for simple workout mode.
 *
 * @param technique - The applied technique from AI generation
 * @param baseWeight - The target working weight for the exercise
 * @param baseReps - The target reps (typically upper range)
 * @param baseSets - The original number of working sets
 * @returns Expansion result with virtual sets or unsupported reason
 */
export function expandTechniqueToVirtualSets(
  technique: AppliedTechnique,
  baseWeight: number,
  baseReps: number,
  baseSets: number
): TechniqueExpansionResult {
  const config = technique.config

  // Check if technique is unsupported
  if (technique.technique in UNSUPPORTED_TECHNIQUES) {
    return {
      virtualSets: generateNormalSets(baseWeight, baseReps, baseSets),
      isSupported: false,
      unsupportedReason: UNSUPPORTED_TECHNIQUES[technique.technique as keyof typeof UNSUPPORTED_TECHNIQUES],
    }
  }

  // Handle each supported technique type
  if (isDropSetConfig(config)) {
    return {
      virtualSets: expandDropSet(config, baseWeight, baseReps, baseSets),
      isSupported: true,
    }
  }

  if (isRestPauseConfig(config)) {
    return {
      virtualSets: expandRestPause(config, baseWeight, baseReps, baseSets),
      isSupported: true,
    }
  }

  if (isMyoRepsConfig(config)) {
    return {
      virtualSets: expandMyoReps(config, baseWeight, baseSets),
      isSupported: true,
    }
  }

  if (isClusterSetConfig(config)) {
    return {
      virtualSets: expandClusterSet(config, baseWeight, baseSets),
      isSupported: true,
    }
  }

  if (isFst7ProtocolConfig(config)) {
    return {
      virtualSets: expandFst7Protocol(config, baseWeight),
      isSupported: true,
    }
  }

  // Fallback: treat as normal sets if technique type not recognized
  return {
    virtualSets: generateNormalSets(baseWeight, baseReps, baseSets),
    isSupported: false,
    unsupportedReason: 'Technique type not supported in simple mode',
  }
}

// =============================================================================
// Technique-Specific Expansion Functions
// =============================================================================

/**
 * Generates normal sets without any technique
 */
function generateNormalSets(
  weight: number,
  reps: number,
  sets: number
): VirtualSet[] {
  return Array.from({ length: sets }, (_, i) => ({
    setNumber: i + 1,
    weight: roundWeight(weight),
    targetReps: reps,
  }))
}

/**
 * Expands a drop set into virtual sets
 *
 * Example: 3 working sets with 2 drops becomes:
 * Sets 1-2: normal weight
 * Set 3: normal weight (trigger)
 * Set 4: -30% weight [DROP]
 * Set 5: -30% weight [DROP]
 */
function expandDropSet(
  config: DropSetConfig,
  baseWeight: number,
  baseReps: number,
  baseSets: number
): VirtualSet[] {
  const virtualSets: VirtualSet[] = []

  // Normal working sets (all but trigger)
  for (let i = 0; i < baseSets - 1; i++) {
    virtualSets.push({
      setNumber: i + 1,
      weight: roundWeight(baseWeight),
      targetReps: baseReps,
    })
  }

  // Trigger set (last working set before drops)
  virtualSets.push({
    setNumber: baseSets,
    weight: roundWeight(baseWeight),
    targetReps: baseReps,
  })

  // Drop sets
  let currentWeight = baseWeight
  for (let drop = 1; drop <= config.drops; drop++) {
    currentWeight = currentWeight * (1 - config.dropPercentage / 100)
    virtualSets.push({
      setNumber: baseSets + drop,
      weight: roundWeight(currentWeight),
      targetReps: Math.max(6, baseReps - 2), // Slightly lower reps for drops
      label: 'DROP',
      restSeconds: 10, // Minimal rest for drops
    })
  }

  return virtualSets
}

/**
 * Expands rest-pause into virtual sets
 *
 * Example: 3 working sets with rest-pause on last becomes:
 * Sets 1-2: normal
 * Set 3: normal (trigger)
 * Set 4: same weight [+15s] (mini-set)
 * Set 5: same weight [+15s] (mini-set)
 */
function expandRestPause(
  config: RestPauseConfig,
  baseWeight: number,
  baseReps: number,
  baseSets: number
): VirtualSet[] {
  const virtualSets: VirtualSet[] = []

  // Normal working sets (all but trigger)
  for (let i = 0; i < baseSets - 1; i++) {
    virtualSets.push({
      setNumber: i + 1,
      weight: roundWeight(baseWeight),
      targetReps: baseReps,
    })
  }

  // Trigger set
  virtualSets.push({
    setNumber: baseSets,
    weight: roundWeight(baseWeight),
    targetReps: baseReps,
  })

  // Mini-sets (same weight, fewer reps expected)
  for (let miniSet = 1; miniSet <= config.miniSets; miniSet++) {
    virtualSets.push({
      setNumber: baseSets + miniSet,
      weight: roundWeight(baseWeight),
      targetReps: Math.max(2, Math.floor(baseReps / 3)), // ~3-5 reps expected
      label: '+15s',
      restSeconds: config.restSeconds,
    })
  }

  return virtualSets
}

/**
 * Expands myo-reps into virtual sets
 *
 * Example: 2 working sets with myo-reps becomes:
 * Set 1: normal
 * Set 2: activation (12-15 reps)
 * Set 3-5: mini-sets [MYO] (5 reps each)
 */
function expandMyoReps(
  config: MyoRepsConfig,
  baseWeight: number,
  baseSets: number
): VirtualSet[] {
  const virtualSets: VirtualSet[] = []

  // Normal working sets before myo-rep set
  for (let i = 0; i < baseSets - 1; i++) {
    virtualSets.push({
      setNumber: i + 1,
      weight: roundWeight(baseWeight),
      targetReps: config.activationReps,
    })
  }

  // Activation set (last working set becomes activation)
  virtualSets.push({
    setNumber: baseSets,
    weight: roundWeight(baseWeight),
    targetReps: config.activationReps,
  })

  // Mini-sets
  for (let miniSet = 1; miniSet <= config.miniSets; miniSet++) {
    virtualSets.push({
      setNumber: baseSets + miniSet,
      weight: roundWeight(baseWeight),
      targetReps: config.miniSetReps,
      label: 'MYO',
      restSeconds: config.restSeconds,
    })
  }

  return virtualSets
}

/**
 * Expands cluster set into virtual sets
 *
 * Example: Cluster set with 5 clusters of 2 reps becomes:
 * Set 1: 2 reps [CLUSTER]
 * Set 2: 2 reps [CLUSTER]
 * ... etc
 */
function expandClusterSet(
  config: ClusterSetConfig,
  baseWeight: number,
  baseSets: number
): VirtualSet[] {
  const virtualSets: VirtualSet[] = []

  // Normal sets before cluster set
  for (let i = 0; i < baseSets - 1; i++) {
    virtualSets.push({
      setNumber: i + 1,
      weight: roundWeight(baseWeight),
      targetReps: config.repsPerCluster * config.clusters, // Total volume equivalent
    })
  }

  // Cluster sets (replace last working set)
  for (let cluster = 0; cluster < config.clusters; cluster++) {
    virtualSets.push({
      setNumber: baseSets + cluster,
      weight: roundWeight(baseWeight),
      targetReps: config.repsPerCluster,
      label: 'CLUSTER',
      restSeconds: config.intraRestSeconds,
    })
  }

  return virtualSets
}

/**
 * Expands FST-7 protocol into virtual sets
 *
 * FST-7 is always 7 sets with short rest
 */
function expandFst7Protocol(
  config: Fst7ProtocolConfig,
  baseWeight: number
): VirtualSet[] {
  const virtualSets: VirtualSet[] = []

  // FST-7 is exactly 7 sets
  for (let i = 0; i < 7; i++) {
    virtualSets.push({
      setNumber: i + 1,
      weight: roundWeight(baseWeight),
      targetReps: config.targetReps,
      label: 'FST-7',
      restSeconds: config.restSeconds,
    })
  }

  return virtualSets
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Rounds weight to nearest 0.5kg (common increment for most gyms)
 */
function roundWeight(weight: number): number {
  return Math.round(weight * 2) / 2
}

/**
 * Gets the total number of virtual sets for an exercise with a technique
 */
export function getTotalVirtualSets(
  technique: AppliedTechnique | undefined,
  baseSets: number,
  baseWeight: number,
  baseReps: number
): number {
  if (!technique) {
    return baseSets
  }

  const result = expandTechniqueToVirtualSets(technique, baseWeight, baseReps, baseSets)
  return result.virtualSets.length
}

/**
 * Checks if a technique type is supported in simple workout mode
 */
export function isTechniqueSupportedInSimpleMode(techniqueType: TechniqueType): boolean {
  return !(techniqueType in UNSUPPORTED_TECHNIQUES)
}

/**
 * Gets the list of supported techniques for simple mode
 */
export function getSupportedTechniquesForSimpleMode(): TechniqueType[] {
  const allTechniques: TechniqueType[] = [
    'drop_set',
    'rest_pause',
    'myo_reps',
    'cluster_set',
    'fst7_protocol',
  ]
  return allTechniques
}
