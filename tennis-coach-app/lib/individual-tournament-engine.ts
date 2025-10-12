'use client'

import type { Player, Team } from '@/lib/types'

export interface IndividualMatch {
  id: string
  tournamentId: string
  round: number
  matchNumber: number
  division: 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'
  position: number // 1st singles, 2nd singles, etc.
  
  // Players
  homePlayer1?: Player
  homePlayer2?: Player // For doubles
  awayPlayer1?: Player
  awayPlayer2?: Player // For doubles
  
  // Teams
  homeTeam?: Team
  awayTeam?: Team
  
  // Match details
  winner?: 'home' | 'away'
  score?: string
  status: 'pending' | 'in_progress' | 'completed'
  isBye: boolean
  nextMatchId?: string
  courtNumber?: number
  scheduledTime?: string
  completedAt?: string
}

export interface IndividualTournamentBracket {
  tournamentId: string
  matches: IndividualMatch[]
  divisions: string[]
  totalMatches: number
  completedMatches: number
  currentRound: number
  isComplete: boolean
  schoolScores: Record<string, number> // school_id -> total wins
}

export interface SchoolStanding {
  school: Team
  wins: number
  losses: number
  totalMatches: number
  winPercentage: number
}

export class IndividualTournamentEngine {
  /**
   * Generate individual player matches for a tournament
   */
  static generateIndividualBracket(
    tournamentId: string,
    teams: Team[],
    divisions: Array<'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'>,
    positionsPerDivision: number = 6
  ): IndividualMatch[] {
    const matches: IndividualMatch[] = []
    let matchId = 1

    // Generate matches for each division
    divisions.forEach(division => {
      for (let position = 1; position <= positionsPerDivision; position++) {
        // Create matches for each position (1st singles, 2nd singles, etc.)
        const divisionMatches = this.generateDivisionMatches(
          tournamentId,
          teams,
          division,
          position,
          matchId
        )
        matches.push(...divisionMatches)
        matchId += divisionMatches.length
      }
    })

    return matches
  }

  /**
   * Generate matches for a specific division and position
   */
  private static generateDivisionMatches(
    tournamentId: string,
    teams: Team[],
    division: string,
    position: number,
    startMatchId: number
  ): IndividualMatch[] {
    const matches: IndividualMatch[] = []
    let matchId = startMatchId

    // Round robin: each team plays every other team
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const match: IndividualMatch = {
          id: `${tournamentId}-${division}-${position}-${matchId}`,
          tournamentId,
          round: 1, // All matches are in round 1 for round robin
          matchNumber: matchId,
          division: division as any,
          position,
          homeTeam: teams[i],
          awayTeam: teams[j],
          status: 'pending',
          isBye: false
        }
        
        matches.push(match)
        matchId++
      }
    }

    return matches
  }

  /**
   * Assign players to matches
   */
  static assignPlayersToMatches(
    matches: IndividualMatch[],
    teamPlayers: Record<string, Player[]> // team_id -> players
  ): IndividualMatch[] {
    return matches.map(match => {
      if (!match.homeTeam || !match.awayTeam) return match

      const homePlayers = teamPlayers[match.homeTeam.id] || []
      const awayPlayers = teamPlayers[match.awayTeam.id] || []

      // Filter players by division requirements
      const homeDivisionPlayers = this.filterPlayersByDivision(homePlayers, match.division)
      const awayDivisionPlayers = this.filterPlayersByDivision(awayPlayers, match.division)

      // Assign players based on position (1st, 2nd, etc.)
      const homePlayer = this.getPlayerByPosition(homeDivisionPlayers, match.position)
      const awayPlayer = this.getPlayerByPosition(awayDivisionPlayers, match.position)

      return {
        ...match,
        homePlayer1: homePlayer,
        awayPlayer1: awayPlayer,
        // For doubles, we'd assign homePlayer2 and awayPlayer2
        // This would require more complex logic to pair players
      }
    })
  }

  /**
   * Filter players by division requirements
   */
  private static filterPlayersByDivision(players: Player[], division: string): Player[] {
    return players.filter(player => {
      if (division.includes('boys') && player.gender !== 'male') return false
      if (division.includes('girls') && player.gender !== 'female') return false
      return true
    })
  }

  /**
   * Get player by position (1st, 2nd, etc.)
   */
  private static getPlayerByPosition(players: Player[], position: number): Player | undefined {
    // Sort players by skill level or UTR rating
    const sortedPlayers = players.sort((a, b) => (b.utr_rating || 0) - (a.utr_rating || 0))
    return sortedPlayers[position - 1]
  }

  /**
   * Update match result
   */
  static updateMatchResult(
    matches: IndividualMatch[],
    matchId: string,
    winner: 'home' | 'away',
    score: string
  ): IndividualMatch[] {
    const updatedMatches = [...matches]
    const matchIndex = updatedMatches.findIndex(m => m.id === matchId)
    
    if (matchIndex === -1) return matches
    
    // Update the match
    updatedMatches[matchIndex] = {
      ...updatedMatches[matchIndex],
      winner,
      score,
      status: 'completed',
      completedAt: new Date().toISOString()
    }
    
    return updatedMatches
  }

  /**
   * Calculate school scores based on individual match results
   */
  static calculateSchoolScores(matches: IndividualMatch[]): Record<string, number> {
    const schoolScores: Record<string, number> = {}
    
    matches.forEach(match => {
      if (match.status === 'completed' && match.homeTeam && match.awayTeam) {
        if (!schoolScores[match.homeTeam.id]) schoolScores[match.homeTeam.id] = 0
        if (!schoolScores[match.awayTeam.id]) schoolScores[match.awayTeam.id] = 0
        
        if (match.winner === 'home') {
          schoolScores[match.homeTeam.id]++
        } else if (match.winner === 'away') {
          schoolScores[match.awayTeam.id]++
        }
      }
    })
    
    return schoolScores
  }

  /**
   * Get school standings
   */
  static getSchoolStandings(matches: IndividualMatch[], teams: Team[]): SchoolStanding[] {
    const schoolScores = this.calculateSchoolScores(matches)
    
    return teams.map(team => {
      const wins = schoolScores[team.id] || 0
      const teamMatches = matches.filter(m => 
        (m.homeTeam?.id === team.id || m.awayTeam?.id === team.id) && m.status === 'completed'
      )
      const totalMatches = teamMatches.length
      const losses = totalMatches - wins
      const winPercentage = totalMatches > 0 ? wins / totalMatches : 0
      
      return {
        school: team,
        wins,
        losses,
        totalMatches,
        winPercentage
      }
    }).sort((a, b) => {
      // Sort by wins, then by win percentage
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.winPercentage - a.winPercentage
    })
  }

  /**
   * Get matches for a specific division
   */
  static getDivisionMatches(matches: IndividualMatch[], division: string): IndividualMatch[] {
    return matches.filter(m => m.division === division).sort((a, b) => a.position - b.position)
  }

  /**
   * Get tournament summary
   */
  static getTournamentSummary(matches: IndividualMatch[]): IndividualTournamentBracket {
    const divisions = [...new Set(matches.map(m => m.division))]
    const totalMatches = matches.length
    const completedMatches = matches.filter(m => m.status === 'completed').length
    const schoolScores = this.calculateSchoolScores(matches)
    
    return {
      tournamentId: matches[0]?.tournamentId || '',
      matches,
      divisions,
      totalMatches,
      completedMatches,
      currentRound: 1, // Individual tournaments are typically single round
      isComplete: completedMatches === totalMatches,
      schoolScores
    }
  }
}
