import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Player, PlayerMatchHistory } from '@/lib/types'

interface StudentAuthState {
  player: Player | null
  loading: boolean
  signIn: (playerId: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  getCurrentPlayer: () => Promise<void>
  getPlayerMatchHistory: (playerId: string) => Promise<{ history: PlayerMatchHistory[], error: string | null }>
}

export const useStudentAuthStore = create<StudentAuthState>((set, get) => ({
  player: null,
  loading: true,

  signIn: async (playerId: string, password: string) => {
    try {
      // First, get the player by player_id
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('player_id', playerId)
        .single()

      if (playerError || !playerData) {
        return { error: 'Invalid player ID or password' }
      }

      // Check if player has email and password (student login enabled)
      if (!playerData.email || !playerData.password_hash) {
        return { error: 'Student login not enabled for this player' }
      }

      // For now, we'll use a simple password check
      // In production, you'd want to use proper password hashing
      if (playerData.password_hash !== password) {
        return { error: 'Invalid player ID or password' }
      }

      // Set the player in state
      set({ player: playerData, loading: false })
      return { error: null }
    } catch (error) {
      console.error('Student sign in error:', error)
      return { error: 'An unexpected error occurred' }
    }
  },

  signOut: async () => {
    set({ player: null, loading: false })
  },

  getCurrentPlayer: async () => {
    try {
      set({ loading: true })
      
      // For student auth, we'll check if there's a stored player ID in localStorage
      const storedPlayerId = localStorage.getItem('student_player_id')
      if (!storedPlayerId) {
        set({ player: null, loading: false })
        return
      }

      const { data: player, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('player_id', storedPlayerId)
        .single()

      if (error) {
        console.error('Error fetching player:', error)
        set({ player: null, loading: false })
        return
      }

      set({ player, loading: false })
    } catch (error) {
      console.error('Error in getCurrentPlayer:', error)
      set({ player: null, loading: false })
    }
  },

  getPlayerMatchHistory: async (playerId: string) => {
    try {
      const { data: history, error } = await supabase
        .from('team_match_divisions')
        .select(`
          *,
          match:matches(
            *,
            home_team:teams(*),
            away_team:teams(*)
          )
        `)
        .or(`home_player_ids.cs.{${playerId}},away_player_ids.cs.{${playerId}}`)
        .eq('completed', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching match history:', error)
        return { history: [], error: error.message }
      }

      // Transform the data into PlayerMatchHistory format
      const transformedHistory: PlayerMatchHistory[] = (history || []).map(division => {
        const isHomePlayer = division.home_player_ids.includes(playerId)
        const playerNames = isHomePlayer ? division.home_player_ids : division.away_player_ids
        const opponentNames = isHomePlayer ? division.away_player_ids : division.home_player_ids
        const setsWon = isHomePlayer ? division.home_sets_won : division.away_sets_won
        const setsLost = isHomePlayer ? division.away_sets_won : division.home_sets_won
        const isWinner = division.winner === (isHomePlayer ? 'home' : 'away')

        return {
          match: division.match,
          division: division.division,
          position_number: division.position_number,
          player_names: playerNames,
          opponent_names: opponentNames,
          sets_won: setsWon,
          sets_lost: setsLost,
          winner: division.winner || 'home',
          score_details: division.score_details || {},
          is_winner: isWinner
        }
      })

      return { history: transformedHistory, error: null }
    } catch (error) {
      console.error('Error in getPlayerMatchHistory:', error)
      return { history: [], error: 'An unexpected error occurred' }
    }
  },
}))

