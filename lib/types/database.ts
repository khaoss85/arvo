export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string | null
          equipment_variants: Json | null
          id: string
          name: string
          pattern: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_variants?: Json | null
          id?: string
          name: string
          pattern?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_variants?: Json | null
          id?: string
          name?: string
          pattern?: string | null
        }
        Relationships: []
      }
      sets_log: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          id: string
          notes: string | null
          reps_actual: number | null
          reps_target: number | null
          rir_actual: number | null
          set_number: number | null
          weight_actual: number | null
          weight_target: number | null
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          reps_actual?: number | null
          reps_target?: number | null
          rir_actual?: number | null
          set_number?: number | null
          weight_actual?: number | null
          weight_target?: number | null
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          reps_actual?: number | null
          reps_target?: number | null
          rir_actual?: number | null
          set_number?: number | null
          weight_actual?: number | null
          weight_target?: number | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sets_log_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_log_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      training_approaches: {
        Row: {
          created_at: string | null
          creator: string | null
          exercise_rules: Json
          id: string
          name: string
          philosophy: string | null
          progression_rules: Json
          rationales: Json | null
          variables: Json
        }
        Insert: {
          created_at?: string | null
          creator?: string | null
          exercise_rules: Json
          id?: string
          name: string
          philosophy?: string | null
          progression_rules: Json
          rationales?: Json | null
          variables: Json
        }
        Update: {
          created_at?: string | null
          creator?: string | null
          exercise_rules?: Json
          id?: string
          name?: string
          philosophy?: string | null
          progression_rules?: Json
          rationales?: Json | null
          variables?: Json
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          approach_id: string | null
          created_at: string | null
          equipment_preferences: Json | null
          experience_years: number | null
          strength_baseline: Json | null
          updated_at: string | null
          user_id: string
          weak_points: string[] | null
        }
        Insert: {
          approach_id?: string | null
          created_at?: string | null
          equipment_preferences?: Json | null
          experience_years?: number | null
          strength_baseline?: Json | null
          updated_at?: string | null
          user_id: string
          weak_points?: string[] | null
        }
        Update: {
          approach_id?: string | null
          created_at?: string | null
          equipment_preferences?: Json | null
          experience_years?: number | null
          strength_baseline?: Json | null
          updated_at?: string | null
          user_id?: string
          weak_points?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_approach_id_fkey"
            columns: ["approach_id"]
            isOneToOne: false
            referencedRelation: "training_approaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          approach_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          exercises: Json[] | null
          id: string
          notes: string | null
          planned_at: string | null
          started_at: string | null
          total_sets: number | null
          total_volume: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approach_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          exercises?: Json[] | null
          id?: string
          notes?: string | null
          planned_at?: string | null
          started_at?: string | null
          total_sets?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approach_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          exercises?: Json[] | null
          id?: string
          notes?: string | null
          planned_at?: string | null
          started_at?: string | null
          total_sets?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_approach_id_fkey"
            columns: ["approach_id"]
            isOneToOne: false
            referencedRelation: "training_approaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
