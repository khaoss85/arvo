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
      booking_notifications: {
        Row: {
          booking_id: string | null
          channel: string
          created_at: string | null
          id: string
          metadata: Json | null
          notification_type: string
          recipient_id: string
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          booking_id?: string | null
          channel: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          recipient_id: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          booking_id?: string | null
          channel?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          recipient_id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_packages: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          sessions_per_week: number | null
          sessions_used: number | null
          start_date: string
          status: string | null
          total_sessions: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          sessions_per_week?: number | null
          sessions_used?: number | null
          start_date: string
          status?: string | null
          total_sessions: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          sessions_per_week?: number | null
          sessions_used?: number | null
          start_date?: string
          status?: string | null
          total_sessions?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_waitlist_entries: {
        Row: {
          ai_priority_score: number | null
          ai_score_reason: string | null
          client_id: string
          coach_id: string
          created_at: string | null
          id: string
          notes: string | null
          notified_at: string | null
          package_id: string | null
          preferred_days: number[]
          preferred_time_end: string | null
          preferred_time_start: string | null
          responded_at: string | null
          response_deadline: string | null
          status: string
          updated_at: string | null
          urgency_level: number | null
        }
        Insert: {
          ai_priority_score?: number | null
          ai_score_reason?: string | null
          client_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          package_id?: string | null
          preferred_days?: number[]
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          responded_at?: string | null
          response_deadline?: string | null
          status?: string
          updated_at?: string | null
          urgency_level?: number | null
        }
        Update: {
          ai_priority_score?: number | null
          ai_score_reason?: string | null
          client_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          package_id?: string | null
          preferred_days?: number[]
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          responded_at?: string | null
          response_deadline?: string | null
          status?: string
          updated_at?: string | null
          urgency_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_waitlist_entries_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "booking_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          ai_scheduled: boolean | null
          ai_suggestion_accepted: boolean | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_notes: string | null
          coach_id: string
          coach_notes: string | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          end_time: string
          id: string
          location_type: Database["public"]["Enums"]["session_location_type"]
          meeting_url: string | null
          package_id: string | null
          scheduled_date: string
          session_charged_on_cancel: boolean | null
          start_time: string
          status: string
          updated_at: string | null
          was_late_cancellation: boolean | null
        }
        Insert: {
          ai_scheduled?: boolean | null
          ai_suggestion_accepted?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          client_notes?: string | null
          coach_id: string
          coach_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time: string
          id?: string
          location_type?: Database["public"]["Enums"]["session_location_type"]
          meeting_url?: string | null
          package_id?: string | null
          scheduled_date: string
          session_charged_on_cancel?: boolean | null
          start_time: string
          status?: string
          updated_at?: string | null
          was_late_cancellation?: boolean | null
        }
        Update: {
          ai_scheduled?: boolean | null
          ai_suggestion_accepted?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          client_notes?: string | null
          coach_id?: string
          coach_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string
          id?: string
          location_type?: Database["public"]["Enums"]["session_location_type"]
          meeting_url?: string | null
          package_id?: string | null
          scheduled_date?: string
          session_charged_on_cancel?: boolean | null
          start_time?: string
          status?: string
          updated_at?: string | null
          was_late_cancellation?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "booking_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_optimization_suggestions: {
        Row: {
          benefit_score: number | null
          client_id: string
          client_preference_score: number | null
          coach_id: string
          created_at: string | null
          expires_at: string
          gap_details: Json
          id: string
          proposed_date: string
          proposed_end_time: string
          proposed_start_time: string
          reason_detailed: string | null
          reason_short: string
          reviewed_at: string | null
          source_booking_id: string
          status: string
          suggestion_type: string
        }
        Insert: {
          benefit_score?: number | null
          client_id: string
          client_preference_score?: number | null
          coach_id: string
          created_at?: string | null
          expires_at: string
          gap_details?: Json
          id?: string
          proposed_date: string
          proposed_end_time: string
          proposed_start_time: string
          reason_detailed?: string | null
          reason_short: string
          reviewed_at?: string | null
          source_booking_id: string
          status?: string
          suggestion_type: string
        }
        Update: {
          benefit_score?: number | null
          client_id?: string
          client_preference_score?: number | null
          coach_id?: string
          created_at?: string | null
          expires_at?: string
          gap_details?: Json
          id?: string
          proposed_date?: string
          proposed_end_time?: string
          proposed_start_time?: string
          reason_detailed?: string | null
          reason_short?: string
          reviewed_at?: string | null
          source_booking_id?: string
          status?: string
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_optimization_suggestions_source_booking_id_fkey"
            columns: ["source_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
      client_no_show_alerts: {
        Row: {
          acknowledged_at: string | null
          client_id: string
          coach_id: string
          coach_notes: string | null
          created_at: string | null
          id: string
          no_show_count: number
          no_show_rate: number
          session_count: number
        }
        Insert: {
          acknowledged_at?: string | null
          client_id: string
          coach_id: string
          coach_notes?: string | null
          created_at?: string | null
          id?: string
          no_show_count: number
          no_show_rate: number
          session_count: number
        }
        Update: {
          acknowledged_at?: string | null
          client_id?: string
          coach_id?: string
          coach_notes?: string | null
          created_at?: string | null
          id?: string
          no_show_count?: number
          no_show_rate?: number
          session_count?: number
        }
        Relationships: []
      }
      coach_availability: {
        Row: {
          coach_id: string
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          location_type: Database["public"]["Enums"]["session_location_type"]
          start_time: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          location_type?: Database["public"]["Enums"]["session_location_type"]
          start_time: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          location_type?: Database["public"]["Enums"]["session_location_type"]
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_blocks: {
        Row: {
          block_type: string
          coach_id: string
          created_at: string | null
          custom_reason: string | null
          end_date: string
          end_time: string | null
          id: string
          notes: string | null
          start_date: string
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          block_type: string
          coach_id: string
          created_at?: string | null
          custom_reason?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_date: string
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          block_type?: string
          coach_id?: string
          created_at?: string | null
          custom_reason?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_cancellation_policies: {
        Row: {
          coach_id: string
          created_at: string | null
          free_cancellation_hours: number
          id: string
          late_cancel_charges_session: boolean
          late_cancel_refund_percentage: number | null
          policy_summary_en: string | null
          policy_summary_it: string | null
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          free_cancellation_hours?: number
          id?: string
          late_cancel_charges_session?: boolean
          late_cancel_refund_percentage?: number | null
          policy_summary_en?: string | null
          policy_summary_it?: string | null
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          free_cancellation_hours?: number
          id?: string
          late_cancel_charges_session?: boolean
          late_cancel_refund_percentage?: number | null
          policy_summary_en?: string | null
          policy_summary_it?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_client_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_shared: boolean | null
          relationship_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_shared?: boolean | null
          relationship_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_shared?: boolean | null
          relationship_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_client_notes_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "coach_client_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_client_relationships: {
        Row: {
          accepted_at: string | null
          client_autonomy: string | null
          client_id: string
          coach_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          notes: string | null
          status: string | null
          terminated_at: string | null
          termination_reason: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_autonomy?: string | null
          client_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          status?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_autonomy?: string | null
          client_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          status?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string
          gym_id: string | null
          invite_code: string
          max_clients: number | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name: string
          gym_id?: string | null
          invite_code: string
          max_clients?: number | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string
          gym_id?: string | null
          invite_code?: string
          max_clients?: number | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_split_plan_assignments: {
        Row: {
          assigned_at: string | null
          assignment_type: string
          client_id: string
          coach_id: string
          coach_notes: string | null
          created_at: string | null
          id: string
          split_plan_id: string
          template_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assignment_type: string
          client_id: string
          coach_id: string
          coach_notes?: string | null
          created_at?: string | null
          id?: string
          split_plan_id: string
          template_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assignment_type?: string
          client_id?: string
          coach_id?: string
          coach_notes?: string | null
          created_at?: string | null
          id?: string
          split_plan_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_split_plan_assignments_split_plan_id_fkey"
            columns: ["split_plan_id"]
            isOneToOne: false
            referencedRelation: "split_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_split_plan_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "split_plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_workout_assignments: {
        Row: {
          approved_at: string | null
          assigned_at: string | null
          assignment_type: string | null
          client_id: string
          client_notes: string | null
          coach_id: string
          coach_notes: string | null
          created_at: string | null
          id: string
          template_id: string | null
          workout_id: string
        }
        Insert: {
          approved_at?: string | null
          assigned_at?: string | null
          assignment_type?: string | null
          client_id: string
          client_notes?: string | null
          coach_id: string
          coach_notes?: string | null
          created_at?: string | null
          id?: string
          template_id?: string | null
          workout_id: string
        }
        Update: {
          approved_at?: string | null
          assigned_at?: string | null
          assignment_type?: string | null
          client_id?: string
          client_notes?: string | null
          coach_id?: string
          coach_notes?: string | null
          created_at?: string | null
          id?: string
          template_id?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_workout_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_workout_assignments_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_usage: {
        Row: {
          agent_name: string | null
          characters_processed: number | null
          created_at: string
          credits_used: number
          estimated_cost_usd: number | null
          id: string
          metadata: Json | null
          model_used: string | null
          operation_type: Database["public"]["Enums"]["credit_operation_type"]
          reasoning_effort: string | null
          request_id: string | null
          tokens_input: number | null
          tokens_output: number | null
          tokens_reasoning: number | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          agent_name?: string | null
          characters_processed?: number | null
          created_at?: string
          credits_used?: number
          estimated_cost_usd?: number | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          operation_type: Database["public"]["Enums"]["credit_operation_type"]
          reasoning_effort?: string | null
          request_id?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_reasoning?: number | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          agent_name?: string | null
          characters_processed?: number | null
          created_at?: string
          credits_used?: number
          estimated_cost_usd?: number | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          operation_type?: Database["public"]["Enums"]["credit_operation_type"]
          reasoning_effort?: string | null
          request_id?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_reasoning?: number | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_usage_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
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
      gym_branding: {
        Row: {
          accent_color: string | null
          app_name: string | null
          background_color: string | null
          created_at: string | null
          custom_domain: string | null
          custom_texts: Json | null
          favicon_url: string | null
          font_family: string | null
          font_heading: string | null
          footer_text: Json | null
          gym_id: string
          id: string
          logo_dark_url: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          short_name: string | null
          show_arvo_branding: boolean | null
          splash_image_url: string | null
          tagline: Json | null
          text_color: string | null
          updated_at: string | null
          welcome_message: Json | null
        }
        Insert: {
          accent_color?: string | null
          app_name?: string | null
          background_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_texts?: Json | null
          favicon_url?: string | null
          font_family?: string | null
          font_heading?: string | null
          footer_text?: Json | null
          gym_id: string
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string | null
          show_arvo_branding?: boolean | null
          splash_image_url?: string | null
          tagline?: Json | null
          text_color?: string | null
          updated_at?: string | null
          welcome_message?: Json | null
        }
        Update: {
          accent_color?: string | null
          app_name?: string | null
          background_color?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_texts?: Json | null
          favicon_url?: string | null
          font_family?: string | null
          font_heading?: string | null
          footer_text?: Json | null
          gym_id?: string
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string | null
          show_arvo_branding?: boolean | null
          splash_image_url?: string | null
          tagline?: Json | null
          text_color?: string | null
          updated_at?: string | null
          welcome_message?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_branding_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: true
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_members: {
        Row: {
          assigned_coach_id: string | null
          created_at: string | null
          gym_id: string
          id: string
          internal_notes: string | null
          last_active_at: string | null
          membership_expires_at: string | null
          membership_type: string | null
          registered_at: string | null
          registration_source: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_coach_id?: string | null
          created_at?: string | null
          gym_id: string
          id?: string
          internal_notes?: string | null
          last_active_at?: string | null
          membership_expires_at?: string | null
          membership_type?: string | null
          registered_at?: string | null
          registration_source?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_coach_id?: string | null
          created_at?: string | null
          gym_id?: string
          id?: string
          internal_notes?: string | null
          last_active_at?: string | null
          membership_expires_at?: string | null
          membership_type?: string | null
          registered_at?: string | null
          registration_source?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_staff: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          gym_id: string
          id: string
          invited_at: string | null
          invited_by: string | null
          notes: string | null
          permissions: Json | null
          staff_role: string
          status: string
          terminated_at: string | null
          termination_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          gym_id: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          notes?: string | null
          permissions?: Json | null
          staff_role?: string
          status?: string
          terminated_at?: string | null
          termination_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          gym_id?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          notes?: string | null
          permissions?: Json | null
          staff_role?: string
          status?: string
          terminated_at?: string | null
          termination_reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_staff_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: Json | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          invite_code: string
          max_members: number | null
          max_staff: number | null
          name: string
          owner_id: string
          phone: string | null
          settings: Json | null
          slug: string
          subscription_plan: string | null
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          invite_code: string
          max_members?: number | null
          max_staff?: number | null
          name: string
          owner_id: string
          phone?: string | null
          settings?: Json | null
          slug: string
          subscription_plan?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          invite_code?: string
          max_members?: number | null
          max_staff?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          subscription_plan?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      musclewiki_exercise_cache: {
        Row: {
          access_count: number | null
          category: string | null
          created_at: string | null
          difficulty: string | null
          fetched_at: string | null
          force: string | null
          grips: string[] | null
          id: string
          mechanic: string | null
          musclewiki_id: number | null
          name: string
          name_normalized: string
          primary_muscles: string[] | null
          steps: string[] | null
          videos: Json
        }
        Insert: {
          access_count?: number | null
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          fetched_at?: string | null
          force?: string | null
          grips?: string[] | null
          id?: string
          mechanic?: string | null
          musclewiki_id?: number | null
          name: string
          name_normalized: string
          primary_muscles?: string[] | null
          steps?: string[] | null
          videos?: Json
        }
        Update: {
          access_count?: number | null
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          fetched_at?: string | null
          force?: string | null
          grips?: string[] | null
          id?: string
          mechanic?: string | null
          musclewiki_id?: number | null
          name?: string
          name_normalized?: string
          primary_muscles?: string[] | null
          steps?: string[] | null
          videos?: Json
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
          technique: Json | null
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
          technique?: Json | null
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
          technique?: Json | null
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
      split_plan_templates: {
        Row: {
          coach_id: string | null
          created_at: string | null
          cycle_days: number
          description: string | null
          frequency_map: Json | null
          id: string
          is_public: boolean | null
          is_system: boolean | null
          name: string
          sessions: Json
          split_type: string
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
          volume_distribution: Json | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          cycle_days: number
          description?: string | null
          frequency_map?: Json | null
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          name: string
          sessions: Json
          split_type: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          volume_distribution?: Json | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          cycle_days?: number
          description?: string | null
          frequency_map?: Json | null
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          name?: string
          sessions?: Json
          split_type?: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          volume_distribution?: Json | null
        }
        Relationships: []
      }
      split_plans: {
        Row: {
          active: boolean | null
          ai_response_id: string | null
          approach_id: string | null
          archived_at: string | null
          archived_reason: string | null
          created_at: string | null
          cycle_days: number
          frequency_map: Json
          id: string
          sessions: Json
          source: string | null
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
          archived_at?: string | null
          archived_reason?: string | null
          created_at?: string | null
          cycle_days: number
          frequency_map: Json
          id?: string
          sessions: Json
          source?: string | null
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
          archived_at?: string | null
          archived_reason?: string | null
          created_at?: string | null
          cycle_days?: number
          frequency_map?: Json
          id?: string
          sessions?: Json
          source?: string | null
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
      technique_analytics: {
        Row: {
          completed_at: string | null
          created_at: string | null
          execution_result: Json | null
          exercise_name: string
          id: string
          technique_config: Json
          technique_type: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          execution_result?: Json | null
          exercise_name: string
          id?: string
          technique_config: Json
          technique_type: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          execution_result?: Json | null
          exercise_name?: string
          id?: string
          technique_config?: Json
          technique_type?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technique_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technique_analytics_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      training_approaches: {
        Row: {
          advanced_techniques: Json | null
          category: string
          created_at: string | null
          creator: string | null
          exercise_rules: Json
          exercise_selection_principles: Json | null
          frequency_guidelines: Json | null
          id: string
          level_notes: Json | null
          name: string
          periodization: Json | null
          philosophy: string | null
          progression_rules: Json
          rationales: Json | null
          recommended_level: string | null
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
          category?: string
          created_at?: string | null
          creator?: string | null
          exercise_rules: Json
          exercise_selection_principles?: Json | null
          frequency_guidelines?: Json | null
          id?: string
          level_notes?: Json | null
          name: string
          periodization?: Json | null
          philosophy?: string | null
          progression_rules: Json
          rationales?: Json | null
          recommended_level?: string | null
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
          category?: string
          created_at?: string | null
          creator?: string | null
          exercise_rules?: Json
          exercise_selection_principles?: Json | null
          frequency_guidelines?: Json | null
          id?: string
          level_notes?: Json | null
          name?: string
          periodization?: Json | null
          philosophy?: string | null
          progression_rules?: Json
          rationales?: Json | null
          recommended_level?: string | null
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
          app_mode: string | null
          approach_id: string | null
          audio_coaching_autoplay: boolean
          audio_coaching_enabled: boolean
          audio_coaching_speed: number
          available_equipment: string[] | null
          body_type: string | null
          caloric_intake_kcal: number | null
          caloric_phase: string | null
          caloric_phase_start_date: string | null
          coach_id: string | null
          created_at: string | null
          current_cycle_day: number | null
          current_cycle_start_date: string | null
          current_mesocycle_week: number | null
          custom_equipment: Json | null
          cycles_completed: number | null
          email_frequency: Database["public"]["Enums"]["email_frequency"] | null
          email_notifications_enabled: boolean | null
          email_unsubscribed_at: string | null
          experience_years: number | null
          first_name: string | null
          gender: string
          gym_id: string | null
          height: number | null
          injuries_notes: string | null
          last_cycle_completed_at: string | null
          last_email_sent_at: string | null
          mesocycle_phase: string | null
          mesocycle_start_date: string | null
          preferred_language: string
          preferred_specialization_muscle: string | null
          preferred_split: string | null
          sport_goal: string | null
          strength_baseline: Json | null
          training_focus: string | null
          training_maxes: Json | null
          updated_at: string | null
          user_id: string
          weak_points: string[] | null
          weight: number | null
        }
        Insert: {
          active_split_plan_id?: string | null
          age?: number | null
          app_mode?: string | null
          approach_id?: string | null
          audio_coaching_autoplay?: boolean
          audio_coaching_enabled?: boolean
          audio_coaching_speed?: number
          available_equipment?: string[] | null
          body_type?: string | null
          caloric_intake_kcal?: number | null
          caloric_phase?: string | null
          caloric_phase_start_date?: string | null
          coach_id?: string | null
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
          experience_years?: number | null
          first_name?: string | null
          gender?: string
          gym_id?: string | null
          height?: number | null
          injuries_notes?: string | null
          last_cycle_completed_at?: string | null
          last_email_sent_at?: string | null
          mesocycle_phase?: string | null
          mesocycle_start_date?: string | null
          preferred_language?: string
          preferred_specialization_muscle?: string | null
          preferred_split?: string | null
          sport_goal?: string | null
          strength_baseline?: Json | null
          training_focus?: string | null
          training_maxes?: Json | null
          updated_at?: string | null
          user_id: string
          weak_points?: string[] | null
          weight?: number | null
        }
        Update: {
          active_split_plan_id?: string | null
          age?: number | null
          app_mode?: string | null
          approach_id?: string | null
          audio_coaching_autoplay?: boolean
          audio_coaching_enabled?: boolean
          audio_coaching_speed?: number
          available_equipment?: string[] | null
          body_type?: string | null
          caloric_intake_kcal?: number | null
          caloric_phase?: string | null
          caloric_phase_start_date?: string | null
          coach_id?: string | null
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
          experience_years?: number | null
          first_name?: string | null
          gender?: string
          gym_id?: string | null
          height?: number | null
          injuries_notes?: string | null
          last_cycle_completed_at?: string | null
          last_email_sent_at?: string | null
          mesocycle_phase?: string | null
          mesocycle_start_date?: string | null
          preferred_language?: string
          preferred_specialization_muscle?: string | null
          preferred_split?: string | null
          sport_goal?: string | null
          strength_baseline?: Json | null
          training_focus?: string | null
          training_maxes?: Json | null
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
            foreignKeyName: "user_profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
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
      workout_templates: {
        Row: {
          ai_suggestions_enabled: boolean | null
          coach_id: string
          created_at: string | null
          description: string | null
          exercises: Json
          id: string
          is_public: boolean | null
          name: string
          tags: string[] | null
          target_muscle_groups: string[] | null
          updated_at: string | null
          usage_count: number | null
          workout_type: string[] | null
        }
        Insert: {
          ai_suggestions_enabled?: boolean | null
          coach_id: string
          created_at?: string | null
          description?: string | null
          exercises: Json
          id?: string
          is_public?: boolean | null
          name: string
          tags?: string[] | null
          target_muscle_groups?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          workout_type?: string[] | null
        }
        Update: {
          ai_suggestions_enabled?: boolean | null
          coach_id?: string
          created_at?: string | null
          description?: string | null
          exercises?: Json
          id?: string
          is_public?: boolean | null
          name?: string
          tags?: string[] | null
          target_muscle_groups?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          workout_type?: string[] | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          ai_response_id: string | null
          ai_suggestions_enabled: boolean | null
          approach_id: string | null
          assigned_by_coach_id: string | null
          audio_scripts: Json | null
          coach_locked: boolean | null
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
          ai_suggestions_enabled?: boolean | null
          approach_id?: string | null
          assigned_by_coach_id?: string | null
          audio_scripts?: Json | null
          coach_locked?: boolean | null
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
          ai_suggestions_enabled?: boolean | null
          approach_id?: string | null
          assigned_by_coach_id?: string | null
          audio_scripts?: Json | null
          coach_locked?: boolean | null
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
      calculate_booking_waitlist_priority: {
        Args: {
          p_entry_id: string
          p_slot_date: string
          p_slot_start_time: string
        }
        Returns: number
      }
      calculate_mesocycle_week: {
        Args: { check_date?: string; start_date: string }
        Returns: number
      }
      calculate_queue_position: { Args: { entry_id: string }; Returns: number }
      check_cancellation_status: {
        Args: { p_booking_id: string }
        Returns: {
          hours_until_booking: number
          is_late: boolean
          policy_hours: number
          will_charge_session: boolean
        }[]
      }
      check_email_already_sent: {
        Args: { p_event_type: string; p_hours_ago?: number; p_user_id: string }
        Returns: boolean
      }
      check_no_show_threshold: {
        Args: { p_client_id: string; p_coach_id: string }
        Returns: string
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
      create_gym_with_branding: {
        Args: {
          p_email?: string
          p_logo_url?: string
          p_name: string
          p_owner_id: string
          p_primary_color?: string
        }
        Returns: string
      }
      find_booking_waitlist_candidates: {
        Args: {
          p_coach_id: string
          p_date: string
          p_end_time: string
          p_start_time: string
        }
        Returns: {
          ai_priority_score: number
          client_id: string
          client_name: string
          days_waiting: number
          has_active_package: boolean
          id: string
          preferred_days: number[]
          preferred_time_end: string
          preferred_time_start: string
          urgency_level: number
        }[]
      }
      generate_coach_invite_code: {
        Args: { coach_name: string }
        Returns: string
      }
      generate_gym_invite_code: { Args: never; Returns: string }
      generate_gym_slug: { Args: { gym_name: string }; Returns: string }
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
      get_block_conflicts: {
        Args: {
          p_coach_id: string
          p_end_date: string
          p_end_time?: string
          p_start_date: string
          p_start_time?: string
        }
        Returns: {
          booking_id: string
          client_id: string
          client_name: string
          end_time: string
          scheduled_date: string
          start_time: string
          status: string
        }[]
      }
      get_client_no_show_stats: {
        Args: {
          p_client_id: string
          p_coach_id: string
          p_sessions_to_analyze?: number
        }
        Returns: {
          exceeds_threshold: boolean
          no_show_count: number
          no_show_rate: number
          session_count: number
        }[]
      }
      get_client_upcoming_bookings: {
        Args: { p_client_id: string; p_limit?: number }
        Returns: {
          coach_id: string
          coach_name: string
          days_until: number
          duration_minutes: number
          end_time: string
          id: string
          package_name: string
          scheduled_date: string
          start_time: string
          status: string
        }[]
      }
      get_coach_bookings: {
        Args: { p_coach_id: string; p_end_date: string; p_start_date: string }
        Returns: {
          client_id: string
          client_name: string
          coach_notes: string
          duration_minutes: number
          end_time: string
          id: string
          package_name: string
          scheduled_date: string
          start_time: string
          status: string
        }[]
      }
      get_gym_branding_by_slug: {
        Args: { p_slug: string }
        Returns: {
          accent_color: string
          app_name: string
          font_family: string
          gym_description: string
          gym_id: string
          gym_name: string
          logo_dark_url: string
          logo_url: string
          primary_color: string
          secondary_color: string
          splash_image_url: string
          tagline: Json
          welcome_message: Json
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
      get_pending_no_show_alerts: {
        Args: { p_coach_id: string }
        Returns: {
          alert_created_at: string
          alert_id: string
          client_id: string
          client_name: string
          no_show_count: number
          no_show_rate: number
          session_count: number
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
      get_user_gym_context: {
        Args: { p_user_id: string }
        Returns: {
          gym_id: string
          gym_name: string
          gym_slug: string
          is_member: boolean
          is_owner: boolean
          is_staff: boolean
        }[]
      }
      get_user_onboarding_stats: { Args: { p_user_id: string }; Returns: Json }
      get_users_auth_data: {
        Args: { user_ids: string[] }
        Returns: {
          last_sign_in_at: string
          user_id: string
        }[]
      }
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
      get_users_reaching_time_milestone: {
        Args: never
        Returns: {
          email: string
          first_name: string
          months_active: number
          preferred_language: string
          total_workouts: number
          user_id: string
        }[]
      }
      get_users_reaching_workout_milestone: {
        Args: never
        Returns: {
          email: string
          favorite_exercise: string
          first_name: string
          milestone_count: number
          preferred_language: string
          total_volume: number
          user_id: string
        }[]
      }
      get_users_with_plateau: {
        Args: never
        Returns: {
          current_e1rm: number
          email: string
          exercise_name: string
          first_name: string
          preferred_language: string
          user_id: string
          weeks_stuck: number
        }[]
      }
      get_users_with_prs_today: {
        Args: never
        Returns: {
          email: string
          first_name: string
          preferred_language: string
          prs: Json
          user_id: string
        }[]
      }
      get_waitlist_for_cancelled_slot: {
        Args: { p_booking_id: string }
        Returns: {
          client_id: string
          client_name: string
          has_active_package: boolean
          priority_score: number
          waitlist_id: string
        }[]
      }
      gym_can_add_member: { Args: { p_gym_id: string }; Returns: boolean }
      gym_can_add_staff: { Args: { p_gym_id: string }; Returns: boolean }
      increment_share_view_count: {
        Args: { token: string }
        Returns: undefined
      }
      increment_split_plan_template_usage: {
        Args: { template_uuid: string }
        Returns: undefined
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_coach_blocked: {
        Args: {
          p_coach_id: string
          p_date: string
          p_end_time?: string
          p_start_time?: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_gym_member: {
        Args: { p_gym_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_gym_owner: {
        Args: { p_gym_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_gym_staff: {
        Args: { p_gym_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_gym_staff_with_member_permission: {
        Args: { p_gym_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_member_of_owned_gym: {
        Args: { p_member_user_id: string; p_owner_user_id?: string }
        Returns: boolean
      }
      is_member_of_staff_gym: {
        Args: { p_member_user_id: string; p_staff_user_id?: string }
        Returns: boolean
      }
      is_slot_available: {
        Args: {
          p_coach_id: string
          p_date: string
          p_end_time: string
          p_location_type?: Database["public"]["Enums"]["session_location_type"]
          p_start_time: string
        }
        Returns: boolean
      }
      process_booking_cancellation: {
        Args: {
          p_booking_id: string
          p_cancelled_by?: string
          p_reason?: string
        }
        Returns: {
          booking_id: string
          hours_before: number
          session_charged: boolean
          was_late: boolean
        }[]
      }
      refresh_all_queue_positions: { Args: never; Returns: undefined }
      register_gym_member_by_code: {
        Args: { p_invite_code: string; p_user_id: string }
        Returns: string
      }
      register_gym_member_by_slug: {
        Args: { p_slug: string; p_user_id: string }
        Returns: string
      }
      update_insight_relevance_scores: { Args: never; Returns: undefined }
    }
    Enums: {
      credit_operation_type:
        | "workout_generation"
        | "split_generation"
        | "audio_script_generation"
        | "tts_synthesis"
        | "embedding_generation"
        | "exercise_substitution"
        | "approach_recommendation"
        | "insight_generation"
        | "memory_consolidation"
        | "technique_recommendation"
        | "weight_estimation"
        | "modification_validation"
        | "other"
      email_frequency: "immediate" | "daily_digest" | "weekly_digest" | "none"
      generation_status: "pending" | "in_progress" | "completed" | "failed"
      session_location_type: "in_person" | "online"
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
      credit_operation_type: [
        "workout_generation",
        "split_generation",
        "audio_script_generation",
        "tts_synthesis",
        "embedding_generation",
        "exercise_substitution",
        "approach_recommendation",
        "insight_generation",
        "memory_consolidation",
        "technique_recommendation",
        "weight_estimation",
        "modification_validation",
        "other",
      ],
      email_frequency: ["immediate", "daily_digest", "weekly_digest", "none"],
      generation_status: ["pending", "in_progress", "completed", "failed"],
      session_location_type: ["in_person", "online"],
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
        "rest",
      ],
      workout_variation: ["A", "B"],
    },
  },
} as const
