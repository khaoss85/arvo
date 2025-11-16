/**
 * Multi-Cycle Trend Analysis Types
 *
 * Used by InsightsGenerator to analyze training patterns across multiple completed cycles
 */

export interface CycleTrendAnalysis {
  volumeProgression: VolumeTrend
  mentalReadinessTrend: MentalReadinessTrend
  workoutConsistency: ConsistencyAnalysis
  muscleBalanceTrends: Record<string, MuscleBalanceTrend>
  recommendations: string[]
}

export interface VolumeTrend {
  trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data'
  percentChangePerCycle: number
  averageVolume: number
  latestVolume: number
  cyclesAnalyzed: number
}

export interface MentalReadinessTrend {
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data'
  average: number | null
  latest: number | null
  changeFromFirst: number | null
}

export interface ConsistencyAnalysis {
  rating: 'excellent' | 'good' | 'moderate' | 'inconsistent'
  averageWorkoutsPerCycle: number
  coefficientOfVariation: number
  latestCycleWorkouts: number
}

export interface MuscleBalanceTrend {
  trend: 'increasing' | 'decreasing' | 'stable'
  averageVolume: number
  latestVolume: number
  percentChange: number
  cyclesAnalyzed: number
}
