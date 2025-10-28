import { create } from 'zustand'
import type { Team, Player, Match } from '@/lib/types'
import { PlayerService, TeamService, MatchService, DatabaseError } from '@/lib/services/database'

interface TeamState {
  currentTeam: Team | null
  players: Player[]
  matches: Match[]
  loading: boolean
  error: string | null
  
  // Team actions
  getCurrentTeam: (coachId: string) => Promise<void>
  updateTeamRecord: (teamId: string, wins: number, losses: number) => Promise<void>
  searchTeamsByCode: (teamCode: string) => Promise<{ teams: Team[], error: string | null }>
  getAllTeams: () => Promise<{ teams: Team[], error: string | null }>
  
  // Player actions
  getPlayers: (teamId: string) => Promise<void>
  addPlayer: (player: Omit<Player, 'id' | 'created_at'>) => Promise<{ error: string | null }>
  updatePlayer: (playerId: string, updates: Partial<Player>) => Promise<{ error: string | null }>
  deletePlayer: (playerId: string) => Promise<{ error: string | null }>
  bulkUpdatePlayers: (updates: Array<{ id: string; team_level?: string; gender?: string }>) => Promise<{ error: string | null }>
  
  // Match actions
  getMatches: (teamId: string) => Promise<void>
  createMatch: (match: Omit<Match, 'id' | 'created_at'>) => Promise<{ error: string | null }>
  updateMatchScore: (matchId: string, homeScore: number, awayScore: number) => Promise<{ error: string | null }>
  updateMatchStatus: (matchId: string, status: Match['status']) => Promise<{ error: string | null }>
  
  // Utility actions
  clearError: () => void
}

export const useTeamStore = create<TeamState>((set, get) => ({
  currentTeam: null,
  players: [],
  matches: [],
  loading: true,
  error: null,

  getCurrentTeam: async (coachId: string) => {
    try {
      set({ loading: true, error: null })
      
      const team = await TeamService.getTeamByCoachId(coachId)
      set({ currentTeam: team, loading: false })
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to fetch team'
      set({ currentTeam: null, loading: false, error: errorMessage })
    }
  },

  updateTeamRecord: async (teamId: string, wins: number, losses: number) => {
    try {
      await TeamService.updateTeamRecord(teamId, wins, losses)

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
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to update team record'
      set({ error: errorMessage })
    }
  },

  searchTeamsByCode: async (teamCode: string) => {
    try {
      const teams = await TeamService.searchTeamsByCode(teamCode)
      return { teams, error: null }
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to search teams'
      return { teams: [], error: errorMessage }
    }
  },

  getAllTeams: async () => {
    try {
      const teams = await TeamService.getAllTeams()
      return { teams, error: null }
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to fetch teams'
      return { teams: [], error: errorMessage }
    }
  },

  getPlayers: async (teamId: string) => {
    try {
      set({ loading: true, error: null })
      
      const players = await PlayerService.getPlayersByTeam(teamId)
      set({ players, loading: false })
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to fetch players'
      set({ players: [], loading: false, error: errorMessage })
    }
  },

  addPlayer: async (player: Omit<Player, 'id' | 'created_at'>) => {
    try {
      await PlayerService.createPlayer(player)
      // Refresh players list
      await get().getPlayers(player.team_id)
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to create player'
      return { error: errorMessage }
    }
  },

  updatePlayer: async (playerId: string, updates: Partial<Player>) => {
    try {
      const updatedPlayer = await PlayerService.updatePlayer(playerId, updates)
      
      // Update local state
      const { players } = get()
      const updatedPlayers = players.map(player =>
        player.id === playerId ? updatedPlayer : player
      )
      set({ players: updatedPlayers })
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to update player'
      return { error: errorMessage }
    }
  },

  deletePlayer: async (playerId: string) => {
    try {
      await PlayerService.deletePlayer(playerId)
      
      // Update local state
      const { players } = get()
      const filteredPlayers = players.filter(player => player.id !== playerId)
      set({ players: filteredPlayers })
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to delete player'
      return { error: errorMessage }
    }
  },

  bulkUpdatePlayers: async (updates: Array<{ id: string; team_level?: string; gender?: string }>) => {
    try {
      await PlayerService.bulkUpdatePlayers(updates)
      
      // Refresh players list
      const { currentTeam } = get()
      if (currentTeam) {
        await get().getPlayers(currentTeam.id)
      }
      
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to update players'
      return { error: errorMessage }
    }
  },

  getMatches: async (teamId: string) => {
    try {
      set({ loading: true, error: null })
      
      const matches = await MatchService.getMatchesByTeam(teamId)
      set({ matches, loading: false })
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to fetch matches'
      set({ matches: [], loading: false, error: errorMessage })
    }
  },

  createMatch: async (match: Omit<Match, 'id' | 'created_at'>) => {
    try {
      await MatchService.createMatch(match)
      // Refresh matches list
      await get().getMatches(match.home_team_id)
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to create match'
      return { error: errorMessage }
    }
  },

  updateMatchScore: async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      await MatchService.updateMatchScore(matchId, homeScore, awayScore)
      
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
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to update match score'
      return { error: errorMessage }
    }
  },

  updateMatchStatus: async (matchId: string, status: Match['status']) => {
    try {
      await MatchService.updateMatchStatus(matchId, status)
      
      // Update local state
      const { matches } = get()
      const updatedMatches = matches.map(match =>
        match.id === matchId ? { ...match, status } : match
      )
      set({ matches: updatedMatches })
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof DatabaseError ? error.message : 'Failed to update match status'
      return { error: errorMessage }
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
