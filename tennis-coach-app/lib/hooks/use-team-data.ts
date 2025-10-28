import { useState, useEffect } from 'react'
import { useTeamStore } from '@/stores/team-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Player, Team, Match } from '@/lib/types'

export function usePlayers(teamId?: string) {
  const { players, loading, error, getPlayers, clearError } = useTeamStore()
  const { coach } = useAuthStore()

  useEffect(() => {
    if (teamId) {
      getPlayers(teamId)
    } else if (coach?.id) {
      // If no teamId provided, try to get current team's players
      const { currentTeam } = useTeamStore.getState()
      if (currentTeam) {
        getPlayers(currentTeam.id)
      }
    }
  }, [teamId, coach?.id, getPlayers])

  return {
    players,
    loading,
    error,
    clearError,
    refetch: () => teamId && getPlayers(teamId)
  }
}

export function useTeam() {
  const { currentTeam, loading, error, getCurrentTeam, clearError } = useTeamStore()
  const { coach } = useAuthStore()

  useEffect(() => {
    if (coach?.id) {
      getCurrentTeam(coach.id)
    }
  }, [coach?.id, getCurrentTeam])

  return {
    team: currentTeam,
    loading,
    error,
    clearError,
    refetch: () => coach?.id && getCurrentTeam(coach.id)
  }
}

export function useMatches(teamId?: string) {
  const { matches, loading, error, getMatches, clearError } = useTeamStore()
  const { coach } = useAuthStore()

  useEffect(() => {
    if (teamId) {
      getMatches(teamId)
    } else if (coach?.id) {
      // If no teamId provided, try to get current team's matches
      const { currentTeam } = useTeamStore.getState()
      if (currentTeam) {
        getMatches(currentTeam.id)
      }
    }
  }, [teamId, coach?.id, getMatches])

  return {
    matches,
    loading,
    error,
    clearError,
    refetch: () => teamId && getMatches(teamId)
  }
}

export function usePlayerManagement() {
  const { addPlayer, updatePlayer, deletePlayer, bulkUpdatePlayers } = useTeamStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddPlayer = async (player: Omit<Player, 'id' | 'created_at'>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await addPlayer(player)
      if (result.error) {
        setError(result.error)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to add player')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePlayer = async (playerId: string, updates: Partial<Player>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await updatePlayer(playerId, updates)
      if (result.error) {
        setError(result.error)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to update player')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await deletePlayer(playerId)
      if (result.error) {
        setError(result.error)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to delete player')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkUpdatePlayers = async (updates: Array<{ id: string; team_level?: string; gender?: string }>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await bulkUpdatePlayers(updates)
      if (result.error) {
        setError(result.error)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to update players')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    setError,
    addPlayer: handleAddPlayer,
    updatePlayer: handleUpdatePlayer,
    deletePlayer: handleDeletePlayer,
    bulkUpdatePlayers: handleBulkUpdatePlayers
  }
}

export function useMatchManagement() {
  const { createMatch, updateMatchScore, updateMatchStatus } = useTeamStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateMatch = async (match: Omit<Match, 'id' | 'created_at'>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await createMatch(match)
      if (result.error) {
        setError(result.error)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to create match')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMatchScore = async (matchId: string, homeScore: number, awayScore: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await updateMatchScore(matchId, homeScore, awayScore)
      if (result.error) {
        setError(result.error)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to update match score')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMatchStatus = async (matchId: string, status: Match['status']) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await updateMatchStatus(matchId, status)
      if (result.error) {
        setError(result.error)
        return false
      }
      return true
    } catch (err) {
      setError('Failed to update match status')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    setError,
    createMatch: handleCreateMatch,
    updateMatchScore: handleUpdateMatchScore,
    updateMatchStatus: handleUpdateMatchStatus
  }
}
