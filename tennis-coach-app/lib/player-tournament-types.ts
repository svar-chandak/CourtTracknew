// Player-Based Tournament Types

export interface TournamentPlayer {
  id: string
  tournament_id: string
  player_id: string
  coach_id: string
  school_name: string
  utr_rating: number
  joined_at: string
  // Relations
  player?: Player
  coach?: Coach
}

export interface SchoolGroup {
  school_name: string
  players: TournamentPlayer[]
  average_utr: number
  total_players: number
}

export interface BracketSlot {
  id: string
  tournament_id: string
  round_number: number
  slot_number: number
  pool_side: 'A' | 'B'
  player_id?: string
  school_name?: string
  utr_rating?: number
  is_locked: boolean
  created_at: string
  // Relations
  player?: Player
}

export interface BracketMatch {
  id: string
  tournament_id: string
  round_number: number
  match_number: number
  pool_side?: 'A' | 'B'
  slot_id_1?: string
  slot_id_2?: string
  player1_id?: string
  player2_id?: string
  player1_school?: string
  player2_school?: string
  winner_player_id?: string
  score_summary?: string
  status: 'pending' | 'in_progress' | 'completed' | 'bye'
  created_at: string
  // Relations
  player1?: Player
  player2?: Player
  winner?: Player
}

export interface TournamentSettings {
  id: string
  tournament_id: string
  is_bracket_locked: boolean
  bracket_locked_at?: string
  bracket_locked_by?: string
  auto_balance_utr: boolean
  avoid_same_school_first_round: boolean
  created_at: string
}

export interface TwoSidedBracket {
  tournament_id: string
  pool_a: {
    rounds: BracketRound[]
  }
  pool_b: {
    rounds: BracketRound[]
  }
  is_locked: boolean
  total_players: number
}

export interface BracketRound {
  round_number: number
  slots: BracketSlot[]
  matches: BracketMatch[]
}

// Re-export base types
export interface Player {
  id: string
  team_id: string
  player_id: string
  name: string
  email?: string
  grade?: number
  gender: 'male' | 'female'
  utr_rating?: number
  school_name?: string // May need to be derived from team
  created_at: string
}

export interface Coach {
  id: string
  email: string
  full_name: string
  school_name: string
  team_code: string
  created_at: string
}

export interface CreateTournamentPlayerData {
  tournament_id: string
  player_id: string
  coach_id: string
  school_name: string
  utr_rating: number
}

export interface UpdateBracketSlotData {
  player_id?: string
  school_name?: string
  utr_rating?: number
  is_locked?: boolean
}

export interface ValidationWarning {
  type: 'same_school_round1' | 'same_school_clustering' | 'utr_imbalance' | 'invalid_pool_shift'
  message: string
  slot_ids?: string[]
  severity: 'error' | 'warning'
}

