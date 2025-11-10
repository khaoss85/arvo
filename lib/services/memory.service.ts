import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database.types';

export type UserMemoryEntry = Tables<'user_memory_entries'>;
export type UserMemoryEntryInsert = TablesInsert<'user_memory_entries'>;
export type UserMemoryEntryUpdate = TablesUpdate<'user_memory_entries'>;

export type MemoryCategory = 'preference' | 'pattern' | 'limitation' | 'strength' | 'equipment' | 'learned_behavior';
export type MemorySource = 'user_note' | 'ai_observation' | 'workout_pattern' | 'substitution_history' | 'profile_input';
export type MemoryStatus = 'active' | 'outdated' | 'archived';

export interface MemoryMetadata {
  [key: string]: any;
}

export interface CreateMemoryInput {
  userId: string;
  category: MemoryCategory;
  source: MemorySource;
  title: string;
  description?: string;
  confidenceScore?: number;
  sourceId?: string;
  relatedExercises?: string[];
  relatedMuscles?: string[];
  metadata?: MemoryMetadata;
}

export interface GetMemoriesFilters {
  category?: MemoryCategory | MemoryCategory[];
  source?: MemorySource | MemorySource[];
  status?: MemoryStatus | MemoryStatus[];
  minConfidence?: number;
  relatedExercise?: string;
  relatedMuscle?: string;
  limit?: number;
}

export interface MemoryDashboard {
  overview: {
    activeCount: number;
    byCategory: Record<MemoryCategory, number>;
    bySource: Record<MemorySource, number>;
    avgConfidence: number;
    recentlyConsolidated: number;
  };
  preferences: UserMemoryEntry[];
  patterns: UserMemoryEntry[];
  limitations: UserMemoryEntry[];
  strengths: UserMemoryEntry[];
  equipment: UserMemoryEntry[];
  behaviors: UserMemoryEntry[];
}

export class MemoryService {
  private supabase = createClient();

  /**
   * Create a new memory entry
   */
  async createMemory(input: CreateMemoryInput): Promise<UserMemoryEntry> {
    const insertData: UserMemoryEntryInsert = {
      user_id: input.userId,
      memory_category: input.category,
      memory_source: input.source,
      title: input.title,
      description: input.description,
      confidence_score: input.confidenceScore ?? 0.5,
      source_id: input.sourceId,
      related_exercises: input.relatedExercises ?? [],
      related_muscles: input.relatedMuscles ?? [],
      metadata: input.metadata as any,
      status: 'active',
    };

    const { data, error } = await this.supabase
      .from('user_memory_entries')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get active memories using database function
   */
  async getActiveMemories(userId: string, minConfidence = 0.5): Promise<UserMemoryEntry[]> {
    const { data, error } = await this.supabase
      .rpc('get_active_memories', {
        p_user_id: userId,
        p_min_confidence: minConfidence,
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get memories with filters
   */
  async getMemories(userId: string, filters?: GetMemoriesFilters): Promise<UserMemoryEntry[]> {
    let query = this.supabase
      .from('user_memory_entries')
      .select('*')
      .eq('user_id', userId);

    if (filters?.category) {
      if (Array.isArray(filters.category)) {
        query = query.in('memory_category', filters.category);
      } else {
        query = query.eq('memory_category', filters.category);
      }
    }

    if (filters?.source) {
      if (Array.isArray(filters.source)) {
        query = query.in('memory_source', filters.source);
      } else {
        query = query.eq('memory_source', filters.source);
      }
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.minConfidence !== undefined) {
      query = query.gte('confidence_score', filters.minConfidence);
    }

    if (filters?.relatedExercise) {
      query = query.contains('related_exercises', [filters.relatedExercise]);
    }

    if (filters?.relatedMuscle) {
      query = query.contains('related_muscles', [filters.relatedMuscle]);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('confidence_score', { ascending: false })
      .order('last_confirmed_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single memory by ID
   */
  async getMemoryById(memoryId: string): Promise<UserMemoryEntry | null> {
    const { data, error } = await this.supabase
      .from('user_memory_entries')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * Update a memory
   */
  async updateMemory(
    memoryId: string,
    updates: UserMemoryEntryUpdate
  ): Promise<UserMemoryEntry> {
    const { data, error } = await this.supabase
      .from('user_memory_entries')
      .update(updates)
      .eq('id', memoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Boost memory confidence (when pattern repeats)
   */
  async boostConfidence(memoryId: string, boostAmount = 0.1): Promise<void> {
    const { error } = await this.supabase.rpc('boost_memory_confidence', {
      p_memory_id: memoryId,
      p_boost_amount: boostAmount,
    });

    if (error) throw error;
  }

  /**
   * Update confidence score manually
   */
  async updateConfidence(memoryId: string, newScore: number): Promise<UserMemoryEntry> {
    const clampedScore = Math.max(0, Math.min(1, newScore));
    return this.updateMemory(memoryId, {
      confidence_score: clampedScore,
      last_confirmed_at: new Date().toISOString(),
    });
  }

  /**
   * Archive a memory (user action)
   */
  async archiveMemory(memoryId: string): Promise<UserMemoryEntry> {
    return this.updateMemory(memoryId, {
      status: 'archived',
    });
  }

  /**
   * Mark memory as outdated (AI action)
   */
  async markOutdated(memoryId: string): Promise<UserMemoryEntry> {
    return this.updateMemory(memoryId, {
      status: 'outdated',
    });
  }

  /**
   * Reactivate a memory
   */
  async reactivateMemory(memoryId: string): Promise<UserMemoryEntry> {
    return this.updateMemory(memoryId, {
      status: 'active',
      last_confirmed_at: new Date().toISOString(),
    });
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_memory_entries')
      .delete()
      .eq('id', memoryId);

    if (error) throw error;
  }

  /**
   * Get memories by category
   */
  async getMemoriesByCategory(
    userId: string,
    category: MemoryCategory
  ): Promise<UserMemoryEntry[]> {
    return this.getMemories(userId, {
      category,
      status: 'active',
      minConfidence: 0.5,
    });
  }

  /**
   * Find similar memories (for duplicate detection)
   */
  async findSimilarMemories(
    userId: string,
    title: string,
    category: MemoryCategory,
    relatedExercises?: string[]
  ): Promise<UserMemoryEntry[]> {
    const { data, error } = await this.supabase
      .from('user_memory_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('memory_category', category)
      .ilike('title', `%${title}%`)
      .in('status', ['active', 'outdated']);

    if (error) throw error;

    // Further filter by related exercises if provided
    if (relatedExercises && relatedExercises.length > 0) {
      return (data || []).filter((memory) =>
        memory.related_exercises?.some((ex) => relatedExercises.includes(ex))
      );
    }

    return data || [];
  }

  /**
   * Get memories for specific exercises
   */
  async getMemoriesForExercise(
    userId: string,
    exerciseName: string
  ): Promise<UserMemoryEntry[]> {
    return this.getMemories(userId, {
      status: 'active',
      relatedExercise: exerciseName,
      minConfidence: 0.5,
    });
  }

  /**
   * Get memory dashboard overview
   */
  async getMemoryDashboard(userId: string): Promise<MemoryDashboard> {
    const allMemories = await this.getMemories(userId, {
      status: 'active',
    });

    // Calculate overview stats
    const byCategory: Record<string, number> = {
      preference: 0,
      pattern: 0,
      limitation: 0,
      strength: 0,
      equipment: 0,
      learned_behavior: 0,
    };

    const bySource: Record<string, number> = {
      user_note: 0,
      ai_observation: 0,
      workout_pattern: 0,
      substitution_history: 0,
      profile_input: 0,
    };

    let totalConfidence = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let recentlyConsolidated = 0;

    allMemories.forEach((memory) => {
      byCategory[memory.memory_category]++;
      bySource[memory.memory_source]++;
      totalConfidence += memory.confidence_score;

      if (new Date(memory.created_at) > thirtyDaysAgo) {
        recentlyConsolidated++;
      }
    });

    const avgConfidence = allMemories.length > 0 ? totalConfidence / allMemories.length : 0;

    // Group by category
    const preferences = allMemories.filter((m) => m.memory_category === 'preference');
    const patterns = allMemories.filter((m) => m.memory_category === 'pattern');
    const limitations = allMemories.filter((m) => m.memory_category === 'limitation');
    const strengths = allMemories.filter((m) => m.memory_category === 'strength');
    const equipment = allMemories.filter((m) => m.memory_category === 'equipment');
    const behaviors = allMemories.filter((m) => m.memory_category === 'learned_behavior');

    return {
      overview: {
        activeCount: allMemories.length,
        byCategory: byCategory as Record<MemoryCategory, number>,
        bySource: bySource as Record<MemorySource, number>,
        avgConfidence,
        recentlyConsolidated,
      },
      preferences,
      patterns,
      limitations,
      strengths,
      equipment,
      behaviors,
    };
  }

  /**
   * Count memories by status
   */
  async getMemoryCounts(userId: string): Promise<{
    active: number;
    outdated: number;
    archived: number;
    total: number;
  }> {
    const { data, error } = await this.supabase
      .from('user_memory_entries')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const counts = {
      active: 0,
      outdated: 0,
      archived: 0,
      total: data?.length || 0,
    };

    data?.forEach((memory) => {
      if (memory.status === 'active') counts.active++;
      else if (memory.status === 'outdated') counts.outdated++;
      else if (memory.status === 'archived') counts.archived++;
    });

    return counts;
  }

  /**
   * Export memories as JSON
   */
  async exportMemories(userId: string): Promise<UserMemoryEntry[]> {
    const { data, error } = await this.supabase
      .from('user_memory_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Singleton instance
export const memoryService = new MemoryService();
