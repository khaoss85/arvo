/**
 * TempoParserService
 *
 * Parses and validates tempo strings (e.g., "3-1-1-1") for workout set execution.
 * Tempo format: eccentric-pauseBottom-concentric-pauseTop (in seconds)
 *
 * Example: "3-1-1-1" means:
 * - 3 seconds: Eccentric phase (lowering/lengthening)
 * - 1 second: Pause at bottom (stretched position)
 * - 1 second: Concentric phase (lifting/shortening)
 * - 1 second: Pause at top (contracted position)
 */

export interface TempoPhases {
  eccentric: number      // Seconds for lowering phase
  pauseBottom: number    // Seconds at bottom position
  concentric: number     // Seconds for lifting phase
  pauseTop: number       // Seconds at top position
}

export interface TempoMetadata {
  phases: TempoPhases
  totalRepDuration: number  // Total seconds per rep
  formattedString: string   // Original tempo string
  isExplosive: boolean      // True if tempo contains "X" (explosive)
}

export interface RepPhaseInfo {
  repNumber: number
  totalReps: number
  phase: 'eccentric' | 'pause_bottom' | 'concentric' | 'pause_top'
  phaseDuration: number          // Duration of current phase in seconds
  timeElapsedInPhase: number     // How long we've been in this phase
  timeRemainingInPhase: number   // Time left in this phase
  percentComplete: number        // 0-100 percentage of phase completion
}

export class TempoParserService {
  private static instance: TempoParserService

  static getInstance(): TempoParserService {
    if (!TempoParserService.instance) {
      TempoParserService.instance = new TempoParserService()
    }
    return TempoParserService.instance
  }

  /**
   * Parse tempo string into structured phases
   * @param tempo - Tempo string (e.g., "3-1-1-1", "4-0-2-0", "X-X-X-X")
   * @returns TempoMetadata or null if invalid
   */
  parseTempo(tempo: string): TempoMetadata | null {
    if (!this.validateTempo(tempo)) {
      console.warn(`[TempoParser] Invalid tempo format: ${tempo}`)
      return null
    }

    const normalized = this.normalizeTempo(tempo)
    const parts = normalized.split('-')

    // Check for explosive tempo (X = 0 seconds, explosive movement)
    const isExplosive = tempo.toUpperCase().includes('X')

    const phases: TempoPhases = {
      eccentric: this.parseTempoValue(parts[0]),
      pauseBottom: this.parseTempoValue(parts[1]),
      concentric: this.parseTempoValue(parts[2]),
      pauseTop: this.parseTempoValue(parts[3]),
    }

    const totalRepDuration =
      phases.eccentric +
      phases.pauseBottom +
      phases.concentric +
      phases.pauseTop

    return {
      phases,
      totalRepDuration,
      formattedString: normalized,
      isExplosive,
    }
  }

  /**
   * Validate tempo string format
   * @param tempo - Tempo string to validate
   * @returns true if valid, false otherwise
   */
  validateTempo(tempo: string): boolean {
    if (!tempo || typeof tempo !== 'string') {
      return false
    }

    // Normalize before validation
    const normalized = this.normalizeTempo(tempo)

    // Must match pattern: N-N-N-N where N is a digit 0-9 or X
    const pattern = /^[0-9X]-[0-9X]-[0-9X]-[0-9X]$/i
    if (!pattern.test(normalized)) {
      return false
    }

    // Each value must be 0-9 or X
    const parts = normalized.split('-')
    for (const part of parts) {
      if (part.toUpperCase() !== 'X' && (isNaN(Number(part)) || Number(part) < 0 || Number(part) > 9)) {
        return false
      }
    }

    return true
  }

  /**
   * Normalize tempo string (handle variations like "3110" → "3-1-1-0")
   * @param tempo - Raw tempo string
   * @returns Normalized tempo string
   */
  private normalizeTempo(tempo: string): string {
    // Already in correct format
    if (/^[0-9X]-[0-9X]-[0-9X]-[0-9X]$/i.test(tempo)) {
      return tempo.toUpperCase()
    }

    // Handle compact format like "3110" → "3-1-1-0"
    if (/^[0-9X]{4}$/i.test(tempo)) {
      return tempo.split('').join('-').toUpperCase()
    }

    // Return as-is if can't normalize
    return tempo
  }

  /**
   * Parse individual tempo value (handle "X" for explosive)
   * @param value - Tempo value string
   * @returns Numeric value in seconds
   */
  private parseTempoValue(value: string): number {
    if (value.toUpperCase() === 'X') {
      return 0 // Explosive = 0 seconds (as fast as possible)
    }
    return parseInt(value, 10)
  }

  /**
   * Calculate total rep duration from tempo string
   * @param tempo - Tempo string
   * @returns Total seconds per rep, or 0 if invalid
   */
  calculateRepDuration(tempo: string): number {
    const parsed = this.parseTempo(tempo)
    return parsed ? parsed.totalRepDuration : 0
  }

  /**
   * Get current phase info based on elapsed time in rep
   * @param tempo - Tempo string
   * @param repNumber - Current rep number (1-indexed)
   * @param totalReps - Total reps in set
   * @param elapsedSecondsInRep - Seconds elapsed in current rep
   * @returns RepPhaseInfo
   */
  getPhaseAtTime(
    tempo: string,
    repNumber: number,
    totalReps: number,
    elapsedSecondsInRep: number
  ): RepPhaseInfo | null {
    const parsed = this.parseTempo(tempo)
    if (!parsed) {
      return null
    }

    const { phases } = parsed
    let currentPhase: 'eccentric' | 'pause_bottom' | 'concentric' | 'pause_top' = 'eccentric'
    let phaseDuration = 0
    let timeElapsedInPhase = 0

    // Determine which phase we're in based on elapsed time
    if (elapsedSecondsInRep < phases.eccentric) {
      currentPhase = 'eccentric'
      phaseDuration = phases.eccentric
      timeElapsedInPhase = elapsedSecondsInRep
    } else if (elapsedSecondsInRep < phases.eccentric + phases.pauseBottom) {
      currentPhase = 'pause_bottom'
      phaseDuration = phases.pauseBottom
      timeElapsedInPhase = elapsedSecondsInRep - phases.eccentric
    } else if (elapsedSecondsInRep < phases.eccentric + phases.pauseBottom + phases.concentric) {
      currentPhase = 'concentric'
      phaseDuration = phases.concentric
      timeElapsedInPhase = elapsedSecondsInRep - phases.eccentric - phases.pauseBottom
    } else {
      currentPhase = 'pause_top'
      phaseDuration = phases.pauseTop
      timeElapsedInPhase = elapsedSecondsInRep - phases.eccentric - phases.pauseBottom - phases.concentric
    }

    const timeRemainingInPhase = Math.max(0, phaseDuration - timeElapsedInPhase)
    const percentComplete = phaseDuration > 0 ? (timeElapsedInPhase / phaseDuration) * 100 : 100

    return {
      repNumber,
      totalReps,
      phase: currentPhase,
      phaseDuration,
      timeElapsedInPhase,
      timeRemainingInPhase,
      percentComplete: Math.min(100, percentComplete),
    }
  }

  /**
   * Get phase name for display
   * @param phase - Phase identifier
   * @param language - Language code
   * @returns Human-readable phase name
   */
  getPhaseDisplayName(
    phase: 'eccentric' | 'pause_bottom' | 'concentric' | 'pause_top',
    language: 'en' | 'it' = 'en'
  ): string {
    const names = {
      en: {
        eccentric: 'LOWERING',
        pause_bottom: 'HOLD',
        concentric: 'PUSHING',
        pause_top: 'SQUEEZE',
      },
      it: {
        eccentric: 'ABBASSA',
        pause_bottom: 'TIENI',
        concentric: 'SPINGI',
        pause_top: 'CONTRAI',
      },
    }

    return names[language][phase] || phase.toUpperCase()
  }

  /**
   * Format tempo for display
   * @param tempo - Tempo string or TempoPhases
   * @returns Formatted string like "3-1-1-1"
   */
  formatTempo(tempo: string | TempoPhases): string {
    if (typeof tempo === 'string') {
      return tempo
    }

    return `${tempo.eccentric}-${tempo.pauseBottom}-${tempo.concentric}-${tempo.pauseTop}`
  }

  /**
   * Get tempo breakdown description
   * @param tempo - Tempo string
   * @param language - Language code
   * @returns Array of phase descriptions
   */
  getTempoBreakdown(tempo: string, language: 'en' | 'it' = 'en'): string[] {
    const parsed = this.parseTempo(tempo)
    if (!parsed) {
      return []
    }

    const { phases } = parsed

    if (language === 'it') {
      return [
        `${phases.eccentric}s Abbassamento`,
        `${phases.pauseBottom}s Pausa in basso`,
        `${phases.concentric}s Spinta`,
        `${phases.pauseTop}s Contrazione`,
      ]
    }

    return [
      `${phases.eccentric}s Down`,
      `${phases.pauseBottom}s Pause`,
      `${phases.concentric}s Up`,
      `${phases.pauseTop}s Squeeze`,
    ]
  }

  /**
   * Check if tempo has explosive phases
   * @param tempo - Tempo string
   * @returns true if contains "X"
   */
  isExplosiveTempo(tempo: string): boolean {
    return tempo.toUpperCase().includes('X')
  }

  /**
   * Get total set duration estimate
   * @param tempo - Tempo string
   * @param reps - Number of reps
   * @returns Total seconds for entire set
   */
  getTotalSetDuration(tempo: string, reps: number): number {
    const repDuration = this.calculateRepDuration(tempo)
    return repDuration * reps
  }
}

// Export singleton instance
export const tempoParserService = TempoParserService.getInstance()
