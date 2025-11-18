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
      user_profiles: {
        Row: {
          email_frequency: Database["public"]["Enums"]["email_frequency"] | null
          email_notifications_enabled: boolean | null
          email_unsubscribed_at: string | null
          last_email_sent_at: string | null
          [key: string]: any
        }
        Insert: {
          email_frequency?: Database["public"]["Enums"]["email_frequency"] | null
          email_notifications_enabled?: boolean | null
          email_unsubscribed_at?: string | null
          last_email_sent_at?: string | null
          [key: string]: any
        }
        Update: {
          email_frequency?: Database["public"]["Enums"]["email_frequency"] | null
          email_notifications_enabled?: boolean | null
          email_unsubscribed_at?: string | null
          last_email_sent_at?: string | null
          [key: string]: any
        }
        Relationships: []
      }
      [key: string]: any
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_already_sent: {
        Args: { p_event_type: string; p_hours_ago?: number; p_user_id: string }
        Returns: boolean
      }
      get_user_onboarding_stats: { Args: { p_user_id: string }; Returns: Json }
      [key: string]: any
    }
    Enums: {
      email_frequency: "immediate" | "daily_digest" | "weekly_digest" | "none"
      [key: string]: any
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
