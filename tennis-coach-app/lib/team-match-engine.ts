'use client'

import type { Player, Team } from '@/lib/types'

export interface TeamMatch {
  id: string
  tournamentId: string
  homeTeam: Team
  awayTeam: Team
  teamLevel: 'varsity' | 'jv' | 'freshman'
  matchDate: string
  status: 'scheduled' | 'in_progress' | 'completed'
  homeScore: number
  awayScore: number
  individualMatches: IndividualPositionMatch[]
  winner?: 'home' | 'away'
  completedAt?: string
}

export interface IndividualPositionMatch {
  id: string
  teamMatchId: string
  division: 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'
  position: number // 1st, 2nd, 3rd, etc.
  
  // Players
  homePlayer1?: Player
  homePlayer2?: Player // For doubles
  awayPlayer1?: Player
  awayPlayer2?: Player // For doubles
  
  // Match details
  winner?: 'home' | 'away'
  score?: string
  status: 'pending' | 'in_progress' | 'completed'
  completedAt?: string
}

export interface TeamMatchResult {
  teamMatch: TeamMatch
  homeWins: number
  awayWins: number
  totalPositions: number
  winner: 'home' | 'away' | 'tie'
}

export class TeamMatchEngine {
  /**
   * Create a team match between two schools
   */
  static createTeamMatch(
    tournamentId: string,
    homeTeam: Team,
    awayTeam: Team,
    teamLevel: 'varsity' | 'jv' | 'freshman',
    matchDate: string
  ): TeamMatch {
    const teamMatchId = `${tournamentId}-${homeTeam.id}-${awayTeam.id}-${teamLevel}`
    
    // Create individual position matches
    const individualMatches = this.createIndividualMatches(teamMatchId)
    
    return {
      id: teamMatchId,
      tournamentId,
      homeTeam,
      awayTeam,
      teamLevel,
      matchDate,
      status: 'scheduled',
      homeScore: 0,
      awayScore: 0,
      individualMatches,
      winner: undefined
    }
  }

  /**
   * Create individual position matches for a team match
   */
  private static createIndividualMatches(teamMatchId: string): IndividualPositionMatch[] {
    const matches: IndividualPositionMatch[] = []
    let matchId = 1

    // Boys Singles (6 positions)
    for (let position = 1; position <= 6; position++) {
      matches.push({
        id: `${teamMatchId}-boys-singles-${position}`,
        teamMatchId,
        division: 'boys_singles',
        position,
        status: 'pending'
      })
      matchId++
    }

    // Girls Singles (6 positions)
    for (let position = 1; position <= 6; position++) {
      matches.push({
        id: `${teamMatchId}-girls-singles-${position}`,
        teamMatchId,
        division: 'girls_singles',
        position,
        status: 'pending'
      })
      matchId++
    }

    // Boys Doubles (3 positions)
    for (let position = 1; position <= 3; position++) {
      matches.push({
        id: `${teamMatchId}-boys-doubles-${position}`,
        teamMatchId,
        division: 'boys_doubles',
        position,
        status: 'pending'
      })
      matchId++
    }

    // Girls Doubles (3 positions)
    for (let position = 1; position <= 3; position++) {
      matches.push({
        id: `${teamMatchId}-girls-doubles-${position}`,
        teamMatchId,
        division: 'girls_doubles',
        position,
        status: 'pending'
      })
      matchId++
    }

    // Mixed Doubles (1 position)
    matches.push({
      id: `${teamMatchId}-mixed-doubles-1`,
      teamMatchId,
      division: 'mixed_doubles',
      position: 1,
      status: 'pending'
    })

    return matches
  }

  /**
   * Assign players to individual matches based on team level
   */
  static assignPlayersToTeamMatch(
    teamMatch: TeamMatch,
    homePlayers: Player[],
    awayPlayers: Player[]
  ): TeamMatch {
    const updatedIndividualMatches = teamMatch.individualMatches.map(match => {
      const homeDivisionPlayers = this.filterPlayersByDivision(homePlayers, match.division)
      const awayDivisionPlayers = this.filterPlayersByDivision(awayPlayers, match.division)

      return {
        ...match,
        homePlayer1: this.getPlayerByPosition(homeDivisionPlayers, match.position),
        homePlayer2: this.getDoublesPartner(homeDivisionPlayers, match.position, match.division),
        awayPlayer1: this.getPlayerByPosition(awayDivisionPlayers, match.position),
        awayPlayer2: this.getDoublesPartner(awayDivisionPlayers, match.position, match.division)
      }
    })

    return {
      ...teamMatch,
      individualMatches: updatedIndividualMatches
    }
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
   * Get doubles partner for doubles matches
   */
  private static getDoublesPartner(players: Player[], position: number, division: string): Player | undefined {
    if (!division.includes('doubles')) return undefined
    
    const sortedPlayers = players.sort((a, b) => (b.utr_rating || 0) - (a.utr_rating || 0))
    return sortedPlayers[position] // Partner is the next best player
  }

  /**
   * Update individual match result
   */
  static updateIndividualMatchResult(
    teamMatch: TeamMatch,
    individualMatchId: string,
    winner: 'home' | 'away',
    score: string
  ): TeamMatch {
    const updatedIndividualMatches = teamMatch.individualMatches.map(match => {
      if (match.id === individualMatchId) {
        return {
          ...match,
          winner,
          score,
          status: 'completed' as const,
          completedAt: new Date().toISOString()
        }
      }
      return match
    })

    // Calculate team scores
    const homeWins = updatedIndividualMatches.filter(m => m.winner === 'home').length
    const awayWins = updatedIndividualMatches.filter(m => m.winner === 'away').length
    const totalPositions = updatedIndividualMatches.length

    // Determine team match winner
    let teamWinner: 'home' | 'away' | undefined
    if (homeWins > awayWins) {
      teamWinner = 'home'
    } else if (awayWins > homeWins) {
      teamWinner = 'away'
    }

    // Check if team match is complete
    const completedMatches = updatedIndividualMatches.filter(m => m.status === 'completed').length
    const isComplete = completedMatches === totalPositions

    return {
      ...teamMatch,
      individualMatches: updatedIndividualMatches,
      homeScore: homeWins,
      awayScore: awayWins,
      winner: teamWinner,
      status: isComplete ? 'completed' : teamMatch.status,
      completedAt: isComplete ? new Date().toISOString() : teamMatch.completedAt
    }
  }

  /**
   * Get team match result summary
   */
  static getTeamMatchResult(teamMatch: TeamMatch): TeamMatchResult {
    const homeWins = teamMatch.individualMatches.filter(m => m.winner === 'home').length
    const awayWins = teamMatch.individualMatches.filter(m => m.winner === 'away').length
    const totalPositions = teamMatch.individualMatches.length

    let winner: 'home' | 'away' | 'tie'
    if (homeWins > awayWins) {
      winner = 'home'
    } else if (awayWins > homeWins) {
      winner = 'away'
    } else {
      winner = 'tie'
    }

    return {
      teamMatch,
      homeWins,
      awayWins,
      totalPositions,
      winner
    }
  }

  /**
   * Get matches by division
   */
  static getMatchesByDivision(teamMatch: TeamMatch, division: string): IndividualPositionMatch[] {
    return teamMatch.individualMatches
      .filter(match => match.division === division)
      .sort((a, b) => a.position - b.position)
  }

  /**
   * Get team match standings for a tournament
   */
  static getTournamentStandings(teamMatches: TeamMatch[]): Array<{
    team: Team
    teamLevel: string
    wins: number
    losses: number
    ties: number
    winPercentage: number
    totalMatches: number
  }> {
    const teamStats: Record<string, {
      team: Team
      teamLevel: string
      wins: number
      losses: number
      ties: number
      totalMatches: number
    }> = {}

    teamMatches.forEach(match => {
      if (match.status !== 'completed') return

      const homeKey = `${match.homeTeam.id}-${match.teamLevel}`
      const awayKey = `${match.awayTeam.id}-${match.teamLevel}`

      // Initialize team stats if not exists
      if (!teamStats[homeKey]) {
        teamStats[homeKey] = {
          team: match.homeTeam,
          teamLevel: match.teamLevel,
          wins: 0,
          losses: 0,
          ties: 0,
          totalMatches: 0
        }
      }
      if (!teamStats[awayKey]) {
        teamStats[awayKey] = {
          team: match.awayTeam,
          teamLevel: match.teamLevel,
          wins: 0,
          losses: 0,
          ties: 0,
          totalMatches: 0
        }
      }

      // Update stats
      teamStats[homeKey].totalMatches++
      teamStats[awayKey].totalMatches++

      if (match.winner === 'home') {
        teamStats[homeKey].wins++
        teamStats[awayKey].losses++
      } else if (match.winner === 'away') {
        teamStats[awayKey].wins++
        teamStats[homeKey].losses++
      } else {
        teamStats[homeKey].ties++
        teamStats[awayKey].ties++
      }
    })

    return Object.values(teamStats).map(stats => ({
      ...stats,
      winPercentage: stats.totalMatches > 0 ? stats.wins / stats.totalMatches : 0
    })).sort((a, b) => {
      // Sort by win percentage, then by total wins
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage
      }
      return b.wins - a.wins
    })
  }
}
