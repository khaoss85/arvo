import type { SplitPlan } from "@/lib/types/schemas";
import type { SessionDefinition } from "@/lib/services/split-plan.service";

/**
 * Status of a day in the split cycle timeline
 */
export type DayStatus = 'completed' | 'current' | 'upcoming' | 'rest';

/**
 * Volume comparison data for a muscle group
 */
export interface VolumeComparison {
  target: number;
  actual: number;
  diff: number;
  percentage: number;
}

/**
 * Data for a completed workout in the timeline
 */
export interface CompletedWorkoutData {
  id: string;
  completedAt: string;
  actualVolume: Record<string, number>; // muscle -> actual sets
  variance: Record<string, VolumeComparison>; // muscle -> comparison
}

/**
 * Data for a single day in the timeline
 */
export interface TimelineDayData {
  day: number; // 1-based cycle day
  status: DayStatus;
  session: SessionDefinition | null; // null for rest days
  completedWorkout?: CompletedWorkoutData;
}

/**
 * Complete timeline data for the split cycle
 */
export interface SplitTimelineData {
  splitPlan: SplitPlan;
  currentCycleDay: number;
  days: TimelineDayData[];
}
