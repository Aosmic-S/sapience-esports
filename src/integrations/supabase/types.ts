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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          priority: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          priority?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          priority?: string
          title?: string
        }
        Relationships: []
      }
      banner_settings: {
        Row: {
          color: string | null
          id: number
          is_active: boolean | null
          is_blinking: boolean | null
          text: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          id?: number
          is_active?: boolean | null
          is_blinking?: boolean | null
          text?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          id?: number
          is_active?: boolean | null
          is_blinking?: boolean | null
          text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bracket_matches: {
        Row: {
          bracket_id: string
          id: string
          position: number
          round: number
          score_a: number | null
          score_b: number | null
          team_a: string | null
          team_b: string | null
          winner: string | null
        }
        Insert: {
          bracket_id: string
          id?: string
          position: number
          round: number
          score_a?: number | null
          score_b?: number | null
          team_a?: string | null
          team_b?: string | null
          winner?: string | null
        }
        Update: {
          bracket_id?: string
          id?: string
          position?: number
          round?: number
          score_a?: number | null
          score_b?: number | null
          team_a?: string | null
          team_b?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bracket_matches_bracket_id_fkey"
            columns: ["bracket_id"]
            isOneToOne: false
            referencedRelation: "brackets"
            referencedColumns: ["id"]
          },
        ]
      }
      brackets: {
        Row: {
          created_at: string
          game: string
          id: string
          name: string
          size: number
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          name: string
          size?: number
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          name?: string
          size?: number
        }
        Relationships: []
      }
      games: {
        Row: {
          bracket_size: number
          color: string | null
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          bracket_size?: number
          color?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          bracket_size?: number
          color?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          draws: number
          game: string
          id: string
          last_updated: string
          losses: number
          matches_played: number
          points: number
          rank_position: number
          team_number: string
          wins: number
        }
        Insert: {
          draws?: number
          game: string
          id?: string
          last_updated?: string
          losses?: number
          matches_played?: number
          points?: number
          rank_position?: number
          team_number: string
          wins?: number
        }
        Update: {
          draws?: number
          game?: string
          id?: string
          last_updated?: string
          losses?: number
          matches_played?: number
          points?: number
          rank_position?: number
          team_number?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_team_number_fkey"
            columns: ["team_number"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["team_number"]
          },
        ]
      }
      match_days: {
        Row: {
          created_at: string
          date: string
          description: string | null
          game: string
          id: string
          time: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          game: string
          id?: string
          time: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          game?: string
          id?: string
          time?: string
        }
        Relationships: []
      }
      match_results: {
        Row: {
          created_at: string
          game: string
          id: string
          match_date: string
          notes: string | null
          points_earned: number
          result: string
          team_number: string
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          match_date: string
          notes?: string | null
          points_earned?: number
          result?: string
          team_number: string
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          match_date?: string
          notes?: string | null
          points_earned?: number
          result?: string
          team_number?: string
        }
        Relationships: []
      }
      payment_submissions: {
        Row: {
          amount: number
          id: string
          payer_name: string
          player_entry_id: string
          proof_path: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          transaction_reference: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          payer_name?: string
          player_entry_id: string
          proof_path: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          transaction_reference: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          payer_name?: string
          player_entry_id?: string
          proof_path?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          transaction_reference?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_submissions_player_entry_id_fkey"
            columns: ["player_entry_id"]
            isOneToOne: true
            referencedRelation: "player_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      player_entries: {
        Row: {
          created_at: string
          game: string
          id: string
          team_number: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          team_number: string
          user_id: string
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          team_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_entries_team_number_fkey"
            columns: ["team_number"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["team_number"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          admission_no: string | null
          class_section: string | null
          created_at: string
          dq_reason: string | null
          entry_type: string
          full_name: string
          game: string | null
          id: string
          in_game_id: string | null
          members: string[] | null
          password_hash: string
          phone_number: string | null
          player_level: number | null
          player_rank: string | null
          status: string | null
          team_name: string | null
          team_number: string
          team_ovr: number | null
          team_uid: string | null
          uid: string | null
        }
        Insert: {
          admission_no?: string | null
          class_section?: string | null
          created_at?: string
          dq_reason?: string | null
          entry_type?: string
          full_name: string
          game?: string | null
          id?: string
          in_game_id?: string | null
          members?: string[] | null
          password_hash: string
          phone_number?: string | null
          player_level?: number | null
          player_rank?: string | null
          status?: string | null
          team_name?: string | null
          team_number: string
          team_ovr?: number | null
          team_uid?: string | null
          uid?: string | null
        }
        Update: {
          admission_no?: string | null
          class_section?: string | null
          created_at?: string
          dq_reason?: string | null
          entry_type?: string
          full_name?: string
          game?: string | null
          id?: string
          in_game_id?: string | null
          members?: string[] | null
          password_hash?: string
          phone_number?: string | null
          player_level?: number | null
          player_rank?: string | null
          status?: string | null
          team_name?: string | null
          team_number?: string
          team_ovr?: number | null
          team_uid?: string | null
          uid?: string | null
        }
        Relationships: []
      }
      rules_content: {
        Row: {
          bgmi: string | null
          codm: string | null
          conduct: string | null
          created_at: string
          fcmobile: string | null
          freefire: string | null
          general: string | null
          id: number
          tournament: string | null
          updated_at: string
        }
        Insert: {
          bgmi?: string | null
          codm?: string | null
          conduct?: string | null
          created_at?: string
          fcmobile?: string | null
          freefire?: string | null
          general?: string | null
          id?: number
          tournament?: string | null
          updated_at?: string
        }
        Update: {
          bgmi?: string | null
          codm?: string | null
          conduct?: string | null
          created_at?: string
          fcmobile?: string | null
          freefire?: string | null
          general?: string | null
          id?: number
          tournament?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          auto_approval: boolean
          email_notifications: boolean
          id: number
          max_participants: number
          registration_open: boolean
          trailer_video_url: string | null
          updated_at: string
        }
        Insert: {
          auto_approval?: boolean
          email_notifications?: boolean
          id?: number
          max_participants?: number
          registration_open?: boolean
          trailer_video_url?: string | null
          updated_at?: string
        }
        Update: {
          auto_approval?: boolean
          email_notifications?: boolean
          id?: number
          max_participants?: number
          registration_open?: boolean
          trailer_video_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          admission_no: string
          class_section: string
          created_at: string
          full_name: string
          id: string
          in_game_id: string
          phone_number: string
          player_level: number | null
          player_rank: string | null
          role: string
          slot: number
          team_number: string
          uid: string
        }
        Insert: {
          admission_no: string
          class_section: string
          created_at?: string
          full_name: string
          id?: string
          in_game_id: string
          phone_number: string
          player_level?: number | null
          player_rank?: string | null
          role?: string
          slot: number
          team_number: string
          uid: string
        }
        Update: {
          admission_no?: string
          class_section?: string
          created_at?: string
          full_name?: string
          id?: string
          in_game_id?: string
          phone_number?: string
          player_level?: number | null
          player_rank?: string | null
          role?: string
          slot?: number
          team_number?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_number_fkey"
            columns: ["team_number"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["team_number"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_player_entry: {
        Args: { code: string; entry_password: string }
        Returns: undefined
      }
      generate_team_number: { Args: never; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      register_player_entry: { Args: { payload: Json }; Returns: string }
      register_tournament_entry: { Args: { payload: Json }; Returns: string }
      review_payment_proof: {
        Args: { decision: string; note?: string; submission_id: string }
        Returns: undefined
      }
      squad_roster: {
        Args: { code: string }
        Returns: {
          in_game_id: string
          player_rank: string
          role: string
          slot: number
        }[]
      }
      submit_payment_proof: {
        Args: { entry_id: string; object_path: string; reference: string }
        Returns: undefined
      }
      update_leaderboard_rankings: { Args: never; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
