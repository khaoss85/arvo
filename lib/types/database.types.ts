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
      body_measurements: {
        Row: {
          check_id: string
          created_at: string
          id: string
          measurement_type: string
          unit: string
          value: number
        }
        Insert: {
          check_id: string
          created_at?: string
          id?: string
          measurement_type: string
          unit?: string
          value: number
        }
        Update: {
          check_id?: string
          created_at?: string
          id?: string
          measurement_type?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "progress_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      caloric_phase_history: {
        Row: {
          avg_weight_change: number | null
          caloric_intake_kcal: number | null
          created_at: string | null
          duration_weeks: number | null
          ended_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          phase: string
          started_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_weight_change?: number | null
          caloric_intake_kcal?: number | null
          created_at?: string | null
          duration_weeks?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phase: string
          started_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_weight_change?: number | null
          caloric_intake_kcal?: number | null
          created_at?: string | null
          duration_weeks?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phase?: string
          started_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cycle_completions: {
        Row: {
          avg_mental_readiness: number | null
          completed_at: string
          created_at: string | null
          cycle_number: number
          id: string
          sets_by_muscle_group: Json | null
          split_plan_id: string
          total_duration_seconds: number | null
          total_sets: number
          total_volume: number
          total_workouts_completed: number
          updated_at: string | null
          user_id: string
          volume_by_muscle_group: Json | null
          workouts_by_type: Json | null
        }
        Insert: {
          avg_mental_readiness?: number | null
          completed_at?: string
          created_at?: string | null
          cycle_number: number
          id?: string
          sets_by_muscle_group?: Json | null
          split_plan_id: string
          total_duration_seconds?: number | null
          total_sets: number
          total_volume: number
          total_workouts_completed: number
          updated_at?: string | null
          user_id: string
          volume_by_muscle_group?: Json | null
          workouts_by_type?: Json | null
        }
        Update: {
          avg_mental_readiness?: number | null
          completed_at?: string
          created_at?: string | null
          cycle_number?: number
          id?: string
          sets_by_muscle_group?: Json | null
          split_plan_id?: string
          total_duration_seconds?: number | null
          total_sets?: number
          total_volume?: number
          total_workouts_completed?: number
          updated_at?: string | null
          user_id?: string
          volume_by_muscle_group?: Json | null
          workouts_by_type?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cycle_completions_split_plan_id_fkey"
            columns: ["split_plan_id"]
            isOneToOne: false
            referencedRelation: "split_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string
          email_subject: string
          email_template: string
          event_type: string
          id: string
          metadata: Json | null
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_subject: string
          email_template: string
          event_type: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_subject?: string
          email_template?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_generations: {
        Row: {
          animation_url: string | null
          created_at: string | null
          generated_by_ai: boolean | null
          has_animation: boolean | null
          id: string
          last_used_at: string | null
          metadata: Json | null
          name: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          animation_url?: string | null
          created_at?: string | null
          generated_by_ai?: boolean | null
          has_animation?: boolean | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          animation_url?: string | null
          created_at?: string | null
          generated_by_ai?: boolean | null
          has_animation?: boolean | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      progress_checks: {
        Row: {
          created_at: string
          cycle_day: number | null
          cycle_number: number | null
          id: string
          is_milestone: boolean
          notes: string | null
          taken_at: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          cycle_day?: number | null
          cycle_number?: number | null
          id?: string
          is_milestone?: boolean
          notes?: string | null
          taken_at?: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          cycle_day?: number | null
          cycle_number?: number | null
          id?: string
          is_milestone?: boolean
          notes?: string | null
          taken_at?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          check_id: string
          created_at: string
          id: string
          photo_order: number
          photo_type: string
          photo_url: string
        }
        Insert: {
          check_id: string
          created_at?: string
          id?: string
          photo_order?: number
          photo_type: string
          photo_url: string
        }
        Update: {
          check_id?: string
          created_at?: string
          id?: string
          photo_order?: number
          photo_type?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "progress_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      sets_log: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          exercise_name: string
          id: string
          mental_readiness: number | null
          notes: string | null
          original_exercise_name: string | null
          reps_actual: number | null
          reps_target: number | null
          rir_actual: number | null
          set_number: number | null
          set_type: string | null
          skip_reason: string | null
          skipped: boolean
          substitution_reason: string | null
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
          original_exercise_name?: string | null
          reps_actual?: number | null
          reps_target?: number | null
          rir_actual?: number | null
          set_number?: number | null
          set_type?: string | null
          skip_reason?: string | null
          skipped?: boolean
          substitution_reason?: string | null
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
          original_exercise_name?: string | null
          reps_actual?: number | null
          reps_target?: number | null
          rir_actual?: number | null
          set_number?: number | null
          set_type?: string | null
          skip_reason?: string | null
          skipped?: boolean
          substitution_reason?: string | null
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
      share_links: {
        Row: {
          created_at: string | null
          entity_id: string
          expires_at: string | null
          id: string
          privacy_settings: Json | null
          share_token: string
          share_type: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          expires_at?: string | null
          id?: string
          privacy_settings?: Json | null
          share_token: string
          share_type: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          expires_at?: string | null
          id?: string
          privacy_settings?: Json | null
          share_token?: string
          share_type?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      split_modifications: {
        Row: {
          ai_validation: Json
          created_at: string
          details: Json
          id: string
          modification_type: string
          previous_state: Json
          split_plan_id: string
          updated_at: string
          user_id: string
          user_override: boolean
          user_reason: string | null
        }
        Insert: {
          ai_validation: Json
          created_at?: string
          details: Json
          id?: string
          modification_type: string
          previous_state: Json
          split_plan_id: string
          updated_at?: string
          user_id: string
          user_override?: boolean
          user_reason?: string | null
        }
        Update: {
          ai_validation?: Json
          created_at?: string
          details?: Json
          id?: string
          modification_type?: string
          previous_state?: Json
          split_plan_id?: string
          updated_at?: string
          user_id?: string
          user_override?: boolean
          user_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "split_modifications_split_plan_id_fkey"
            columns: ["split_plan_id"]
            isOneToOne: false
            referencedRelation: "split_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      split_plans: {
        Row: {
          active: boolean | null
          ai_response_id: string | null
          approach_id: string | null
          created_at: string | null
          cycle_days: number
          frequency_map: Json
          id: string
          sessions: Json
          specialization_frequency: number | null
          specialization_muscle: string | null
          specialization_volume_multiplier: number | null
          split_type: Database["public"]["Enums"]["split_type"]
          updated_at: string | null
          user_id: string
          volume_distribution: Json
        }
        Insert: {
          active?: boolean | null
          ai_response_id?: string | null
          approach_id?: string | null
          created_at?: string | null
          cycle_days: number
          frequency_map: Json
          id?: string
          sessions: Json
          specialization_frequency?: number | null
          specialization_muscle?: string | null
          specialization_volume_multiplier?: number | null
          split_type: Database["public"]["Enums"]["split_type"]
          updated_at?: string | null
          user_id: string
          volume_distribution: Json
        }
        Update: {
          active?: boolean | null
          ai_response_id?: string | null
          approach_id?: string | null
          created_at?: string | null
          cycle_days?: number
          frequency_map?: Json
          id?: string
          sessions?: Json
          specialization_frequency?: number | null
          specialization_muscle?: string | null
          specialization_volume_multiplier?: number | null
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
          rest_timer_guidelines: Json | null
          rom_emphasis: Json | null
          short_philosophy: string | null
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
          rest_timer_guidelines?: Json | null
          rom_emphasis?: Json | null
          short_philosophy?: string | null
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
          rest_timer_guidelines?: Json | null
          rom_emphasis?: Json | null
          short_philosophy?: string | null
          split_variations?: Json | null
          stimulus_to_fatigue?: Json | null
          variables?: Json
          volume_landmarks?: Json | null
        }
        Relationships: []
      }
      user_approach_history: {
        Row: {
          approach_id: string
          created_at: string | null
          ended_at: string | null
          final_split_plan_id: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          started_at: string
          switch_reason: string | null
          total_weeks: number | null
          total_workouts_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approach_id: string
          created_at?: string | null
          ended_at?: string | null
          final_split_plan_id?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          started_at?: string
          switch_reason?: string | null
          total_weeks?: number | null
          total_workouts_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approach_id?: string
          created_at?: string | null
          ended_at?: string | null
          final_split_plan_id?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          started_at?: string
          switch_reason?: string | null
          total_weeks?: number | null
          total_workouts_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_approach_history_approach_id_fkey"
            columns: ["approach_id"]
            isOneToOne: false
            referencedRelation: "training_approaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_approach_history_final_split_plan_id_fkey"
            columns: ["final_split_plan_id"]
            isOneToOne: false
            referencedRelation: "split_plans"
            referencedColumns: ["id"]
          },
        ]
      }
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
      user_milestones: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          milestone_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          active_split_plan_id: string | null
          age: number | null
          approach_id: string | null
          audio_coaching_autoplay: boolean
          audio_coaching_enabled: boolean
          audio_coaching_speed: number
          available_equipment: string[] | null
          caloric_intake_kcal: number | null
          caloric_phase: string | null
          caloric_phase_start_date: string | null
          created_at: string | null
          current_cycle_day: number | null
          current_cycle_start_date: string | null
          current_mesocycle_week: number | null
          custom_equipment: Json | null
          cycles_completed: number | null
          email_frequency: Database["public"]["Enums"]["email_frequency"] | null
          email_notifications_enabled: boolean | null
          email_unsubscribed_at: string | null
          equipment_preferences: Json | null
          experience_years: number | null
          first_name: string | null
          gender: string
          height: number | null
          injuries_notes: string | null
          last_cycle_completed_at: string | null
          last_email_sent_at: string | null
          mesocycle_phase: string | null
          mesocycle_start_date: string | null
          preferred_language: string
          preferred_specialization_muscle: string | null
          preferred_split: string | null
          strength_baseline: Json | null
          training_focus: string | null
          updated_at: string | null
          user_id: string
          weak_points: string[] | null
          weight: number | null
        }
        Insert: {
          active_split_plan_id?: string | null
          age?: number | null
          approach_id?: string | null
          audio_coaching_autoplay?: boolean
          audio_coaching_enabled?: boolean
          audio_coaching_speed?: number
          available_equipment?: string[] | null
          caloric_intake_kcal?: number | null
          caloric_phase?: string | null
          caloric_phase_start_date?: string | null
          created_at?: string | null
          current_cycle_day?: number | null
          current_cycle_start_date?: string | null
          current_mesocycle_week?: number | null
          custom_equipment?: Json | null
          cycles_completed?: number | null
          email_frequency?:
            | Database["public"]["Enums"]["email_frequency"]
            | null
          email_notifications_enabled?: boolean | null
          email_unsubscribed_at?: string | null
          equipment_preferences?: Json | null
          experience_years?: number | null
          first_name?: string | null
          gender: string
          height?: number | null
          injuries_notes?: string | null
          last_cycle_completed_at?: string | null
          last_email_sent_at?: string | null
          mesocycle_phase?: string | null
          mesocycle_start_date?: string | null
          preferred_language?: string
          preferred_specialization_muscle?: string | null
          preferred_split?: string | null
          strength_baseline?: Json | null
          training_focus?: string | null
          updated_at?: string | null
          user_id: string
          weak_points?: string[] | null
          weight?: number | null
        }
        Update: {
          active_split_plan_id?: string | null
          age?: number | null
          approach_id?: string | null
          audio_coaching_autoplay?: boolean
          audio_coaching_enabled?: boolean
          audio_coaching_speed?: number
          available_equipment?: string[] | null
          caloric_intake_kcal?: number | null
          caloric_phase?: string | null
          caloric_phase_start_date?: string | null
          created_at?: string | null
          current_cycle_day?: number | null
          current_cycle_start_date?: string | null
          current_mesocycle_week?: number | null
          custom_equipment?: Json | null
          cycles_completed?: number | null
          email_frequency?:
            | Database["public"]["Enums"]["email_frequency"]
            | null
          email_notifications_enabled?: boolean | null
          email_unsubscribed_at?: string | null
          equipment_preferences?: Json | null
          experience_years?: number | null
          first_name?: string | null
          gender?: string
          height?: number | null
          injuries_notes?: string | null
          last_cycle_completed_at?: string | null
          last_email_sent_at?: string | null
          mesocycle_phase?: string | null
          mesocycle_start_date?: string | null
          preferred_language?: string
          preferred_specialization_muscle?: string | null
          preferred_split?: string | null
          strength_baseline?: Json | null
          training_focus?: string | null
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
          role: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          converted_user_id: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          invited_count: number
          queue_position: number | null
          referral_code: string
          referrer_id: string | null
          status: string
          training_goal: string | null
          updated_at: string
        }
        Insert: {
          converted_user_id?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          invited_count?: number
          queue_position?: number | null
          referral_code: string
          referrer_id?: string | null
          status?: string
          training_goal?: string | null
          updated_at?: string
        }
        Update: {
          converted_user_id?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          invited_count?: number
          queue_position?: number | null
          referral_code?: string
          referrer_id?: string | null
          status?: string
          training_goal?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "waitlist_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_generation_metrics: {
        Row: {
          completed_at: string | null
          context: Json | null
          created_at: string
          duration_ms: number | null
          id: string
          request_id: string
          started_at: string
          success: boolean | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          request_id: string
          started_at?: string
          success?: boolean | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          request_id?: string
          started_at?: string
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      workout_generation_queue: {
        Row: {
          completed_at: string | null
          context: Json | null
          created_at: string | null
          current_phase: string | null
          error_message: string | null
          id: string
          progress_percent: number | null
          request_id: string
          split_plan_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["generation_status"]
          target_cycle_day: number | null
          updated_at: string | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          current_phase?: string | null
          error_message?: string | null
          id?: string
          progress_percent?: number | null
          request_id: string
          split_plan_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          target_cycle_day?: number | null
          updated_at?: string | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          current_phase?: string | null
          error_message?: string | null
          id?: string
          progress_percent?: number | null
          request_id?: string
          split_plan_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          target_cycle_day?: number | null
          updated_at?: string | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_generation_queue_split_plan_id_fkey"
            columns: ["split_plan_id"]
            isOneToOne: false
            referencedRelation: "split_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_generation_queue_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
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
          workout_id: string | null
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
          workout_id?: string | null
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
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_insights_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          ai_response_id: string | null
          approach_id: string | null
          audio_scripts: Json | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          cycle_day: number | null
          duration_seconds: number | null
          exercises: Json[] | null
          id: string
          learned_target_weights: Json | null
          mental_readiness_overall: number | null
          notes: string | null
          planned_at: string | null
          split_plan_id: string | null
          split_type: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["workout_status"] | null
          target_muscle_groups: string[] | null
          total_sets: number | null
          total_volume: number | null
          updated_at: string | null
          user_id: string | null
          user_notes: string | null
          variation: Database["public"]["Enums"]["workout_variation"] | null
          workout_name: string | null
          workout_type: Database["public"]["Enums"]["workout_type"] | null
        }
        Insert: {
          ai_response_id?: string | null
          approach_id?: string | null
          audio_scripts?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          cycle_day?: number | null
          duration_seconds?: number | null
          exercises?: Json[] | null
          id?: string
          learned_target_weights?: Json | null
          mental_readiness_overall?: number | null
          notes?: string | null
          planned_at?: string | null
          split_plan_id?: string | null
          split_type?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workout_status"] | null
          target_muscle_groups?: string[] | null
          total_sets?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_notes?: string | null
          variation?: Database["public"]["Enums"]["workout_variation"] | null
          workout_name?: string | null
          workout_type?: Database["public"]["Enums"]["workout_type"] | null
        }
        Update: {
          ai_response_id?: string | null
          approach_id?: string | null
          audio_scripts?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          cycle_day?: number | null
          duration_seconds?: number | null
          exercises?: Json[] | null
          id?: string
          learned_target_weights?: Json | null
          mental_readiness_overall?: number | null
          notes?: string | null
          planned_at?: string | null
          split_plan_id?: string | null
          split_type?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workout_status"] | null
          target_muscle_groups?: string[] | null
          total_sets?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_notes?: string | null
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
      boost_memory_confidence: {
        Args: { p_boost_amount?: number; p_memory_id: string }
        Returns: undefined
      }
      calculate_mesocycle_week: {
        Args: { check_date?: string; start_date: string }
        Returns: number
      }
      calculate_queue_position: { Args: { entry_id: string }; Returns: number }
      check_email_already_sent: {
        Args: { p_event_type: string; p_hours_ago?: number; p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_share_links: { Args: never; Returns: undefined }
      cleanup_old_generations: { Args: never; Returns: undefined }
      complete_cycle: {
        Args: {
          p_avg_mental_readiness: number
          p_cycle_number: number
          p_next_cycle_day: number
          p_sets_by_muscle_group?: Json
          p_split_plan_id: string
          p_total_duration_seconds: number
          p_total_sets: number
          p_total_volume: number
          p_total_workouts_completed: number
          p_user_id: string
          p_volume_by_muscle_group: Json
          p_workouts_by_type?: Json
        }
        Returns: Json
      }
      generate_referral_code: { Args: never; Returns: string }
      get_active_insights: {
        Args: { p_min_relevance?: number; p_user_id: string }
        Returns: {
          created_at: string
          exercise_name: string
          id: string
          insight_type: string
          metadata: Json
          relevance_score: number
          severity: string
          user_note: string
          workout_id: string
        }[]
      }
      get_active_memories: {
        Args: { p_min_confidence?: number; p_user_id: string }
        Returns: {
          confidence_score: number
          description: string
          id: string
          memory_category: string
          metadata: Json
          related_exercises: string[]
          related_muscles: string[]
          times_confirmed: number
          title: string
        }[]
      }
      get_last_split_modification: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          details: Json
          id: string
          modification_type: string
          previous_state: Json
          split_plan_id: string
        }[]
      }
      get_recent_split_modifications: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          ai_validation: Json
          created_at: string
          details: Json
          id: string
          modification_type: string
          split_plan_id: string
          user_override: boolean
          user_reason: string
        }[]
      }
      get_user_onboarding_stats: { Args: { p_user_id: string }; Returns: Json }
      get_users_needing_first_workout_reminder: {
        Args: never
        Returns: {
          email: string
          first_name: string
          preferred_language: string
          target_muscles: string[]
          user_id: string
          workout_id: string
          workout_name: string
          workout_type: string
        }[]
      }
      get_users_needing_reengagement: {
        Args: never
        Returns: {
          days_since_last_workout: number
          email: string
          first_name: string
          preferred_language: string
          user_id: string
        }[]
      }
      get_users_needing_weekly_progress: {
        Args: never
        Returns: {
          email: string
          first_name: string
          preferred_language: string
          user_id: string
          week_number: number
        }[]
      }
      increment_share_view_count: {
        Args: { token: string }
        Returns: undefined
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      refresh_all_queue_positions: { Args: never; Returns: undefined }
      update_insight_relevance_scores: { Args: never; Returns: undefined }
    }
    Enums: {
      email_frequency: "immediate" | "daily_digest" | "weekly_digest" | "none"
      generation_status: "pending" | "in_progress" | "completed" | "failed"
      split_type:
        | "push_pull_legs"
        | "upper_lower"
        | "full_body"
        | "custom"
        | "bro_split"
        | "weak_point_focus"
      workout_status: "draft" | "ready" | "in_progress" | "completed"
      workout_type:
        | "push"
        | "pull"
        | "legs"
        | "upper"
        | "lower"
        | "full_body"
        | "chest"
        | "back"
        | "shoulders"
        | "arms"
        | "rest"
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
      email_frequency: ["immediate", "daily_digest", "weekly_digest", "none"],
      generation_status: ["pending", "in_progress", "completed", "failed"],
      split_type: [
        "push_pull_legs",
        "upper_lower",
        "full_body",
        "custom",
        "bro_split",
        "weak_point_focus",
      ],
      workout_status: ["draft", "ready", "in_progress", "completed"],
      workout_type: [
        "push",
        "pull",
        "legs",
        "upper",
        "lower",
        "full_body",
        "chest",
        "back",
        "shoulders",
        "arms",
      ],
      workout_variation: ["A", "B"],
    },
  },
} as const
