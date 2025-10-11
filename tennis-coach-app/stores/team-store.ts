import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Team, Player, Match } from '@/lib/types'

interface TeamState {
  currentTeam: Team | null
  players: Player[]
  matches: Match[]
  loading: boolean
  
  // Team actions
  getCurrentTeam: (coachId: string) => Promise<void>
  updateTeamRecord: (teamId: string, wins: number, losses: number) => Promise<void>
  searchTeamsByCode: (teamCode: string) => Promise<{ teams: Team[], error: string | null }>
  getAllTeams: () => Promise<{ teams: Team[], error: string | null }>
  
  // Player actions
  getPlayers: (teamId: string) => Promise<void>
  addPlayer: (player: Omit<Player, 'id' | 'created_at' | 'player_id'>) => Promise<{ error: string | null }>
  updatePlayer: (playerId: string, updates: Partial<Player>) => Promise<{ error: string | null }>
  deletePlayer: (playerId: string) => Promise<{ error: string | null }>
  
  // Match actions
  getMatches: (teamId: string) => Promise<void>
  createMatch: (match: Omit<Match, 'id' | 'created_at'>) => Promise<{ error: string | null }>
  updateMatchScore: (matchId: string, homeScore: number, awayScore: number) => Promise<{ error: string | null }>
  updateMatchStatus: (matchId: string, status: Match['status']) => Promise<{ error: string | null }>
}

export const useTeamStore = create<TeamState>((set, get) => ({
  currentTeam: null,
  players: [],
  matches: [],
  loading: true,

  getCurrentTeam: async (coachId: string) => {
    try {
      set({ loading: true })
      
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          *,
          coach:coaches(*)
        `)
        .eq('coach_id', coachId)

      if (error) {
        console.error('Error fetching team:', error)
        set({ currentTeam: null, loading: false })
        return
      }

      // Handle case where no team exists or multiple teams exist
      const team = teams && teams.length > 0 ? teams[0] : null
      set({ currentTeam: team, loading: false })
    } catch (error) {
      console.error('Error in getCurrentTeam:', error)
      set({ currentTeam: null, loading: false })
    }
  },

  updateTeamRecord: async (teamId: string, wins: number, losses: number) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          season_record_wins: wins,
          season_record_losses: losses,
        })
        .eq('id', teamId)

      if (error) {
        console.error('Error updating team record:', error)
        return
      }

      // Update local state
      const { currentTeam } = get()
      if (currentTeam && currentTeam.id === teamId) {
        set({
          currentTeam: {
            ...currentTeam,
            season_record_wins: wins,
            season_record_losses: losses,
          }
        })
      }
    } catch (error) {
      console.error('Error in updateTeamRecord:', error)
    }
  },

  searchTeamsByCode: async (teamCode: string) => {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          *,
          coach:coaches(*)
        `)
        .ilike('team_code', `%${teamCode}%`)

      if (error) {
        console.error('Error searching teams:', error)
        return { teams: [], error: error.message }
      }

      return { teams: teams || [], error: null }
    } catch (error) {
      console.error('Error searching teams:', error)
      return { teams: [], error: 'An unexpected error occurred' }
    }
  },

  getAllTeams: async () => {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          *,
          coach:coaches(*)
        `)
        .order('school_name')

      if (error) {
        console.error('Error fetching all teams:', error)
        return { teams: [], error: error.message }
      }

      return { teams: teams || [], error: null }
    } catch (error) {
      console.error('Error fetching all teams:', error)
      return { teams: [], error: 'An unexpected error occurred' }
    }
  },

  getPlayers: async (teamId: string) => {
    try {
      console.log('=== GET PLAYERS ===')
      console.log('Team ID:', teamId)
      set({ loading: true })
      
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('name')

      console.log('Players query result:', { players, error })
      console.log('Raw players data:', JSON.stringify(players, null, 2))
      console.log('Players type:', typeof players)
      console.log('Players is array:', Array.isArray(players))

      if (error) {
        console.error('Error fetching players:', error)
        set({ players: [], loading: false })
        return
      }

      console.log('Setting players:', players)
      set({ players: players || [], loading: false })
      console.log('=== END GET PLAYERS ===')
    } catch (error) {
      console.error('Error in getPlayers:', error)
      set({ players: [], loading: false })
    }
  },

  addPlayer: async (player: Omit<Player, 'id' | 'created_at' | 'player_id'>) => {
    try {
      // Generate a unique player ID
      const generatePlayerId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase()
      }

      let playerId = generatePlayerId()
      let attempts = 0
      const maxAttempts = 10

      // Ensure unique player ID
      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from('players')
          .select('id')
          .eq('player_id', playerId)
          .single()

        if (!existing) break
        
        playerId = generatePlayerId()
        attempts++
      }

      if (attempts >= maxAttempts) {
        return { error: 'Failed to generate unique player ID' }
      }

      // Prepare player data with generated player_id
      const playerData = {
        ...player,
        player_id: playerId,
        // Remove fields that might not exist in the database yet
        password_hash: undefined,
      }

      console.log('Attempting to insert player:', playerData)

      const { error } = await supabase
        .from('players')
        .insert(playerData)

      if (error) {
        console.error('Database error:', error)
        return { error: error.message }
      }

      // Refresh players list
      await get().getPlayers(player.team_id)
      return { error: null }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { error: 'An unexpected error occurred' }
    }
  },

  updatePlayer: async (playerId: string, updates: Partial<Player>) => {
    try {
      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId)

      if (error) return { error: error.message }

      // Update local state
      const { players } = get()
      const updatedPlayers = players.map(player =>
        player.id === playerId ? { ...player, ...updates } : player
      )
      set({ players: updatedPlayers })
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  deletePlayer: async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) return { error: error.message }

      // Update local state
      const { players } = get()
      const filteredPlayers = players.filter(player => player.id !== playerId)
      set({ players: filteredPlayers })
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  getMatches: async (teamId: string) => {
    try {
      set({ loading: true })
      
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          created_by_coach:coaches!matches_created_by_fkey(*)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('match_date', { ascending: false })

      if (error) {
        console.error('Error fetching matches:', error)
        set({ matches: [], loading: false })
        return
      }

      set({ matches: matches || [], loading: false })
    } catch (error) {
      console.error('Error in getMatches:', error)
      set({ matches: [], loading: false })
    }
  },

  createMatch: async (match: Omit<Match, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('matches')
        .insert(match)

      if (error) return { error: error.message }

      // Refresh matches list
      await get().getMatches(match.home_team_id)
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  updateMatchScore: async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: 'completed',
        })
        .eq('id', matchId)

      if (error) return { error: error.message }

      // Update local state
      const { matches } = get()
      const updatedMatches = matches.map(match =>
        match.id === matchId 
          ? { ...match, home_score: homeScore, away_score: awayScore, status: 'completed' as const }
          : match
      )
      set({ matches: updatedMatches })
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  updateMatchStatus: async (matchId: string, status: Match['status']) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status })
        .eq('id', matchId)

      if (error) return { error: error.message }

      // Update local state
      const { matches } = get()
      const updatedMatches = matches.map(match =>
        match.id === matchId ? { ...match, status } : match
      )
      set({ matches: updatedMatches })
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },
}))
