import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Player, PlayerMatchHistory } from '@/lib/types'
import { generateStudentId, generateDeterministicPassword } from '@/lib/student-credentials'

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
      // Get all players to find matching credentials
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(*)
        `)

      if (playersError || !allPlayers) {
        return { error: 'Unable to fetch players' }
      }

      // Find player by generated student ID
      let playerData = null
      for (const player of allPlayers) {
        const generatedId = generateStudentId(player.name)
        if (generatedId === playerId) {
          playerData = player
          break
        }
      }

      if (!playerData) {
        return { error: 'Invalid player ID or password' }
      }

      // Generate deterministic password for this player (same as export)
      const generatedPassword = generateDeterministicPassword(playerData.name)
      
      // Check if password matches the generated one
      if (password !== generatedPassword) {
        return { error: 'Invalid player ID or password' }
      }

      // Set the player in state with generated credentials
      set({ player: { ...playerData, player_id: playerId, password_hash: password }, loading: false })
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

// Initialize student auth state on store creation
if (typeof window !== 'undefined') {
  useStudentAuthStore.getState().getCurrentPlayer()
}

