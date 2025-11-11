export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_memory_entries: {
        Row: {
          confidence_score: number
          created_at: string
          description: string | null
          first_observed_at: string
          id: string
          last_confirmed_at: string
          memory_category: string
          memory_source: string
          metadata: Json | null
          related_exercises: string[] | null
          related_muscles: string[] | null
          source_id: string | null
          status: string
          times_confirmed: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          description?: string | null
          first_observed_at?: string
          id?: string
          last_confirmed_at?: string
          memory_category: string
          memory_source: string
          metadata?: Json | null
          related_exercises?: string[] | null
          related_muscles?: string[] | null
          source_id?: string | null
          status?: string
          times_confirmed?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          description?: string | null
          first_observed_at?: string
          id?: string
          last_confirmed_at?: string
          memory_category?: string
          memory_source?: string
          metadata?: Json | null
          related_exercises?: string[] | null
          related_muscles?: string[] | null
          source_id?: string | null
          status?: string
          times_confirmed?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_insights: {
        Row: {
          created_at: string
          exercise_name: string | null
          id: string
          insight_type: string | null
          last_mentioned_at: string | null
          metadata: Json | null
          relevance_score: number
          resolution_proposed_at: string | null
          resolution_proposed_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string
          updated_at: string
          user_id: string
          user_note: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_name?: string | null
          id?: string
          insight_type?: string | null
          last_mentioned_at?: string | null
          metadata?: Json | null
          relevance_score?: number
          resolution_proposed_at?: string | null
          resolution_proposed_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_note: string
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string | null
          id?: string
          insight_type?: string | null
          last_mentioned_at?: string | null
          metadata?: Json | null
          relevance_score?: number
          resolution_proposed_at?: string | null
          resolution_proposed_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_note?: string
          workout_id?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      get_active_insights: {
        Args: { p_min_relevance?: number; p_user_id: string }
        Returns: any[]
      }
      get_active_memories: {
        Args: { p_min_confidence?: number; p_user_id: string }
        Returns: any[]
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
