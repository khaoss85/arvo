/**
 * Advanced Training Techniques Type Definitions
 *
 * This module defines all types for advanced training techniques:
 * - Drop sets, Rest-pause, Supersets, Top set + backoff
 * - Myo-reps, Giant sets, Cluster sets, Pyramids
 */

// =============================================================================
// Base Types
// =============================================================================

export type TechniqueType =
  | 'drop_set'
  | 'rest_pause'
  | 'superset'
  | 'top_set_backoff'
  | 'myo_reps'
  | 'giant_set'
  | 'cluster_set'
  | 'pyramid'
  // Proprietary techniques
  | 'fst7_protocol'
  | 'loaded_stretching'
  | 'mechanical_drop_set'
  | 'lengthened_partials'
  | 'forced_reps'
  | 'pre_exhaust'

// =============================================================================
// Technique-Specific Configurations
// =============================================================================

export interface DropSetConfig {
  type: 'drop_set'
  /** Number of weight drops (typically 2-4) */
  drops: number
  /** Percentage to reduce weight each drop (typically 20-25%) */
  dropPercentage: number
}

export interface RestPauseConfig {
  type: 'rest_pause'
  /** Number of mini-sets after initial set (typically 2-4) */
  miniSets: number
  /** Rest duration between mini-sets in seconds (typically 10-15s) */
  restSeconds: number
}

export interface SupersetConfig {
  type: 'superset'
  /** Index of the paired exercise in the workout */
  pairedExerciseIndex: number
  /** Rest duration after completing both exercises in seconds */
  restAfterBoth: number
}

export interface TopSetBackoffConfig {
  type: 'top_set_backoff'
  /** Reps for the heavy top set (typically 3-5) */
  topSetReps: number
  /** Number of backoff sets (typically 2-3) */
  backoffSets: number
  /** Percentage to reduce from top set weight (typically 10-15%) */
  backoffPercentage: number
  /** Reps for backoff sets (typically 8-12) */
  backoffReps: number
}

export interface MyoRepsConfig {
  type: 'myo_reps'
  /** Reps for the activation set (typically 12-20) */
  activationReps: number
  /** Reps per mini-set (typically 3-5) */
  miniSetReps: number
  /** Number of mini-sets (typically 3-5) */
  miniSets: number
  /** Rest between mini-sets in seconds (typically 3-5s) */
  restSeconds: number
}

export interface GiantSetConfig {
  type: 'giant_set'
  /** Indices of exercises in the giant set */
  exerciseIndices: number[]
  /** Rest duration after completing all exercises in seconds */
  restAfterAll: number
}

export interface ClusterSetConfig {
  type: 'cluster_set'
  /** Reps per cluster (typically 2-3) */
  repsPerCluster: number
  /** Number of clusters (typically 4-6) */
  clusters: number
  /** Rest between clusters in seconds (typically 15-30s) */
  intraRestSeconds: number
}

export interface PyramidConfig {
  type: 'pyramid'
  /** Direction of the pyramid */
  direction: 'ascending' | 'descending' | 'full'
  /** Number of steps in the pyramid */
  steps: number
}

// =============================================================================
// Proprietary Technique Configurations
// =============================================================================

export interface Fst7ProtocolConfig {
  type: 'fst7_protocol'
  /** Always 7 sets */
  sets: 7
  /** Rest between sets (30-45s) */
  restSeconds: 30 | 45
  /** Target reps per set (typically 10-12) */
  targetReps: number
  /** Optional inter-set posing for pump */
  interSetPosing: boolean
}

export interface LoadedStretchingConfig {
  type: 'loaded_stretching'
  /** Hold duration in seconds (30-60s) */
  holdSeconds: number
  /** Target RPE for the hold (typically 7-8) */
  targetRpe: number
  /** Optional breathing pattern cue */
  breathingPattern?: string
}

export interface MechanicalDropSetConfig {
  type: 'mechanical_drop_set'
  /** Exercise variations to cycle through (e.g., ["incline", "flat", "decline"]) */
  variations: string[]
  /** Reps per variation (typically 8-12) */
  repsPerVariation: number
  /** Rest between variations in seconds (0-10s) */
  restBetween: number
}

export interface LengthenedPartialsConfig {
  type: 'lengthened_partials'
  /** Number of partial reps (typically 6-10) */
  partialReps: number
  /** Percentage of ROM to use (30-50%) */
  rangePercentage: number
}

export interface ForcedRepsConfig {
  type: 'forced_reps'
  /** Number of assisted reps beyond failure (typically 1-3) */
  assistedReps: number
  /** Always requires a training partner */
  requiresPartner: true
}

export interface PreExhaustConfig {
  type: 'pre_exhaust'
  /** Index of the isolation exercise */
  isolationExerciseIndex: number
  /** Index of the compound exercise */
  compoundExerciseIndex: number
  /** Rest between exercises (0-10s) */
  restBetween: 0 | 10
}

/** Union type of all technique configurations */
export type TechniqueConfig =
  | DropSetConfig
  | RestPauseConfig
  | SupersetConfig
  | TopSetBackoffConfig
  | MyoRepsConfig
  | GiantSetConfig
  | ClusterSetConfig
  | PyramidConfig
  // Proprietary techniques
  | Fst7ProtocolConfig
  | LoadedStretchingConfig
  | MechanicalDropSetConfig
  | LengthenedPartialsConfig
  | ForcedRepsConfig
  | PreExhaustConfig

// =============================================================================
// Applied Technique (from AI generation)
// =============================================================================

export interface AppliedTechnique {
  /** The type of technique applied */
  technique: TechniqueType
  /** Configuration specific to the technique */
  config: TechniqueConfig
  /** AI's rationale for applying this technique */
  rationale: string
}

// =============================================================================
// Technique Compatibility Rules
// =============================================================================

export interface TechniqueCompatibility {
  /** Muscle groups where this technique works well */
  allowedMuscleGroups?: string[]
  /** Muscle groups to avoid with this technique */
  excludedMuscleGroups?: string[]
  /** Requires a compound movement */
  requiresCompound?: boolean
  /** Requires an isolation movement */
  requiresIsolation?: boolean
  /** Minimum experience level required */
  minExperience: 'beginner' | 'intermediate' | 'advanced'
  /** Short description of the technique */
  description: string
}

export const TECHNIQUE_COMPATIBILITY: Record<TechniqueType, TechniqueCompatibility> = {
  drop_set: {
    requiresIsolation: true,
    minExperience: 'intermediate',
    description: 'Reduce weight immediately after failure and continue',
  },
  rest_pause: {
    minExperience: 'intermediate',
    description: 'Brief 10-15s pauses to extend a set',
  },
  superset: {
    minExperience: 'beginner',
    description: 'Two exercises back-to-back without rest',
  },
  top_set_backoff: {
    requiresCompound: true,
    minExperience: 'intermediate',
    description: 'One heavy set followed by lighter volume sets',
  },
  myo_reps: {
    requiresIsolation: true,
    minExperience: 'advanced',
    description: 'Activation set + multiple mini-sets with 3-5s rest',
  },
  giant_set: {
    minExperience: 'intermediate',
    description: 'Three or more exercises in sequence without rest',
  },
  cluster_set: {
    requiresCompound: true,
    minExperience: 'advanced',
    description: 'Intra-set rest periods (15-30s) between small rep clusters',
  },
  pyramid: {
    minExperience: 'beginner',
    description: 'Progressive weight changes across sets',
  },
  // Proprietary techniques
  fst7_protocol: {
    requiresIsolation: true,
    minExperience: 'intermediate',
    description: '7 sets with 30-45s rest for maximum pump (FST-7)',
  },
  loaded_stretching: {
    requiresIsolation: true,
    minExperience: 'intermediate',
    description: '30-60s isometric hold in stretched position (Mountain Dog)',
  },
  mechanical_drop_set: {
    minExperience: 'intermediate',
    description: 'Change exercise variation without reducing weight',
  },
  lengthened_partials: {
    requiresIsolation: true,
    minExperience: 'intermediate',
    description: 'Partial ROM in stretched position for hypertrophy',
  },
  forced_reps: {
    minExperience: 'advanced',
    description: 'Partner-assisted reps beyond failure',
  },
  pre_exhaust: {
    minExperience: 'intermediate',
    description: 'Isolation to compound pairing without rest',
  },
}

// =============================================================================
// Technique Execution State (for workout logging)
// =============================================================================

export interface TechniqueExecutionState {
  /** Current drop number (for drop sets) */
  currentDrop?: number
  /** Current mini-set number (for rest-pause, myo-reps) */
  currentMiniSet?: number
  /** Current cluster number (for cluster sets) */
  currentCluster?: number
  /** Current pyramid step */
  currentPyramidStep?: number
  /** Weights used for each drop */
  dropWeights?: number[]
  /** Reps achieved for each drop */
  dropReps?: number[]
  /** Reps achieved for each mini-set */
  miniSetReps?: number[]
  /** Reps achieved for each cluster */
  clusterReps?: number[]
  /** Whether currently in activation set (myo-reps) */
  inActivationSet?: boolean
}

// =============================================================================
// Technique Execution Result (for database logging)
// =============================================================================

export interface TechniqueExecutionResult {
  /** The type of technique executed */
  technique: TechniqueType
  /** Original configuration from AI */
  config: TechniqueConfig

  // Drop set specific
  /** Weights used in each drop */
  dropWeights?: number[]
  /** Reps achieved in each drop */
  dropReps?: number[]

  // Rest-pause / Myo-reps specific
  /** Reps achieved in each mini-set */
  miniSetReps?: number[]

  // Myo-reps specific
  /** Reps achieved in activation set */
  activationReps?: number

  // Cluster specific
  /** Reps achieved in each cluster */
  clusterReps?: number[]

  // Pyramid specific
  /** Weights used at each step */
  pyramidWeights?: number[]
  /** Reps achieved at each step */
  pyramidReps?: number[]

  // General
  /** Whether the technique was completed as prescribed */
  completedFully: boolean
  /** Optional notes about execution */
  notes?: string
}

// =============================================================================
// Analytics Types
// =============================================================================

export interface TechniqueAnalyticsEntry {
  id: string
  userId: string
  workoutId: string
  exerciseName: string
  techniqueType: TechniqueType
  techniqueConfig: TechniqueConfig
  executionResult: TechniqueExecutionResult | null
  completedAt: Date
  createdAt: Date
}

export interface TechniqueStats {
  /** Total times each technique has been used */
  usageCounts: Record<TechniqueType, number>
  /** Completion rate for each technique (0-1) */
  completionRates: Record<TechniqueType, number>
  /** Most used technique */
  mostUsedTechnique: TechniqueType | null
  /** Total techniques applied */
  totalTechniquesApplied: number
}

export interface TechniqueEffectiveness {
  techniqueType: TechniqueType
  muscleGroup: string
  timesUsed: number
  completionRate: number
  avgVolumeIncrease?: number
}

// =============================================================================
// Helper Type Guards
// =============================================================================

export function isDropSetConfig(config: TechniqueConfig): config is DropSetConfig {
  return config.type === 'drop_set'
}

export function isRestPauseConfig(config: TechniqueConfig): config is RestPauseConfig {
  return config.type === 'rest_pause'
}

export function isSupersetConfig(config: TechniqueConfig): config is SupersetConfig {
  return config.type === 'superset'
}

export function isTopSetBackoffConfig(config: TechniqueConfig): config is TopSetBackoffConfig {
  return config.type === 'top_set_backoff'
}

export function isMyoRepsConfig(config: TechniqueConfig): config is MyoRepsConfig {
  return config.type === 'myo_reps'
}

export function isGiantSetConfig(config: TechniqueConfig): config is GiantSetConfig {
  return config.type === 'giant_set'
}

export function isClusterSetConfig(config: TechniqueConfig): config is ClusterSetConfig {
  return config.type === 'cluster_set'
}

export function isPyramidConfig(config: TechniqueConfig): config is PyramidConfig {
  return config.type === 'pyramid'
}

// Proprietary technique type guards
export function isFst7ProtocolConfig(config: TechniqueConfig): config is Fst7ProtocolConfig {
  return config.type === 'fst7_protocol'
}

export function isLoadedStretchingConfig(config: TechniqueConfig): config is LoadedStretchingConfig {
  return config.type === 'loaded_stretching'
}

export function isMechanicalDropSetConfig(config: TechniqueConfig): config is MechanicalDropSetConfig {
  return config.type === 'mechanical_drop_set'
}

export function isLengthenedPartialsConfig(config: TechniqueConfig): config is LengthenedPartialsConfig {
  return config.type === 'lengthened_partials'
}

export function isForcedRepsConfig(config: TechniqueConfig): config is ForcedRepsConfig {
  return config.type === 'forced_reps'
}

export function isPreExhaustConfig(config: TechniqueConfig): config is PreExhaustConfig {
  return config.type === 'pre_exhaust'
}

// =============================================================================
// Default Configurations (for UI suggestions)
// =============================================================================

export const DEFAULT_TECHNIQUE_CONFIGS: Record<TechniqueType, TechniqueConfig> = {
  drop_set: {
    type: 'drop_set',
    drops: 2,
    dropPercentage: 20,
  },
  rest_pause: {
    type: 'rest_pause',
    miniSets: 2,
    restSeconds: 15,
  },
  superset: {
    type: 'superset',
    pairedExerciseIndex: -1, // Must be set
    restAfterBoth: 90,
  },
  top_set_backoff: {
    type: 'top_set_backoff',
    topSetReps: 5,
    backoffSets: 2,
    backoffPercentage: 15,
    backoffReps: 8,
  },
  myo_reps: {
    type: 'myo_reps',
    activationReps: 15,
    miniSetReps: 5,
    miniSets: 4,
    restSeconds: 5,
  },
  giant_set: {
    type: 'giant_set',
    exerciseIndices: [], // Must be set
    restAfterAll: 120,
  },
  cluster_set: {
    type: 'cluster_set',
    repsPerCluster: 2,
    clusters: 5,
    intraRestSeconds: 20,
  },
  pyramid: {
    type: 'pyramid',
    direction: 'ascending',
    steps: 4,
  },
  // Proprietary techniques
  fst7_protocol: {
    type: 'fst7_protocol',
    sets: 7,
    restSeconds: 30,
    targetReps: 12,
    interSetPosing: false,
  },
  loaded_stretching: {
    type: 'loaded_stretching',
    holdSeconds: 45,
    targetRpe: 7,
  },
  mechanical_drop_set: {
    type: 'mechanical_drop_set',
    variations: [],
    repsPerVariation: 10,
    restBetween: 0,
  },
  lengthened_partials: {
    type: 'lengthened_partials',
    partialReps: 8,
    rangePercentage: 40,
  },
  forced_reps: {
    type: 'forced_reps',
    assistedReps: 2,
    requiresPartner: true,
  },
  pre_exhaust: {
    type: 'pre_exhaust',
    isolationExerciseIndex: 0,
    compoundExerciseIndex: 1,
    restBetween: 0,
  },
}

// =============================================================================
// Technique Display Names (for i18n keys)
// =============================================================================

export const TECHNIQUE_I18N_KEYS: Record<TechniqueType, string> = {
  drop_set: 'dropSet',
  rest_pause: 'restPause',
  superset: 'superset',
  top_set_backoff: 'topSetBackoff',
  myo_reps: 'myoReps',
  giant_set: 'giantSet',
  cluster_set: 'clusterSet',
  pyramid: 'pyramid',
  // Proprietary techniques
  fst7_protocol: 'fst7Protocol',
  loaded_stretching: 'loadedStretching',
  mechanical_drop_set: 'mechanicalDropSet',
  lengthened_partials: 'lengthenedPartials',
  forced_reps: 'forcedReps',
  pre_exhaust: 'preExhaust',
}
