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
      exercise_generations: {
        Row: {
          created_at: string | null
          generated_by_ai: boolean | null
          id: string
          last_used_at: string | null
          metadata: Json | null
          name: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          generated_by_ai?: boolean | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          generated_by_ai?: boolean | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      sets_log: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          exercise_name: string
          id: string
          mental_readiness: number | null
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
          exercise_name: string
          id?: string
          mental_readiness?: number | null
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
          exercise_name?: string
          id?: string
          mental_readiness?: number | null
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
            foreignKeyName: "sets_log_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      split_plans: {
        Row: {
          active: boolean | null
          approach_id: string | null
          created_at: string | null
          cycle_days: number
          frequency_map: Json
          id: string
          sessions: Json
          split_type: Database["public"]["Enums"]["split_type"]
          updated_at: string | null
          user_id: string
          volume_distribution: Json
        }
        Insert: {
          active?: boolean | null
          approach_id?: string | null
          created_at?: string | null
          cycle_days: number
          frequency_map: Json
          id?: string
          sessions: Json
          split_type: Database["public"]["Enums"]["split_type"]
          updated_at?: string | null
          user_id: string
          volume_distribution: Json
        }
        Update: {
          active?: boolean | null
          approach_id?: string | null
          created_at?: string | null
          cycle_days?: number
          frequency_map?: Json
          id?: string
          sessions?: Json
          split_type?: Database["public"]["Enums"]["split_type"]
          updated_at?: string | null
          user_id?: string
          volume_distribution?: Json
        }
        Relationships: [
          {
            foreignKeyName: "split_plans_approach_id_fkey"
            columns: ["approach_id"]
            isOneToOne: false
            referencedRelation: "training_approaches"
            referencedColumns: ["id"]
          },
        ]
      }
      training_approaches: {
        Row: {
          advanced_techniques: Json | null
          created_at: string | null
          creator: string | null
          exercise_rules: Json
          exercise_selection_principles: Json | null
          frequency_guidelines: Json | null
          id: string
          name: string
          periodization: Json | null
          philosophy: string | null
          progression_rules: Json
          rationales: Json | null
          rom_emphasis: Json | null
          split_variations: Json | null
          stimulus_to_fatigue: Json | null
          variables: Json
          volume_landmarks: Json | null
        }
        Insert: {
          advanced_techniques?: Json | null
          created_at?: string | null
          creator?: string | null
          exercise_rules: Json
          exercise_selection_principles?: Json | null
          frequency_guidelines?: Json | null
          id?: string
          name: string
          periodization?: Json | null
          philosophy?: string | null
          progression_rules: Json
          rationales?: Json | null
          rom_emphasis?: Json | null
          split_variations?: Json | null
          stimulus_to_fatigue?: Json | null
          variables: Json
          volume_landmarks?: Json | null
        }
        Update: {
          advanced_techniques?: Json | null
          created_at?: string | null
          creator?: string | null
          exercise_rules?: Json
          exercise_selection_principles?: Json | null
          frequency_guidelines?: Json | null
          id?: string
          name?: string
          periodization?: Json | null
          philosophy?: string | null
          progression_rules?: Json
          rationales?: Json | null
          rom_emphasis?: Json | null
          split_variations?: Json | null
          stimulus_to_fatigue?: Json | null
          variables?: Json
          volume_landmarks?: Json | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          active_split_plan_id: string | null
          age: number | null
          approach_id: string | null
          available_equipment: string[] | null
          created_at: string | null
          current_cycle_day: number | null
          current_mesocycle_week: number | null
          equipment_preferences: Json | null
          experience_years: number | null
          first_name: string | null
          gender: string | null
          height: number | null
          mesocycle_phase: string | null
          mesocycle_start_date: string | null
          preferred_split: string | null
          strength_baseline: Json | null
          updated_at: string | null
          user_id: string
          weak_points: string[] | null
          weight: number | null
        }
        Insert: {
          active_split_plan_id?: string | null
          age?: number | null
          approach_id?: string | null
          available_equipment?: string[] | null
          created_at?: string | null
          current_cycle_day?: number | null
          current_mesocycle_week?: number | null
          equipment_preferences?: Json | null
          experience_years?: number | null
          first_name?: string | null
          gender?: string | null
          height?: number | null
          mesocycle_phase?: string | null
          mesocycle_start_date?: string | null
          preferred_split?: string | null
          strength_baseline?: Json | null
          updated_at?: string | null
          user_id: string
          weak_points?: string[] | null
          weight?: number | null
        }
        Update: {
          active_split_plan_id?: string | null
          age?: number | null
          approach_id?: string | null
          available_equipment?: string[] | null
          created_at?: string | null
          current_cycle_day?: number | null
          current_mesocycle_week?: number | null
          equipment_preferences?: Json | null
          experience_years?: number | null
          first_name?: string | null
          gender?: string | null
          height?: number | null
          mesocycle_phase?: string | null
          mesocycle_start_date?: string | null
          preferred_split?: string | null
          strength_baseline?: Json | null
          updated_at?: string | null
          user_id?: string
          weak_points?: string[] | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_active_split_plan_id_fkey"
            columns: ["active_split_plan_id"]
            isOneToOne: false
            referencedRelation: "split_plans"
            referencedColumns: ["id"]
          },
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
          cycle_day: number | null
          duration_seconds: number | null
          exercises: Json[] | null
          id: string
          mental_readiness_overall: number | null
          notes: string | null
          planned_at: string | null
          split_plan_id: string | null
          split_type: string | null
          started_at: string | null
          target_muscle_groups: string[] | null
          total_sets: number | null
          total_volume: number | null
          updated_at: string | null
          user_id: string | null
          variation: Database["public"]["Enums"]["workout_variation"] | null
          workout_name: string | null
          workout_type: Database["public"]["Enums"]["workout_type"] | null
        }
        Insert: {
          approach_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          cycle_day?: number | null
          duration_seconds?: number | null
          exercises?: Json[] | null
          id?: string
          mental_readiness_overall?: number | null
          notes?: string | null
          planned_at?: string | null
          split_plan_id?: string | null
          split_type?: string | null
          started_at?: string | null
          target_muscle_groups?: string[] | null
          total_sets?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id?: string | null
          variation?: Database["public"]["Enums"]["workout_variation"] | null
          workout_name?: string | null
          workout_type?: Database["public"]["Enums"]["workout_type"] | null
        }
        Update: {
          approach_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          cycle_day?: number | null
          duration_seconds?: number | null
          exercises?: Json[] | null
          id?: string
          mental_readiness_overall?: number | null
          notes?: string | null
          planned_at?: string | null
          split_plan_id?: string | null
          split_type?: string | null
          started_at?: string | null
          target_muscle_groups?: string[] | null
          total_sets?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id?: string | null
          variation?: Database["public"]["Enums"]["workout_variation"] | null
          workout_name?: string | null
          workout_type?: Database["public"]["Enums"]["workout_type"] | null
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
            foreignKeyName: "workouts_split_plan_id_fkey"
            columns: ["split_plan_id"]
            isOneToOne: false
            referencedRelation: "split_plans"
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
      calculate_mesocycle_week: {
        Args: { check_date?: string; start_date: string }
        Returns: number
      }
    }
    Enums: {
      split_type: "push_pull_legs" | "upper_lower" | "full_body" | "custom"
      workout_type: "push" | "pull" | "legs" | "upper" | "lower" | "full_body"
      workout_variation: "A" | "B"
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
    Enums: {
      split_type: ["push_pull_legs", "upper_lower", "full_body", "custom"],
      workout_type: ["push", "pull", "legs", "upper", "lower", "full_body"],
      workout_variation: ["A", "B"],
    },
  },
} as const
