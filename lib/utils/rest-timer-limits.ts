/**
 * Rest Timer Limits Utility
 *
 * Calcola i limiti dinamici per il rest timer basandosi sull'approccio
 * di allenamento e sul tipo di esercizio.
 */

import type { TrainingApproach } from '@/lib/knowledge/types'

export type RestTimerStatus = 'optimal' | 'acceptable' | 'warning' | 'critical'

export interface RestTimerLimits {
  min: number // secondi
  max: number // secondi
  recommended: number // valore raccomandato
  status: RestTimerStatus
}

interface RestTimerContext {
  approach?: TrainingApproach
  approachName?: string // Deprecated: mantienilo per backward compatibility
  exerciseType?: 'compound' | 'isolation' | 'fst7' | 'activation' | 'explosive' | 'pump'
  currentRestSeconds: number
  originalRestSeconds: number
  weekType?: 'week1' | 'week2' | 'week3' // For periodized approaches like Y3T
}

/**
 * Calcola i limiti del rest timer e lo status basandosi sul contesto
 */
export function calculateRestTimerLimits(context: RestTimerContext): RestTimerLimits {
  const { approach, approachName, exerciseType, currentRestSeconds, originalRestSeconds, weekType } = context

  let min = 30
  let max = 240
  let recommended = originalRestSeconds

  // NEW APPROACH: Use approach.restTimerGuidelines if available
  if (approach?.restTimerGuidelines && exerciseType) {
    // Build lookup key based on exercise type and week type (for periodized approaches)
    const lookupKeys = [
      weekType ? `${weekType}_${exerciseType}` : null, // e.g., "week1_compound"
      exerciseType, // e.g., "compound" or "fst7"
      exerciseType === 'compound' || exerciseType === 'isolation' ? exerciseType : 'isolation' // fallback
    ].filter(Boolean) as string[]

    // Try to find guidelines for this exercise type
    for (const key of lookupKeys) {
      const guidelines = approach.restTimerGuidelines[key]
      if (guidelines) {
        min = guidelines.min
        max = guidelines.max
        recommended = guidelines.default
        break
      }
    }

    // If no specific guidelines found, use compound/isolation defaults
    if (!approach.restTimerGuidelines[exerciseType]) {
      const fallbackKey = exerciseType === 'compound' ? 'compound' : 'isolation'
      const fallbackGuidelines = approach.restTimerGuidelines[fallbackKey]
      if (fallbackGuidelines) {
        min = fallbackGuidelines.min
        max = fallbackGuidelines.max
        recommended = fallbackGuidelines.default
      }
    }
  }
  // FALLBACK: Use old approach name string matching for backward compatibility
  else if (approachName) {
    const nameLower = approachName.toLowerCase()

    if (nameLower.includes('fst-7')) {
      if (exerciseType === 'fst7') {
        min = 30
        max = 45
      } else if (exerciseType === 'compound') {
        min = 90
        max = 180
      } else {
        min = 60
        max = 90
      }
    } else if (nameLower.includes('y3t')) {
      if (exerciseType === 'compound') {
        min = 90
        max = 240
      } else {
        min = 30
        max = 120
      }
    } else if (nameLower.includes('mountain dog')) {
      if (exerciseType === 'activation') {
        min = 45
        max = 60
      } else if (exerciseType === 'explosive') {
        min = 180
        max = 240
      } else if (exerciseType === 'pump') {
        min = 30
        max = 60
      } else if (exerciseType === 'compound') {
        min = 120
        max = 180
      } else {
        min = 60
        max = 90
      }
    } else {
      // Default approach
      if (exerciseType === 'compound') {
        min = 90
        max = 180
      } else {
        min = 45
        max = 90
      }
    }
  }
  // DEFAULT: Standard bodybuilding ranges
  else {
    if (exerciseType === 'compound') {
      min = 90
      max = 180
    } else {
      min = 45
      max = 90
    }
  }

  // Calcola status basandosi sulla deviazione dal valore raccomandato
  const deviation = Math.abs(currentRestSeconds - recommended)
  const status = calculateStatus(currentRestSeconds, min, max, deviation)

  return {
    min,
    max,
    recommended,
    status
  }
}

/**
 * Determina lo status del timer corrente
 */
function calculateStatus(
  current: number,
  min: number,
  max: number,
  deviation: number
): RestTimerStatus {
  // Entro il range raccomandato
  if (current >= min && current <= max) {
    if (deviation <= 15) {
      return 'optimal' // Molto vicino al raccomandato
    }
    return 'acceptable' // Entro il range ma deviato
  }

  // Fuori dal range
  if (deviation <= 30) {
    return 'warning' // Leggermente fuori
  }

  return 'critical' // Molto distante dalle linee guida
}

/**
 * Ottiene un messaggio descrittivo per lo status
 */
export function getRestTimerStatusMessage(
  status: RestTimerStatus,
  approachName?: string,
  locale: 'en' | 'it' = 'en'
): string {
  const messages = {
    en: {
      optimal: 'Within optimal range',
      acceptable: 'Acceptable variation',
      warning: `Deviating from ${approachName || 'approach'} guidelines`,
      critical: `Significantly outside ${approachName || 'approach'} recommendations`
    },
    it: {
      optimal: 'Nel range ottimale',
      acceptable: 'Variazione accettabile',
      warning: `Deviazione dalle linee guida ${approachName || 'dell\'approccio'}`,
      critical: `Significativamente fuori dalle raccomandazioni ${approachName || 'dell\'approccio'}`
    }
  }

  return messages[locale][status]
}

/**
 * Ottiene il colore associato allo status
 */
export function getRestTimerStatusColor(status: RestTimerStatus): {
  bg: string
  border: string
  text: string
} {
  const colors = {
    optimal: {
      bg: 'bg-green-500/20',
      border: 'border-green-500',
      text: 'text-green-400'
    },
    acceptable: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500',
      text: 'text-blue-400'
    },
    warning: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500',
      text: 'text-yellow-400'
    },
    critical: {
      bg: 'bg-red-500/20',
      border: 'border-red-500',
      text: 'text-red-400'
    }
  }

  return colors[status]
}

/**
 * Inferisce il tipo di esercizio dal nome o dalle caratteristiche
 * (utility helper per quando il tipo non è esplicitamente disponibile)
 */
export function inferExerciseType(
  exerciseName: string | undefined,
  setGuidance?: { type?: string; technique?: string }
): RestTimerContext['exerciseType'] {
  // Early return con fallback safety se exerciseName è undefined
  if (!exerciseName) {
    return 'isolation' // Default conservativo
  }

  const nameLower = exerciseName.toLowerCase()

  // Priority 1: Check setGuidance.type (most reliable)
  if (setGuidance?.type) {
    const type = setGuidance.type.toLowerCase()
    // Advanced technique types
    if (type === 'fst7' || type === 'fst-7') return 'fst7'
    if (type === 'activation') return 'activation'
    if (type === 'explosive') return 'explosive'
    if (type === 'pump') return 'pump'
    // Standard types
    if (type === 'compound') return 'compound'
    if (type === 'isolation') return 'isolation'
  }

  // Priority 2: Check setGuidance.technique
  if (setGuidance?.technique) {
    const tech = setGuidance.technique.toLowerCase()
    if (tech.includes('fst') || tech === 'fst7') return 'fst7'
    if (tech === 'activation' || tech === 'pre-activation') return 'activation'
    if (tech === 'explosive' || tech.includes('speed')) return 'explosive'
    if (tech === 'pump' || tech.includes('metabolic')) return 'pump'
  }

  // Priority 3: Check exercise name for technique markers
  if (nameLower.includes('fst-7') || nameLower.includes('fst7')) {
    return 'fst7'
  }
  if (nameLower.includes('activation')) {
    return 'activation'
  }
  if (nameLower.includes('explosive')) {
    return 'explosive'
  }
  if (nameLower.includes('pump')) {
    return 'pump'
  }

  // Priority 4: Compound movement detection (common patterns)
  const compoundKeywords = [
    'squat', 'deadlift', 'bench press', 'overhead press', 'row',
    'pull-up', 'chin-up', 'dip', 'lunge', 'leg press'
  ]
  if (compoundKeywords.some(kw => nameLower.includes(kw))) {
    return 'compound'
  }

  // Default to isolation
  return 'isolation'
}
