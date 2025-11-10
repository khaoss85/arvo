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
      }
    }
  }
}
