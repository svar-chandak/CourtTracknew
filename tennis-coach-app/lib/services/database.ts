import { supabase } from './supabase'
import type { Player, Team, Match, Coach } from './types'

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class PlayerService {
  static async getPlayersByTeam(teamId: string): Promise<Player[]> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, team_id, created_at, gender, team_level, player_id, password_hash, grade, position_preference, utr_rating')
        .eq('team_id', teamId)

      if (error) {
        throw new DatabaseError(`Failed to fetch players: ${error.message}`, error.code)
      }

      return data || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching players')
    }
  }

  static async createPlayer(player: Omit<Player, 'id' | 'created_at'>): Promise<Player> {
    try {
      const { team_id, name, gender, grade, position_preference, team_level, utr_rating, player_id, password_hash } = player

      const toInsert = {
        team_id,
        name,
        gender,
        grade,
        position_preference,
        team_level,
        utr_rating,
        player_id,
        password_hash,
      }

      const { data, error } = await supabase
        .from('players')
        .insert(toInsert)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to create player: ${error.message}`, error.code)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error creating player')
    }
  }

  static async updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player> {
    try {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to update player: ${error.message}`, error.code)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error updating player')
    }
  }

  static async deletePlayer(playerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) {
        throw new DatabaseError(`Failed to delete player: ${error.message}`, error.code)
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error deleting player')
    }
  }

  static async bulkUpdatePlayers(updates: Array<{ id: string; team_level?: string; gender?: string }>): Promise<void> {
    try {
      const promises = updates.map(update => {
        const { id, ...updateData } = update
        return supabase
          .from('players')
          .update(updateData)
          .eq('id', id)
      })

      const results = await Promise.all(promises)
      
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new DatabaseError(`Some players failed to update: ${errors.map(e => e.error?.message).join(', ')}`)
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error in bulk update')
    }
  }
}

export class TeamService {
  static async getTeamByCoachId(coachId: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          coach:coaches(*)
        `)
        .eq('coach_id', coachId)

      if (error) {
        throw new DatabaseError(`Failed to fetch team: ${error.message}`, error.code)
      }

      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching team')
    }
  }

  static async searchTeamsByCode(teamCode: string): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          coach:coaches(*)
        `)
        .ilike('team_code', `%${teamCode}%`)

      if (error) {
        throw new DatabaseError(`Failed to search teams: ${error.message}`, error.code)
      }

      return data || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error searching teams')
    }
  }

  static async getAllTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          coach:coaches(*)
        `)
        .order('school_name')

      if (error) {
        throw new DatabaseError(`Failed to fetch teams: ${error.message}`, error.code)
      }

      return data || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching teams')
    }
  }

  static async updateTeamRecord(teamId: string, wins: number, losses: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          season_record_wins: wins,
          season_record_losses: losses,
        })
        .eq('id', teamId)

      if (error) {
        throw new DatabaseError(`Failed to update team record: ${error.message}`, error.code)
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error updating team record')
    }
  }
}

export class MatchService {
  static async getMatchesByTeam(teamId: string): Promise<Match[]> {
    try {
      const { data, error } = await supabase
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
        throw new DatabaseError(`Failed to fetch matches: ${error.message}`, error.code)
      }

      return data || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching matches')
    }
  }

  static async createMatch(match: Omit<Match, 'id' | 'created_at'>): Promise<Match> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert(match)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to create match: ${error.message}`, error.code)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error creating match')
    }
  }

  static async updateMatchScore(matchId: string, homeScore: number, awayScore: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: 'completed',
        })
        .eq('id', matchId)

      if (error) {
        throw new DatabaseError(`Failed to update match score: ${error.message}`, error.code)
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error updating match score')
    }
  }

  static async updateMatchStatus(matchId: string, status: Match['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status })
        .eq('id', matchId)

      if (error) {
        throw new DatabaseError(`Failed to update match status: ${error.message}`, error.code)
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error updating match status')
    }
  }
}

export class CoachService {
  static async getCoachById(coachId: string): Promise<Coach | null> {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', coachId)
        .single()

      if (error) {
        throw new DatabaseError(`Failed to fetch coach: ${error.message}`, error.code)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error fetching coach')
    }
  }

  static async updateCoachProfile(coachId: string, updates: Partial<Coach>): Promise<Coach> {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coachId)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to update coach profile: ${error.message}`, error.code)
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error updating coach profile')
    }
  }
}
