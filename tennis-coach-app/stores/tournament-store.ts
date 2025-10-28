import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { TournamentEngine } from '@/lib/tournament-engine'
import type { Tournament, TournamentTeam, TournamentMatch } from '@/lib/types'
import type { BracketMatch, TournamentBracket } from '@/lib/tournament-engine'

interface TournamentState {
  tournaments: Tournament[]
  currentTournament: Tournament | null
  tournamentTeams: TournamentTeam[]
  tournamentMatches: TournamentMatch[]
  bracket: TournamentBracket | null
  loading: boolean
  error: string | null
  
  // Tournament actions
  getTournaments: () => Promise<void>
  getTournament: (tournamentCode: string) => Promise<{ tournament: Tournament | null; error: string | null }>
  getTournamentTeams: (tournamentId: string) => Promise<void>
  createTournament: (tournament: Omit<Tournament, 'id' | 'created_at' | 'tournament_code'>) => Promise<{ error: string | null }>
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<{ error: string | null }>
  joinTournament: (tournamentCode: string, teamId: string) => Promise<{ error: string | null }>
  leaveTournament: (tournamentId: string, teamId: string) => Promise<{ error: string | null }>
  updateTournamentStatus: (tournamentId: string, status: Tournament['status']) => Promise<{ error: string | null }>
  
  // Tournament matches and bracket
  getTournamentMatches: (tournamentId: string) => Promise<void>
  updateTournamentMatch: (matchId: string, updates: Partial<TournamentMatch>) => Promise<{ error: string | null }>
  updateBracketMatch: (matchId: string, updates: Partial<BracketMatch>) => Promise<{ error: string | null }>
  generateBracket: (tournamentId: string) => Promise<{ error: string | null }>
  startTournament: (tournamentId: string) => Promise<{ error: string | null }>
  endTournament: (tournamentId: string) => Promise<{ error: string | null }>
  resetTournament: (tournamentId: string) => Promise<{ error: string | null }>
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments: [],
  currentTournament: null,
  tournamentTeams: [],
  tournamentMatches: [],
  bracket: null,
  loading: true,
  error: null,

  getTournaments: async () => {
    try {
      set({ loading: true })
      
      // Get current coach ID from auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ tournaments: [], loading: false })
        return
      }

      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          creator:coaches(*),
          teams:tournament_teams(
            *,
            team:teams(*)
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tournaments:', error)
        set({ tournaments: [], loading: false })
        return
      }

      set({ tournaments: tournaments || [], loading: false })
    } catch (error) {
      console.error('Error in getTournaments:', error)
      set({ tournaments: [], loading: false })
    }
  },

  getTournament: async (tournamentCode: string) => {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          creator:coaches(*),
          teams:tournament_teams(
            *,
            team:teams(*)
          ),
          matches:tournament_matches(
            *,
            team1:teams(*),
            team2:teams(*),
            winner_team:teams(*)
          )
        `)
        .eq('tournament_code', tournamentCode)
        .single()

      if (error) {
        return { tournament: null, error: error.message }
      }

      set({ currentTournament: tournament })
      return { tournament, error: null }
    } catch (error) {
      return { tournament: null, error: 'An unexpected error occurred' }
    }
  },

  createTournament: async (tournament: Omit<Tournament, 'id' | 'created_at' | 'tournament_code'>) => {
    try {
      // Generate unique 8-character tournament code
      const tournamentCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      const { error } = await supabase
        .from('tournaments')
        .insert({
          ...tournament,
          tournament_code: tournamentCode,
        })

      if (error) return { error: error.message }

      // Refresh tournaments list
      await get().getTournaments()
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  joinTournament: async (tournamentCode: string, teamId: string) => {
    try {
      // First get the tournament
      const { tournament, error: tournamentError } = await get().getTournament(tournamentCode)
      if (tournamentError || !tournament) {
        return { error: tournamentError || 'Tournament not found' }
      }

      // Check if tournament is open and not full
      if (tournament.status !== 'open') {
        return { error: 'Tournament is not accepting new teams' }
      }

      const currentTeamCount = tournament.teams?.length || 0
      if (currentTeamCount >= tournament.max_teams) {
        return { error: 'Tournament is full' }
      }

      // Check if team is already in tournament
      const isAlreadyJoined = tournament.teams?.some(t => t.team_id === teamId)
      if (isAlreadyJoined) {
        return { error: 'Team is already in this tournament' }
      }

      // Join tournament
      const { error } = await supabase
        .from('tournament_teams')
        .insert({
          tournament_id: tournament.id,
          team_id: teamId,
        })

      if (error) return { error: error.message }

      // Update tournament status if full
      if (currentTeamCount + 1 >= tournament.max_teams) {
        await get().updateTournamentStatus(tournament.id, 'full')
      }

      // Refresh tournament data
      await get().getTournament(tournamentCode)
      await get().getTournaments()
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  leaveTournament: async (tournamentId: string, teamId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_teams')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId)

      if (error) return { error: error.message }

      // Update tournament status back to open
      await get().updateTournamentStatus(tournamentId, 'open')
      
      // Refresh data
      await get().getTournaments()
      const currentTournament = get().currentTournament
      if (currentTournament?.id === tournamentId) {
        await get().getTournament(currentTournament.tournament_code)
      }
      
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  updateTournamentStatus: async (tournamentId: string, status: Tournament['status']) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status })
        .eq('id', tournamentId)

      if (error) return { error: error.message }

      // Update local state
      const { tournaments } = get()
      const updatedTournaments = tournaments.map(tournament =>
        tournament.id === tournamentId ? { ...tournament, status } : tournament
      )
      set({ tournaments: updatedTournaments })

      if (get().currentTournament?.id === tournamentId) {
        set({ currentTournament: { ...get().currentTournament!, status } })
      }

      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  getTournamentMatches: async (tournamentId: string) => {
    try {
      set({ loading: true })
      
      const { data: matches, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          team1:teams(*),
          team2:teams(*),
          winner_team:teams(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true })

      if (error) {
        console.error('Error fetching tournament matches:', error)
        set({ tournamentMatches: [], loading: false })
        return
      }

      set({ tournamentMatches: matches || [], loading: false })
    } catch (error) {
      console.error('Error in getTournamentMatches:', error)
      set({ tournamentMatches: [], loading: false })
    }
  },

  updateTournamentMatch: async (matchId: string, updates: Partial<TournamentMatch>) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update(updates)
        .eq('id', matchId)

      if (error) return { error: error.message }

      // Update local state
      const { tournamentMatches } = get()
      const updatedMatches = tournamentMatches.map(match =>
        match.id === matchId ? { ...match, ...updates } : match
      )
      set({ tournamentMatches: updatedMatches })
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  getTournamentTeams: async (tournamentId: string) => {
    try {
      const { data: teams, error } = await supabase
        .from('tournament_teams')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('joined_at', { ascending: true })

      if (error) {
        set({ error: error.message })
        return
      }

      set({ tournamentTeams: teams || [] })
    } catch (error) {
      set({ error: 'Failed to fetch tournament teams' })
    }
  },

  updateTournament: async (id: string, updates: Partial<Tournament>) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id)

      if (error) return { error: error.message }

      // Update local state
      const { tournaments, currentTournament } = get()
      const updatedTournaments = tournaments.map(tournament =>
        tournament.id === id ? { ...tournament, ...updates } : tournament
      )
      set({ tournaments: updatedTournaments })

      if (currentTournament?.id === id) {
        set({ currentTournament: { ...currentTournament, ...updates } })
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to update tournament' }
    }
  },

  updateBracketMatch: async (matchId: string, updates: Partial<BracketMatch>) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          ...updates,
          winner_team_id: updates.winner?.team_id,
          score_summary: updates.score,
          status: updates.status || 'pending'
        })
        .eq('id', matchId)

      if (error) return { error: error.message }

      // Update local bracket state
      const { bracket } = get()
      if (bracket) {
        const updatedMatches = bracket.matches.map(match =>
          match.id === matchId ? { ...match, ...updates } : match
        )
        
        // Use tournament engine to update bracket
        const updatedBracket = TournamentEngine.getBracketSummary(updatedMatches)
        set({ bracket: updatedBracket })
      }

      // Refresh tournament matches
      const currentTournament = get().currentTournament
      if (currentTournament) {
        await get().getTournamentMatches(currentTournament.id)
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to update match' }
    }
  },

  startTournament: async (tournamentId: string) => {
    try {
      const { error } = await get().updateTournamentStatus(tournamentId, 'in_progress')
      if (error) return { error }
      
      return { error: null }
    } catch (error) {
      return { error: 'Failed to start tournament' }
    }
  },

  endTournament: async (tournamentId: string) => {
    try {
      const { error } = await get().updateTournamentStatus(tournamentId, 'completed')
      if (error) return { error }
      
      return { error: null }
    } catch (error) {
      return { error: 'Failed to end tournament' }
    }
  },

  resetTournament: async (tournamentId: string) => {
    try {
      // Clear all matches
      await supabase
        .from('tournament_matches')
        .delete()
        .eq('tournament_id', tournamentId)

      // Reset tournament status
      const { error } = await get().updateTournamentStatus(tournamentId, 'open')
      if (error) return { error }

      // Clear local bracket
      set({ bracket: null })

      return { error: null }
    } catch (error) {
      return { error: 'Failed to reset tournament' }
    }
  },

  generateBracket: async (tournamentId: string) => {
    try {
      const tournament = get().currentTournament
      if (!tournament || !tournament.teams) {
        return { error: 'Tournament not found or no teams joined' }
      }

      const teams = tournament.teams
      const teamCount = teams.length

      if (teamCount < 2) {
        return { error: 'Need at least 2 teams to generate bracket' }
      }

      // Clear existing matches
      await supabase
        .from('tournament_matches')
        .delete()
        .eq('tournament_id', tournamentId)

      // Use tournament engine to generate bracket
      const bracketMatches = TournamentEngine.generateBracket(tournament, teams)
      
      // Save matches to database
      for (const match of bracketMatches) {
        await supabase
          .from('tournament_matches')
          .insert({
            tournament_id: tournamentId,
            round_number: match.round,
            match_number: match.matchNumber,
            team1_id: match.team1?.team_id,
            team2_id: match.team2?.team_id,
            status: match.status,
            score_summary: match.score,
            winner_team_id: match.winner?.team_id
          })
      }

      // Create bracket summary
      const bracket = TournamentEngine.getBracketSummary(bracketMatches)
      set({ bracket })

      // Refresh matches
      await get().getTournamentMatches(tournamentId)
      
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },
}))

// Helper function to generate single elimination bracket
async function generateSingleEliminationBracket(tournamentId: string, teams: TournamentTeam[]) {
  const teamCount = teams.length
  const rounds = Math.ceil(Math.log2(teamCount))
  
  // Shuffle teams for random seeding
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
  
  let matchNumber = 1
  let currentRoundTeams = shuffledTeams
  
  for (let round = 1; round <= rounds; round++) {
    const nextRoundTeams: TournamentTeam[] = []
    
    for (let i = 0; i < currentRoundTeams.length; i += 2) {
      const team1 = currentRoundTeams[i]
      const team2 = currentRoundTeams[i + 1]
      
      if (team2) {
        // Regular match
        await supabase
          .from('tournament_matches')
          .insert({
            tournament_id: tournamentId,
            round_number: round,
            match_number: matchNumber,
            team1_id: team1.team_id,
            team2_id: team2.team_id,
            status: 'pending',
          })
        matchNumber++
      } else {
        // Bye - team advances automatically
        nextRoundTeams.push(team1)
      }
    }
    
    currentRoundTeams = nextRoundTeams
  }
}

// Helper function to generate round robin bracket
async function generateRoundRobinBracket(tournamentId: string, teams: TournamentTeam[]) {
  const teamCount = teams.length
  let matchNumber = 1
  
  // Generate all possible matchups
  for (let i = 0; i < teamCount; i++) {
    for (let j = i + 1; j < teamCount; j++) {
      await supabase
        .from('tournament_matches')
        .insert({
          tournament_id: tournamentId,
          round_number: 1,
          match_number: matchNumber,
          team1_id: teams[i].team_id,
          team2_id: teams[j].team_id,
          status: 'pending',
        })
      matchNumber++
    }
  }
}
