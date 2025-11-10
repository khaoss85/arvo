import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database.types';

export type WorkoutInsight = Tables<'workout_insights'>;
export type WorkoutInsightInsert = TablesInsert<'workout_insights'>;
export type WorkoutInsightUpdate = TablesUpdate<'workout_insights'>;

export type InsightType = 'pain' | 'technique' | 'energy' | 'recovery' | 'equipment' | 'general';
export type InsightSeverity = 'info' | 'caution' | 'warning' | 'critical';
export type InsightStatus = 'active' | 'monitoring' | 'resolved';

export interface InsightMetadata {
  affectedMuscles?: string[];
  suggestedActions?: string[];
  relatedExercises?: string[];
  context?: Record<string, unknown>;
}

export interface CreateInsightInput {
  userId: string;
  workoutId: string;
  exerciseName?: string;
  userNote: string;
  insightType?: InsightType;
  severity?: InsightSeverity;
  metadata?: InsightMetadata;
}

export interface GetInsightsFilters {
  status?: InsightStatus | InsightStatus[];
  insightType?: InsightType | InsightType[];
  severity?: InsightSeverity | InsightSeverity[];
  exerciseName?: string;
  minRelevance?: number;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

export class InsightService {
  private supabase = createClient();

  /**
   * Create a new workout insight
   */
  async createInsight(input: CreateInsightInput): Promise<WorkoutInsight> {
    const insertData: WorkoutInsightInsert = {
      user_id: input.userId,
      workout_id: input.workoutId,
      exercise_name: input.exerciseName,
      user_note: input.userNote,
      insight_type: input.insightType,
      severity: input.severity,
      metadata: input.metadata as any,
      status: 'active',
      relevance_score: 1.0,
    };

    const { data, error } = await this.supabase
      .from('workout_insights')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get active insights for a user using the database function
   */
  async getActiveInsights(userId: string, minRelevance = 0.3): Promise<WorkoutInsight[]> {
    const { data, error } = await this.supabase
      .rpc('get_active_insights', {
        p_user_id: userId,
        p_min_relevance: minRelevance,
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get insights with filters
   */
  async getInsights(userId: string, filters?: GetInsightsFilters): Promise<WorkoutInsight[]> {
    let query = this.supabase
      .from('workout_insights')
      .select('*')
      .eq('user_id', userId);

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.insightType) {
      if (Array.isArray(filters.insightType)) {
        query = query.in('insight_type', filters.insightType);
      } else {
        query = query.eq('insight_type', filters.insightType);
      }
    }

    if (filters?.severity) {
      if (Array.isArray(filters.severity)) {
        query = query.in('severity', filters.severity);
      } else {
        query = query.eq('severity', filters.severity);
      }
    }

    if (filters?.exerciseName) {
      query = query.eq('exercise_name', filters.exerciseName);
    }

    if (filters?.minRelevance !== undefined) {
      query = query.gte('relevance_score', filters.minRelevance);
    }

    if (filters?.fromDate) {
      query = query.gte('created_at', filters.fromDate.toISOString());
    }

    if (filters?.toDate) {
      query = query.lte('created_at', filters.toDate.toISOString());
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('relevance_score', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single insight by ID
   */
  async getInsightById(insightId: string): Promise<WorkoutInsight | null> {
    const { data, error } = await this.supabase
      .from('workout_insights')
      .select('*')
      .eq('id', insightId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  /**
   * Update an insight
   */
  async updateInsight(
    insightId: string,
    updates: WorkoutInsightUpdate
  ): Promise<WorkoutInsight> {
    const { data, error } = await this.supabase
      .from('workout_insights')
      .update(updates)
      .eq('id', insightId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Propose resolution for an insight (AI or user initiated)
   */
  async proposeResolution(
    insightId: string,
    proposedBy: 'ai' | 'user'
  ): Promise<WorkoutInsight> {
    return this.updateInsight(insightId, {
      status: 'monitoring',
      resolution_proposed_by: proposedBy,
      resolution_proposed_at: new Date().toISOString(),
    });
  }

  /**
   * Resolve an insight (mark as resolved)
   */
  async resolveInsight(
    insightId: string,
    resolvedBy: 'ai' | 'user'
  ): Promise<WorkoutInsight> {
    return this.updateInsight(insightId, {
      status: 'resolved',
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    });
  }

  /**
   * Reactivate a resolved insight
   */
  async reactivateInsight(insightId: string): Promise<WorkoutInsight> {
    return this.updateInsight(insightId, {
      status: 'active',
      resolved_by: null,
      resolved_at: null,
      resolution_proposed_by: null,
      resolution_proposed_at: null,
      relevance_score: 1.0,
      last_mentioned_at: new Date().toISOString(),
    });
  }

  /**
   * Update relevance score (e.g., from time-decay or re-mention)
   */
  async updateRelevanceScore(
    insightId: string,
    newScore: number
  ): Promise<WorkoutInsight> {
    const clampedScore = Math.max(0, Math.min(1, newScore));
    return this.updateInsight(insightId, {
      relevance_score: clampedScore,
    });
  }

  /**
   * Update last_mentioned_at (when user mentions same issue again)
   */
  async updateLastMentioned(insightId: string): Promise<WorkoutInsight> {
    return this.updateInsight(insightId, {
      last_mentioned_at: new Date().toISOString(),
    });
  }

  /**
   * Delete an insight
   */
  async deleteInsight(insightId: string): Promise<void> {
    const { error } = await this.supabase
      .from('workout_insights')
      .delete()
      .eq('id', insightId);

    if (error) throw error;
  }

  /**
   * Get insights grouped by type
   */
  async getInsightsByType(userId: string): Promise<Record<InsightType, WorkoutInsight[]>> {
    const insights = await this.getInsights(userId, { status: 'active' });

    const grouped: Record<string, WorkoutInsight[]> = {
      pain: [],
      technique: [],
      energy: [],
      recovery: [],
      equipment: [],
      general: [],
    };

    insights.forEach((insight) => {
      const type = insight.insight_type || 'general';
      if (grouped[type]) {
        grouped[type].push(insight);
      }
    });

    return grouped as Record<InsightType, WorkoutInsight[]>;
  }

  /**
   * Get insights for a specific workout
   */
  async getWorkoutInsights(workoutId: string): Promise<WorkoutInsight[]> {
    const { data, error } = await this.supabase
      .from('workout_insights')
      .select('*')
      .eq('workout_id', workoutId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get insights for a specific exercise (across all workouts)
   */
  async getExerciseInsights(
    userId: string,
    exerciseName: string
  ): Promise<WorkoutInsight[]> {
    const { data, error } = await this.supabase
      .from('workout_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Count insights by status
   */
  async getInsightCounts(userId: string): Promise<{
    active: number;
    monitoring: number;
    resolved: number;
    total: number;
  }> {
    const { data, error } = await this.supabase
      .from('workout_insights')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const counts = {
      active: 0,
      monitoring: 0,
      resolved: 0,
      total: data?.length || 0,
    };

    data?.forEach((insight) => {
      if (insight.status === 'active') counts.active++;
      else if (insight.status === 'monitoring') counts.monitoring++;
      else if (insight.status === 'resolved') counts.resolved++;
    });

    return counts;
  }

  /**
   * Find similar insights (for duplicate detection)
   */
  async findSimilarInsights(
    userId: string,
    exerciseName?: string,
    insightType?: InsightType,
    daysBack = 30
  ): Promise<WorkoutInsight[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);

    return this.getInsights(userId, {
      status: ['active', 'monitoring'],
      exerciseName,
      insightType,
      fromDate,
    });
  }
}

// Singleton instance
export const insightService = new InsightService();
