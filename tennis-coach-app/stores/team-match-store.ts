'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { 
  TeamMatch, 
  IndividualPositionMatch, 
  TeamMatchSummary,
  CreateTeamMatchData,
  UpdateTeamMatchData,
  UpdateIndividualMatchData,
  TeamMatchResult
} from '@/lib/team-match-types'

interface TeamMatchState {
  teamMatches: TeamMatch[]
  individualMatches: IndividualPositionMatch[]
  loading: boolean
  error: string | null
  
  // Team matches
  getTeamMatches: (teamId: string, teamLevel?: string) => Promise<void>
  createTeamMatch: (data: CreateTeamMatchData) => Promise<{ error: string | null }>
  updateTeamMatch: (id: string, data: UpdateTeamMatchData) => Promise<{ error: string | null }>
  deleteTeamMatch: (id: string) => Promise<{ error: string | null }>
  
  // Individual matches
  getIndividualMatches: (teamMatchId: string) => Promise<void>
  createIndividualMatches: (teamMatchId: string) => Promise<{ error: string | null }>
  updateIndividualMatch: (id: string, data: UpdateIndividualMatchData) => Promise<{ error: string | null }>
  updateTeamMatchScores: (individualMatchId: string) => Promise<void>
  
  // Summary
  getTeamMatchSummary: (teamId: string) => Promise<TeamMatchSummary | null>
}

export const useTeamMatchStore = create<TeamMatchState>((set, get) => ({
  teamMatches: [],
  individualMatches: [],
  loading: false,
  error: null,

  getTeamMatches: async (teamId: string, teamLevel?: string) => {
    set({ loading: true, error: null })
    
    try {
      let query = supabase
        .from('team_matches')
        .select(`
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          individual_matches:individual_position_matches(
            *,
            home_player1:players!home_player1_id(*),
            home_player2:players!home_player2_id(*),
            away_player1:players!away_player1_id(*),
            away_player2:players!away_player2_id(*)
          )
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('match_date', { ascending: false })

      if (teamLevel) {
        query = query.eq('team_level', teamLevel)
      }

      const { data, error } = await query

      if (error) {
        set({ error: error.message, loading: false })
        return
      }

      set({ teamMatches: data || [], loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch team matches', loading: false })
    }
  },

  createTeamMatch: async (data) => {
    try {
      const { data: result, error } = await supabase
        .from('team_matches')
        .insert(data)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      // Create individual position matches
      await get().createIndividualMatches(result.id)

      // Refresh team matches
      const { teamMatches } = get()
      if (teamMatches.length > 0) {
        await get().getTeamMatches(teamMatches[0].home_team_id)
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to create team match' }
    }
  },

  updateTeamMatch: async (id, data) => {
    try {
      const { error } = await supabase
        .from('team_matches')
        .update(data)
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      // Refresh team matches
      const { teamMatches } = get()
      if (teamMatches.length > 0) {
        await get().getTeamMatches(teamMatches[0].home_team_id)
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to update team match' }
    }
  },

  deleteTeamMatch: async (id) => {
    try {
      const { error } = await supabase
        .from('team_matches')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      // Refresh team matches
      const { teamMatches } = get()
      if (teamMatches.length > 0) {
        await get().getTeamMatches(teamMatches[0].home_team_id)
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to delete team match' }
    }
  },

  getIndividualMatches: async (teamMatchId) => {
    try {
      const { data, error } = await supabase
        .from('individual_position_matches')
        .select(`
          *,
          home_player1:players!home_player1_id(*),
          home_player2:players!home_player2_id(*),
          away_player1:players!away_player1_id(*),
          away_player2:players!away_player2_id(*)
        `)
        .eq('team_match_id', teamMatchId)
        .order('division', { ascending: true })
        .order('position', { ascending: true })

      if (error) {
        set({ error: error.message })
        return
      }

      set({ individualMatches: data || [] })
    } catch (error) {
      set({ error: 'Failed to fetch individual matches' })
    }
  },

  createIndividualMatches: async (teamMatchId) => {
    try {
      const divisions = [
        'boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles'
      ]
      
      const matches = []
      
      // Boys Singles (6 positions)
      for (let position = 1; position <= 6; position++) {
        matches.push({
          team_match_id: teamMatchId,
          division: 'boys_singles',
          position,
          status: 'pending'
        })
      }
      
      // Girls Singles (6 positions)
      for (let position = 1; position <= 6; position++) {
        matches.push({
          team_match_id: teamMatchId,
          division: 'girls_singles',
          position,
          status: 'pending'
        })
      }
      
      // Boys Doubles (3 positions)
      for (let position = 1; position <= 3; position++) {
        matches.push({
          team_match_id: teamMatchId,
          division: 'boys_doubles',
          position,
          status: 'pending'
        })
      }
      
      // Girls Doubles (3 positions)
      for (let position = 1; position <= 3; position++) {
        matches.push({
          team_match_id: teamMatchId,
          division: 'girls_doubles',
          position,
          status: 'pending'
        })
      }
      
      // Mixed Doubles (1 position)
      matches.push({
        team_match_id: teamMatchId,
        division: 'mixed_doubles',
        position: 1,
        status: 'pending'
      })

      const { error } = await supabase
        .from('individual_position_matches')
        .insert(matches)

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to create individual matches' }
    }
  },

  updateIndividualMatch: async (id, data) => {
    try {
      const { error } = await supabase
        .from('individual_position_matches')
        .update(data)
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      // Update team match scores if this was a completion
      if (data.status === 'completed' && data.winner) {
        await get().updateTeamMatchScores(id)
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to update individual match' }
    }
  },

  updateTeamMatchScores: async (individualMatchId) => {
    try {
      // Get the individual match to find the team match
      const { data: individualMatch, error: fetchError } = await supabase
        .from('individual_position_matches')
        .select('team_match_id')
        .eq('id', individualMatchId)
        .single()

      if (fetchError || !individualMatch) return

      // Get all individual matches for this team match
      const { data: allMatches, error: matchesError } = await supabase
        .from('individual_position_matches')
        .select('winner')
        .eq('team_match_id', individualMatch.team_match_id)

      if (matchesError || !allMatches) return

      // Calculate scores
      const homeWins = allMatches.filter(m => m.winner === 'home').length
      const awayWins = allMatches.filter(m => m.winner === 'away').length
      const totalMatches = allMatches.length
      const completedMatches = allMatches.filter(m => m.winner).length

      // Determine winner
      let winner = null
      if (completedMatches === totalMatches) {
        if (homeWins > awayWins) winner = 'home'
        else if (awayWins > homeWins) winner = 'away'
        else winner = 'tie'
      }

      // Update team match
      const updateData: any = {
        home_score: homeWins,
        away_score: awayWins
      }

      if (winner) {
        updateData.winner = winner
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
      }

      await supabase
        .from('team_matches')
        .update(updateData)
        .eq('id', individualMatch.team_match_id)

    } catch (error) {
      console.error('Failed to update team match scores:', error)
    }
  },

  getTeamMatchSummary: async (teamId) => {
    try {
      const { data, error } = await supabase
        .from('team_matches')
        .select('*')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)

      if (error) {
        set({ error: error.message })
        return null
      }

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const totalMatches = data.length
      const upcomingMatches = data.filter(match => 
        new Date(match.match_date) >= today && match.status === 'scheduled'
      ).length
      const completedMatches = data.filter(match => match.status === 'completed').length
      
      const homeWins = data.filter(match => 
        match.home_team_id === teamId && match.winner === 'home'
      ).length
      const awayWins = data.filter(match => 
        match.away_team_id === teamId && match.winner === 'away'
      ).length
      const totalWins = homeWins + awayWins
      const winRate = completedMatches > 0 ? (totalWins / completedMatches) * 100 : 0

      // Team level stats
      const teamLevelStats = {
        varsity: { wins: 0, losses: 0, total: 0 },
        jv: { wins: 0, losses: 0, total: 0 },
        freshman: { wins: 0, losses: 0, total: 0 }
      }

      data.forEach(match => {
        const isHomeTeam = match.home_team_id === teamId
        const isWin = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away')
        const isLoss = (isHomeTeam && match.winner === 'away') || (!isHomeTeam && match.winner === 'home')
        
        if (match.status === 'completed' && match.team_level in teamLevelStats) {
          const level = match.team_level as keyof typeof teamLevelStats
          teamLevelStats[level].total++
          if (isWin) teamLevelStats[level].wins++
          if (isLoss) teamLevelStats[level].losses++
        }
      })

      return {
        totalMatches,
        upcomingMatches,
        completedMatches,
        winRate: Math.round(winRate),
        teamLevelStats
      }
    } catch (error) {
      set({ error: 'Failed to fetch team match summary' })
      return null
    }
  }
}))
