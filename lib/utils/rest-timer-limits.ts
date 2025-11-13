/**
 * Rest Timer Limits Utility
 *
 * Calcola i limiti dinamici per il rest timer basandosi sull'approccio
 * di allenamento e sul tipo di esercizio.
 */

export type RestTimerStatus = 'optimal' | 'acceptable' | 'warning' | 'critical'

export interface RestTimerLimits {
  min: number // secondi
  max: number // secondi
  recommended: number // valore raccomandato
  status: RestTimerStatus
}

interface RestTimerContext {
  approachName?: string
  exerciseType?: 'compound' | 'isolation' | 'fst7' | 'activation' | 'explosive' | 'pump'
  currentRestSeconds: number
  originalRestSeconds: number
}

/**
 * Calcola i limiti del rest timer e lo status basandosi sul contesto
 */
export function calculateRestTimerLimits(context: RestTimerContext): RestTimerLimits {
  const { approachName, exerciseType, currentRestSeconds, originalRestSeconds } = context

  let min = 30
  let max = 240
  const recommended = originalRestSeconds

  // Determina limiti basati sull'approccio
  if (approachName?.toLowerCase().includes('fst-7')) {
    if (exerciseType === 'fst7') {
      // FST-7 sets: range molto stretto
      min = 30
      max = 45
    } else if (exerciseType === 'compound') {
      min = 90
      max = 180
    } else {
      // isolation
      min = 60
      max = 90
    }
  } else if (approachName?.toLowerCase().includes('y3t')) {
    // Y3T: dipende dalla week, ma per ora usiamo range ampio
    // In futuro si può aggiungere logica per detectare la week corrente
    if (exerciseType === 'compound') {
      min = 90
      max = 240 // Week 1 può arrivare a 240s
    } else {
      min = 30
      max = 120
    }
  } else if (approachName?.toLowerCase().includes('mountain dog')) {
    // Mountain Dog: dipende dalla fase
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
    // Default/Custom approach: range standard bodybuilding
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
  setGuidance?: { type?: string }
): RestTimerContext['exerciseType'] {
  // Early return con fallback safety se exerciseName è undefined
  if (!exerciseName) {
    return 'isolation' // Default conservativo
  }

  const nameLower = exerciseName.toLowerCase()

  // Check for FST-7 specific markers
  if (nameLower.includes('fst-7') || nameLower.includes('fst7')) {
    return 'fst7'
  }

  // Mountain Dog specific phases
  if (setGuidance?.type === 'activation' || nameLower.includes('activation')) {
    return 'activation'
  }
  if (setGuidance?.type === 'explosive' || nameLower.includes('explosive')) {
    return 'explosive'
  }
  if (setGuidance?.type === 'pump' || nameLower.includes('pump')) {
    return 'pump'
  }

  // Compound movements (common patterns)
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
