export interface TeamMatch {
  id: string
  created_at: string
  tournament_id?: string
  home_team_id: string
  away_team_id: string
  team_level: 'varsity' | 'jv' | 'freshman'
  match_date: string
  match_time?: string
  location?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  home_score: number
  away_score: number
  winner?: 'home' | 'away' | 'tie'
  notes?: string
  created_by?: string
  completed_at?: string
  
  // Relations
  home_team?: Team
  away_team?: Team
  individual_matches?: IndividualPositionMatch[]
}

export interface IndividualPositionMatch {
  id: string
  created_at: string
  team_match_id: string
  division: 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'
  position: number // 1st, 2nd, 3rd, etc.
  
  // Players
  home_player1_id?: string
  home_player2_id?: string // For doubles
  away_player1_id?: string
  away_player2_id?: string // For doubles
  
  // Match details
  winner?: 'home' | 'away'
  score?: string
  status: 'pending' | 'in_progress' | 'completed'
  court_number?: number
  scheduled_time?: string
  completed_at?: string
  
  // Relations
  home_player1?: Player
  home_player2?: Player
  away_player1?: Player
  away_player2?: Player
}

export interface TeamMatchResult {
  teamMatch: TeamMatch
  homeWins: number
  awayWins: number
  totalPositions: number
  winner: 'home' | 'away' | 'tie'
}

export interface TeamMatchSummary {
  totalMatches: number
  upcomingMatches: number
  completedMatches: number
  winRate: number
  teamLevelStats: {
    varsity: { wins: number; losses: number; total: number }
    jv: { wins: number; losses: number; total: number }
    freshman: { wins: number; losses: number; total: number }
  }
}

export interface CreateTeamMatchData {
  home_team_id: string
  tournament_id?: string
  away_team_id: string
  team_level: 'varsity' | 'jv' | 'freshman'
  match_date: string
  match_time?: string
  location?: string
  notes?: string
}

export interface CreateTeamMatchFormData {
  away_team_code: string
  team_level: 'varsity' | 'jv' | 'freshman'
  match_date: string
  match_time?: string
  location?: string
  notes?: string
}

export interface UpdateTeamMatchData {
  match_date?: string
  match_time?: string
  location?: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

export interface UpdateIndividualMatchData {
  home_player1_id?: string
  home_player2_id?: string
  away_player1_id?: string
  away_player2_id?: string
  winner?: 'home' | 'away'
  score?: string
  status?: 'pending' | 'in_progress' | 'completed'
  court_number?: number
  scheduled_time?: string
}

// Re-export existing types that we need
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
}

export interface Player {
  id: string
  team_id: string
  name: string
  email?: string
  grade?: number
  phone?: string
  position_preference?: string
  skill_level?: string
  gender?: 'male' | 'female'
  team_level?: 'varsity' | 'jv' | 'freshman'
  utr_rating?: number
  created_at: string
}
