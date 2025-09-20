export interface Coach {
  id: string
  email: string
  full_name: string
  school_name: string
  team_code: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  team_code: string
  school_name: string
  coach_id: string
  season_record_wins: number
  season_record_losses: number
  created_at: string
  coach?: Coach
}

export interface Player {
  id: string
  team_id: string
  name: string
  grade?: number
  email?: string
  phone?: string
  position_preference?: string
  skill_level?: string
  created_at: string
  team?: Team
}

export interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  match_date: string
  match_time?: string
  location?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  home_score: number
  away_score: number
  notes?: string
  created_by: string
  created_at: string
  home_team?: Team
  away_team?: Team
  created_by_coach?: Coach
}

export interface Tournament {
  id: string
  name: string
  tournament_code: string
  creator_id: string
  tournament_type: 'single_elimination' | 'round_robin' | 'dual_match'
  max_teams: number
  status: 'open' | 'full' | 'in_progress' | 'completed'
  start_date?: string
  location?: string
  description?: string
  created_at: string
  creator?: Coach
  teams?: TournamentTeam[]
  matches?: TournamentMatch[]
}

export interface TournamentTeam {
  id: string
  tournament_id: string
  team_id: string
  seed_number?: number
  joined_at: string
  team?: Team
}

export interface TournamentMatch {
  id: string
  tournament_id: string
  round_number: number
  match_number: number
  team1_id: string
  team2_id: string
  winner_team_id?: string
  match_date?: string
  match_time?: string
  status: 'pending' | 'in_progress' | 'completed'
  score_summary?: string
  created_at: string
  team1?: Team
  team2?: Team
  winner_team?: Team
}

export interface MatchResult {
  id: string
  match_id: string
  position: string // '1S', '2S', '3S', '4S', '5S', '6S', '1D', '2D', '3D'
  home_player_names: string[]
  away_player_names: string[]
  home_sets_won: number
  away_sets_won: number
  score_details: Record<string, unknown> // JSONB for set scores
  winner: 'home' | 'away'
  created_at: string
}

export interface Lineup {
  id: string
  team_id: string
  match_id: string
  position: string
  player_ids: string[]
  created_at: string
  players?: Player[]
}

export interface ChallengeMatch {
  id: string
  team_id: string
  challenger_player_id: string
  challenged_player_id: string
  match_date: string
  winner_player_id?: string
  score?: string
  approved_by?: string
  created_at: string
  challenger_player?: Player
  challenged_player?: Player
  winner_player?: Player
  approved_by_coach?: Coach
}

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type TournamentStatus = 'open' | 'full' | 'in_progress' | 'completed'
export type TournamentType = 'single_elimination' | 'round_robin' | 'dual_match'
export type TournamentMatchStatus = 'pending' | 'in_progress' | 'completed'
