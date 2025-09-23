'use client'

import type { Tournament, TournamentMatch, TournamentTeam, Team } from '@/lib/types'

export interface BracketMatch {
  id: string
  round: number
  matchNumber: number
  team1?: TournamentTeam
  team2?: TournamentTeam
  winner?: TournamentTeam
  score?: string
  status: 'pending' | 'in_progress' | 'completed'
  isBye: boolean
  nextMatchId?: string
  courtNumber?: number
  scheduledTime?: string
  completedAt?: string
}

export interface TournamentBracket {
  tournamentId: string
  matches: BracketMatch[]
  rounds: number
  totalMatches: number
  completedMatches: number
  currentRound: number
  isComplete: boolean
  winner?: TournamentTeam
}

export class TournamentEngine {
  /**
   * Generate bracket matches for a tournament
   */
  static generateBracket(tournament: Tournament, teams: TournamentTeam[]): BracketMatch[] {
    const numTeams = teams.length
    const numRounds = Math.ceil(Math.log2(numTeams))
    
    // Sort teams by seed (if provided) or randomly
    const seededTeams = this.seedTeams(teams)
    
    switch (tournament.tournament_type) {
      case 'single_elimination':
        return this.generateSingleEliminationBracket(seededTeams, tournament.id, numRounds)
      case 'double_elimination':
        return this.generateDoubleEliminationBracket(seededTeams, tournament.id, numRounds)
      case 'round_robin':
        return this.generateRoundRobinBracket(seededTeams, tournament.id)
      case 'swiss':
        return this.generateSwissBracket(seededTeams, tournament.id, numRounds)
      default:
        return this.generateSingleEliminationBracket(seededTeams, tournament.id, numRounds)
    }
  }

  /**
   * Seed teams based on their season records and UTR ratings
   */
  private static seedTeams(teams: TournamentTeam[]): TournamentTeam[] {
    return teams.sort((a, b) => {
      // If seeds are provided, use them
      if (a.seed_number && b.seed_number) {
        return a.seed_number - b.seed_number
      }

      // Otherwise, calculate seed based on team performance
      const aRecord = this.calculateTeamStrength(a.team)
      const bRecord = this.calculateTeamStrength(b.team)
      
      return bRecord - aRecord // Higher strength = better seed
    })
  }

  /**
   * Calculate team strength based on season record and player ratings
   */
  private static calculateTeamStrength(team?: Team): number {
    if (!team) return 0
    
    // Base strength from win percentage
    const totalGames = team.season_record_wins + team.season_record_losses
    const winPercentage = totalGames > 0 ? team.season_record_wins / totalGames : 0.5
    
    // Multiply by total games played (more games = more reliable rating)
    const reliabilityFactor = Math.min(totalGames / 10, 1) // Cap at 1.0
    
    return winPercentage * reliabilityFactor * 100
  }

  /**
   * Generate single elimination bracket
   */
  private static generateSingleEliminationBracket(
    teams: TournamentTeam[], 
    tournamentId: string, 
    numRounds: number
  ): BracketMatch[] {
    const matches: BracketMatch[] = []
    const numTeams = teams.length
    const bracketSize = Math.pow(2, numRounds)
    
    // First round - some teams get byes
    const firstRoundTeams = [...teams]
    const byes = bracketSize - numTeams
    
    let matchId = 1
    let currentRound = 1
    
    // Create first round matches
    for (let i = 0; i < bracketSize / 2; i++) {
      const team1 = firstRoundTeams[i * 2]
      const team2 = firstRoundTeams[i * 2 + 1]
      const isBye = !team2 || i < byes
      
      const match: BracketMatch = {
        id: `${tournamentId}-${currentRound}-${matchId}`,
        round: currentRound,
        matchNumber: matchId,
        team1,
        team2: isBye ? undefined : team2,
        status: isBye ? 'completed' : 'pending',
        isBye,
        winner: isBye ? team1 : undefined,
        completedAt: isBye ? new Date().toISOString() : undefined
      }
      
      matches.push(match)
      matchId++
    }
    
    // Create subsequent rounds
    let teamsInRound = bracketSize / 2
    currentRound++
    
    while (teamsInRound > 1) {
      matchId = 1
      
      for (let i = 0; i < teamsInRound / 2; i++) {
        const match: BracketMatch = {
          id: `${tournamentId}-${currentRound}-${matchId}`,
          round: currentRound,
          matchNumber: matchId,
          status: 'pending',
          isBye: false
        }
        
        matches.push(match)
        matchId++
      }
      
      teamsInRound = teamsInRound / 2
      currentRound++
    }
    
    // Link matches to their next rounds
    this.linkBracketMatches(matches, numRounds)
    
    return matches
  }

  /**
   * Generate double elimination bracket
   */
  private static generateDoubleEliminationBracket(
    teams: TournamentTeam[], 
    tournamentId: string, 
    numRounds: number
  ): BracketMatch[] {
    // Double elimination is more complex - for now, fall back to single elimination
    // In a full implementation, this would create both winners and losers brackets
    return this.generateSingleEliminationBracket(teams, tournamentId, numRounds)
  }

  /**
   * Generate round robin bracket
   */
  private static generateRoundRobinBracket(
    teams: TournamentTeam[], 
    tournamentId: string
  ): BracketMatch[] {
    const matches: BracketMatch[] = []
    let matchId = 1
    
    // Each team plays every other team
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const match: BracketMatch = {
          id: `${tournamentId}-rr-${matchId}`,
          round: 1,
          matchNumber: matchId,
          team1: teams[i],
          team2: teams[j],
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
   * Generate Swiss system bracket
   */
  private static generateSwissBracket(
    teams: TournamentTeam[], 
    tournamentId: string, 
    numRounds: number
  ): BracketMatch[] {
    const matches: BracketMatch[] = []
    let matchId = 1
    
    // Swiss system: teams are paired based on similar records
    for (let round = 1; round <= numRounds; round++) {
      const sortedTeams = [...teams].sort((a, b) => {
        const aScore = this.calculateSwissScore(a, matches)
        const bScore = this.calculateSwissScore(b, matches)
        return bScore - aScore
      })
      
      for (let i = 0; i < sortedTeams.length; i += 2) {
        if (i + 1 < sortedTeams.length) {
          const match: BracketMatch = {
            id: `${tournamentId}-swiss-${round}-${matchId}`,
            round,
            matchNumber: matchId,
            team1: sortedTeams[i],
            team2: sortedTeams[i + 1],
            status: 'pending',
            isBye: false
          }
          
          matches.push(match)
          matchId++
        }
      }
    }
    
    return matches
  }

  /**
   * Calculate Swiss system score for a team
   */
  private static calculateSwissScore(team: TournamentTeam, matches: BracketMatch[]): number {
    let score = 0
    let gamesPlayed = 0
    
    matches.forEach(match => {
      if (match.team1?.id === team.id || match.team2?.id === team.id) {
        if (match.status === 'completed' && match.winner?.id === team.id) {
          score += 1
        }
        gamesPlayed++
      }
    })
    
    return gamesPlayed > 0 ? score / gamesPlayed : 0
  }

  /**
   * Link bracket matches to their next rounds
   */
  private static linkBracketMatches(matches: BracketMatch[], numRounds: number): void {
    for (let round = 1; round < numRounds; round++) {
      const currentRoundMatches = matches.filter(m => m.round === round)
      const nextRoundMatches = matches.filter(m => m.round === round + 1)
      
      currentRoundMatches.forEach((match, index) => {
        const nextMatchIndex = Math.floor(index / 2)
        if (nextMatchIndex < nextRoundMatches.length) {
          match.nextMatchId = nextRoundMatches[nextMatchIndex].id
        }
      })
    }
  }

  /**
   * Update match result and progress bracket
   */
  static updateMatchResult(
    matches: BracketMatch[], 
    matchId: string, 
    winner: TournamentTeam, 
    score: string
  ): BracketMatch[] {
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
    
    // Progress winner to next round
    const match = updatedMatches[matchIndex]
    if (match.nextMatchId) {
      const nextMatchIndex = updatedMatches.findIndex(m => m.id === match.nextMatchId)
      if (nextMatchIndex !== -1) {
        const nextMatch = updatedMatches[nextMatchIndex]
        
        // Determine which position the winner goes to in the next match
        if (!nextMatch.team1) {
          updatedMatches[nextMatchIndex] = {
            ...nextMatch,
            team1: winner
          }
        } else if (!nextMatch.team2) {
          updatedMatches[nextMatchIndex] = {
            ...nextMatch,
            team2: winner
          }
        }
      }
    }
    
    return updatedMatches
  }

  /**
   * Get tournament bracket summary
   */
  static getBracketSummary(matches: BracketMatch[]): TournamentBracket {
    const rounds = Math.max(...matches.map(m => m.round))
    const totalMatches = matches.length
    const completedMatches = matches.filter(m => m.status === 'completed').length
    const currentRound = Math.min(...matches.filter(m => m.status === 'pending').map(m => m.round))
    const isComplete = completedMatches === totalMatches
    
    const winner = isComplete ? matches.find(m => m.round === rounds && m.winner)?.winner : undefined
    
    return {
      tournamentId: matches[0]?.id.split('-')[0] || '',
      matches,
      rounds,
      totalMatches,
      completedMatches,
      currentRound: isComplete ? rounds + 1 : currentRound,
      isComplete,
      winner
    }
  }

  /**
   * Get matches for a specific round
   */
  static getRoundMatches(matches: BracketMatch[], round: number): BracketMatch[] {
    return matches.filter(m => m.round === round).sort((a, b) => a.matchNumber - b.matchNumber)
  }

  /**
   * Get team's path through the bracket
   */
  static getTeamPath(matches: BracketMatch[], teamId: string): BracketMatch[] {
    const teamMatches: BracketMatch[] = []
    
    matches.forEach(match => {
      if ((match.team1?.id === teamId || match.team2?.id === teamId) && match.status === 'completed') {
        teamMatches.push(match)
      }
    })
    
    return teamMatches.sort((a, b) => a.round - b.round)
  }

  /**
   * Calculate tournament standings (for round robin/swiss)
   */
  static calculateStandings(matches: BracketMatch[], teams: TournamentTeam[]): Array<{
    team: TournamentTeam
    wins: number
    losses: number
    winPercentage: number
    gamesPlayed: number
  }> {
    return teams.map(team => {
      const teamMatches = matches.filter(m => 
        (m.team1?.id === team.id || m.team2?.id === team.id) && m.status === 'completed'
      )
      
      const wins = teamMatches.filter(m => m.winner?.id === team.id).length
      const losses = teamMatches.length - wins
      const gamesPlayed = teamMatches.length
      const winPercentage = gamesPlayed > 0 ? wins / gamesPlayed : 0
      
      return {
        team,
        wins,
        losses,
        winPercentage,
        gamesPlayed
      }
    }).sort((a, b) => {
      // Sort by win percentage, then by games played
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage
      }
      return b.gamesPlayed - a.gamesPlayed
    })
  }
}
