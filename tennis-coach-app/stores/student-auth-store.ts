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
      console.log('Attempting login with:', { playerId, password })
      
      // Get all players to find matching credentials
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(*)
        `)

      if (playersError || !allPlayers) {
        console.error('Error fetching players:', playersError)
        return { error: 'Unable to fetch players' }
      }

      console.log('Found players:', allPlayers.length)

      // Find player by generated student ID
      let playerData = null
      for (const player of allPlayers) {
        const generatedId = generateStudentId(player.name)
        console.log(`Player: ${player.name}, Generated ID: ${generatedId}, Looking for: ${playerId}`)
        if (generatedId === playerId) {
          playerData = player
          break
        }
      }

      if (!playerData) {
        console.log('No player found with matching ID')
        return { error: 'Invalid player ID or password' }
      }

      // Generate deterministic password for this player (same as export)
      const generatedPassword = generateDeterministicPassword(playerData.name)
      console.log(`Player: ${playerData.name}, Generated password: ${generatedPassword}, Provided: ${password}`)
      
      // Check if password matches the generated one
      if (password !== generatedPassword) {
        console.log('Password mismatch')
        return { error: 'Invalid player ID or password' }
      }

      console.log('Login successful!')
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
      console.log('Fetching match history for player:', playerId)
      
      // First, get the player to find their name
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('name')
        .eq('id', playerId)
        .single()

      if (playerError || !player) {
        console.error('Error fetching player:', playerError)
        return { history: [], error: 'Player not found' }
      }

      console.log('Found player name:', player.name)

      // Query match_results table using player names - SIMPLIFIED QUERY
      const { data: history, error } = await supabase
        .from('match_results')
        .select('*')
        .or(`home_player_names.cs.{${player.name}},away_player_names.cs.{${player.name}}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching match history:', error)
        return { history: [], error: error.message }
      }

      console.log('Found match history:', history?.length || 0, 'matches')

      // Transform the data into PlayerMatchHistory format
      const transformedHistory: PlayerMatchHistory[] = (history || []).map(result => {
        const isHomePlayer = result.home_player_names.includes(player.name)
        const playerNames = isHomePlayer ? result.home_player_names : result.away_player_names
        const opponentNames = isHomePlayer ? result.away_player_names : result.home_player_names
        const setsWon = isHomePlayer ? result.home_sets_won : result.away_sets_won
        const setsLost = isHomePlayer ? result.away_sets_won : result.home_sets_won
        const isWinner = result.winner === (isHomePlayer ? 'home' : 'away')

        return {
          match: {
            id: result.match_id || '',
            match_date: new Date().toISOString(),
            home_team_id: '',
            away_team_id: '',
            match_type: 'team_match' as const,
            status: 'completed' as const,
            home_score: 0,
            away_score: 0,
            created_by: '',
            created_at: new Date().toISOString()
          },
          division: result.position,
          position_number: 1, // Default since we don't have this field
          player_names: playerNames,
          opponent_names: opponentNames,
          sets_won: setsWon,
          sets_lost: setsLost,
          winner: result.winner || 'home',
          score_details: result.score_details || {},
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

