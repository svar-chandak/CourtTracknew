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
  team_level: 'varsity' | 'jv' | 'freshman'
  gender: 'boys' | 'girls' | 'mixed'
  season_record_wins: number
  season_record_losses: number
  created_at: string
  coach?: Coach
}

export interface Player {
  id: string
  team_id: string
  player_id: string // Student login ID
  name: string
  email?: string // Student login email
  password_hash?: string // Student login password
  gender: 'male' | 'female'
  grade?: number
  position_preference?: 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'
  team_level?: 'varsity' | 'jv' | 'freshman'
  utr_rating?: number
  phone?: string
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
  match_type: 'team_match' | 'individual'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  home_score: number
  away_score: number
  notes?: string
  created_by: string
  created_at: string
  home_team?: Team
  away_team?: Team
  created_by_coach?: Coach
  divisions?: TeamMatchDivision[]
}

export interface Tournament {
  id: string
  name: string
  tournament_code: string
  creator_id: string
  tournament_type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss' | 'dual_match'
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
  division: 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'
  position_number: number // 1st, 2nd, 3rd singles/doubles
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
  division: 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'
  position_number: number
  player_ids: string[]
  created_at: string
  players?: Player[]
}

export interface TeamMatchDivision {
  id: string
  match_id: string
  division: 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'
  position_number: number // 1st, 2nd, 3rd, etc.
  home_player_ids: string[]
  away_player_ids: string[]
  home_sets_won: number
  away_sets_won: number
  winner?: 'home' | 'away'
  score_details?: Record<string, unknown> // JSONB for set scores
  completed: boolean
  created_at: string
  home_players?: Player[]
  away_players?: Player[]
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

export interface Announcement {
  id: string
  team_id: string
  coach_id: string
  title: string
  message: string
  announcement_type: 'general' | 'match_reminder' | 'practice_change' | 'emergency'
  is_urgent: boolean
  sent_at: string
  created_at: string
  coach?: Coach
  team?: Team
}

export interface Attendance {
  id: string
  team_id: string
  player_id: string
  event_type: 'practice' | 'match'
  event_id?: string
  event_date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  recorded_by: string
  created_at: string
  player?: Player
  team?: Team
  recorded_by_coach?: Coach
}

export interface PracticeSession {
  id: string
  team_id: string
  practice_date: string
  practice_time?: string
  location?: string
  description?: string
  coach_id: string
  created_at: string
  team?: Team
  coach?: Coach
}

export interface NotificationPreferences {
  id: string
  player_id: string
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  created_at: string
  updated_at: string
  player?: Player
}

// Student authentication types
export interface StudentAuth {
  player: Player | null
  loading: boolean
  signIn: (playerId: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  getCurrentPlayer: () => Promise<void>
}

// Match history for students
export interface PlayerMatchHistory {
  match: Match
  division: string
  position_number: number
  player_names: string[]
  opponent_names: string[]
  sets_won: number
  sets_lost: number
  winner: 'home' | 'away'
  score_details: Record<string, unknown>
  is_winner: boolean
}

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type TournamentStatus = 'open' | 'full' | 'in_progress' | 'completed'
export type TournamentType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss' | 'dual_match'
export type TournamentMatchStatus = 'pending' | 'in_progress' | 'completed'
export type TeamLevel = 'varsity' | 'jv' | 'freshman'
export type Gender = 'male' | 'female'
export type TeamGender = 'boys' | 'girls' | 'mixed'
export type Division = 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'
export type MatchType = 'team_match' | 'individual'
export type AnnouncementType = 'general' | 'match_reminder' | 'practice_change' | 'emergency'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type EventType = 'practice' | 'match'
