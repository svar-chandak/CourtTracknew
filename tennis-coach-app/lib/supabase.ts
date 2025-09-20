// Re-export client utilities
export { supabase, createClientComponentClient } from './supabase-client'

// Database types
export interface Database {
  public: {
    Tables: {
      coaches: {
        Row: {
          id: string
          email: string
          full_name: string
          school_name: string
          team_code: string
          phone?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          school_name: string
          team_code: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          school_name?: string
          team_code?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          team_code: string
          school_name: string
          coach_id: string
          season_record_wins: number
          season_record_losses: number
          created_at: string
        }
        Insert: {
          id?: string
          team_code: string
          school_name: string
          coach_id: string
          season_record_wins?: number
          season_record_losses?: number
          created_at?: string
        }
        Update: {
          id?: string
          team_code?: string
          school_name?: string
          coach_id?: string
          season_record_wins?: number
          season_record_losses?: number
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          team_id: string
          name: string
          grade?: number
          email?: string
          phone?: string
          position_preference?: string
          skill_level?: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          grade?: number
          email?: string
          phone?: string
          position_preference?: string
          skill_level?: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          grade?: number
          email?: string
          phone?: string
          position_preference?: string
          skill_level?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          home_team_id: string
          away_team_id: string
          match_date: string
          match_time?: string
          location?: string
          status: string
          home_score: number
          away_score: number
          notes?: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          home_team_id: string
          away_team_id: string
          match_date: string
          match_time?: string
          location?: string
          status?: string
          home_score?: number
          away_score?: number
          notes?: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          home_team_id?: string
          away_team_id?: string
          match_date?: string
          match_time?: string
          location?: string
          status?: string
          home_score?: number
          away_score?: number
          notes?: string
          created_by?: string
          created_at?: string
        }
      }
      tournaments: {
        Row: {
          id: string
          name: string
          tournament_code: string
          creator_id: string
          tournament_type: string
          max_teams: number
          status: string
          start_date?: string
          location?: string
          description?: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          tournament_code: string
          creator_id: string
          tournament_type: string
          max_teams?: number
          status?: string
          start_date?: string
          location?: string
          description?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          tournament_code?: string
          creator_id?: string
          tournament_type?: string
          max_teams?: number
          status?: string
          start_date?: string
          location?: string
          description?: string
          created_at?: string
        }
      }
    }
  }
}
