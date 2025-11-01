'use client'

import type {
  TournamentPlayer,
  SchoolGroup,
  BracketSlot,
  BracketMatch,
  TwoSidedBracket,
  BracketRound,
  ValidationWarning
} from './player-tournament-types'

export class PlayerTournamentEngine {
  /**
   * Group players by school and calculate average UTR per school
   */
  static groupPlayersBySchool(players: TournamentPlayer[]): SchoolGroup[] {
    const schoolMap = new Map<string, TournamentPlayer[]>()

    // Group by school
    players.forEach(player => {
      if (!schoolMap.has(player.school_name)) {
        schoolMap.set(player.school_name, [])
      }
      schoolMap.get(player.school_name)!.push(player)
    })

    // Calculate average UTR for each school
    const schoolGroups: SchoolGroup[] = Array.from(schoolMap.entries()).map(([schoolName, schoolPlayers]) => {
      const validUtrs = schoolPlayers
        .map(p => p.utr_rating)
        .filter((utr): utr is number => utr !== null && utr !== undefined && !isNaN(utr))

      const averageUtr = validUtrs.length > 0
        ? validUtrs.reduce((sum, utr) => sum + utr, 0) / validUtrs.length
        : 0

      return {
        school_name: schoolName,
        players: schoolPlayers,
        average_utr: averageUtr,
        total_players: schoolPlayers.length
      }
    })

    return schoolGroups
  }

  /**
   * Sort school groups by average UTR (for balanced seeding)
   */
  static sortSchoolsByUtr(schools: SchoolGroup[], descending: boolean = true): SchoolGroup[] {
    return [...schools].sort((a, b) => {
      if (descending) {
        return b.average_utr - a.average_utr
      }
      return a.average_utr - b.average_utr
    })
  }

  /**
   * Build two pools by alternating schools
   * Goal: Even distribution and avoid same school collisions
   */
  static buildTwoPools(schoolGroups: SchoolGroup[]): {
    poolA: TournamentPlayer[]
    poolB: TournamentPlayer[]
    poolASchools: string[]
    poolBSchools: string[]
  } {
    const sortedSchools = this.sortSchoolsByUtr(schoolGroups)
    const poolA: TournamentPlayer[] = []
    const poolB: TournamentPlayer[] = []
    const poolASchools: string[] = []
    const poolBSchools: string[] = []

    sortedSchools.forEach((schoolGroup, index) => {
      // Alternate schools between pools
      if (index % 2 === 0) {
        poolA.push(...schoolGroup.players)
        poolASchools.push(schoolGroup.school_name)
      } else {
        poolB.push(...schoolGroup.players)
        poolBSchools.push(schoolGroup.school_name)
      }
    })

    return { poolA, poolB, poolASchools, poolBSchools }
  }

  /**
   * Shuffle players within a pool (Fisher-Yates)
   */
  static shufflePool<T>(pool: T[]): T[] {
    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Pair players in a pool for round one, avoiding same school matches
   */
  static pairPlayersForRoundOne(
    pool: TournamentPlayer[],
    poolSide: 'A' | 'B',
    avoidSameSchool: boolean = true
  ): { matches: BracketMatch[], slots: BracketSlot[] } {
    const shuffled = this.shufflePool(pool)
    const matches: BracketMatch[] = []
    const slots: BracketSlot[] = []
    const tournamentId = shuffled[0]?.tournament_id || ''

    let matchNumber = 1
    let slotNumber = 1

    // Create pairs
    for (let i = 0; i < shuffled.length; i += 2) {
      const player1 = shuffled[i]
      const player2 = shuffled[i + 1]

      if (!player2) {
        // Odd number - player1 gets a bye
        const slot1: BracketSlot = {
          id: `${tournamentId}-slot-${slotNumber}`,
          tournament_id: tournamentId,
          round_number: 1,
          slot_number: slotNumber,
          pool_side: poolSide,
          player_id: player1.player_id,
          school_name: player1.school_name,
          utr_rating: player1.utr_rating,
          is_locked: false,
          created_at: new Date().toISOString()
        }
        slots.push(slot1)

        const match: BracketMatch = {
          id: `${tournamentId}-match-1-${matchNumber}`,
          tournament_id: tournamentId,
          round_number: 1,
          match_number: matchNumber,
          pool_side: poolSide,
          slot_id_1: slot1.id,
          player1_id: player1.player_id,
          player1_school: player1.school_name,
          winner_player_id: player1.player_id, // Bye = automatic win
          status: 'bye',
          created_at: new Date().toISOString()
        }
        matches.push(match)
        slotNumber++
        matchNumber++
        break
      }

      // Check for same school conflict
      const isSameSchool = avoidSameSchool && player1.school_name === player2.school_name

      const slot1: BracketSlot = {
        id: `${tournamentId}-slot-${slotNumber}`,
        tournament_id: tournamentId,
        round_number: 1,
        slot_number: slotNumber,
        pool_side: poolSide,
        player_id: player1.player_id,
        school_name: player1.school_name,
        utr_rating: player1.utr_rating,
        is_locked: false,
        created_at: new Date().toISOString()
      }
      slots.push(slot1)
      slotNumber++

      const slot2: BracketSlot = {
        id: `${tournamentId}-slot-${slotNumber}`,
        tournament_id: tournamentId,
        round_number: 1,
        slot_number: slotNumber,
        pool_side: poolSide,
        player_id: player2.player_id,
        school_name: player2.school_name,
        utr_rating: player2.utr_rating,
        is_locked: false,
        created_at: new Date().toISOString()
      }
      slots.push(slot2)
      slotNumber++

      const match: BracketMatch = {
        id: `${tournamentId}-match-1-${matchNumber}`,
        tournament_id: tournamentId,
        round_number: 1,
        match_number: matchNumber,
        pool_side: poolSide,
        slot_id_1: slot1.id,
        slot_id_2: slot2.id,
        player1_id: player1.player_id,
        player2_id: player2.player_id,
        player1_school: player1.school_name,
        player2_school: player2.school_name,
        status: isSameSchool ? 'pending' : 'pending', // Will be highlighted as warning
        created_at: new Date().toISOString()
      }
      matches.push(match)
      matchNumber++
    }

    return { matches, slots }
  }

  /**
   * Attempt to swap players across pools to resolve same-school conflicts
   */
  static resolveSameSchoolConflicts(
    poolA: TournamentPlayer[],
    poolB: TournamentPlayer[],
    poolASchools: string[],
    poolBSchools: string[]
  ): { poolA: TournamentPlayer[], poolB: TournamentPlayer[] } {
    // Find schools that appear in both pools
    const conflictSchools = poolASchools.filter(school => poolBSchools.includes(school))

    if (conflictSchools.length === 0) {
      return { poolA, poolB }
    }

    // Try to swap players to balance
    const newPoolA = [...poolA]
    const newPoolB = [...poolB]

    conflictSchools.forEach(school => {
      const aPlayers = newPoolA.filter(p => p.school_name === school)
      const bPlayers = newPoolB.filter(p => p.school_name === school)

      // If both pools have players from same school, try to swap
      if (aPlayers.length > 0 && bPlayers.length > 0) {
        // Move one player from pool A to pool B if it helps balance
        if (aPlayers.length > bPlayers.length && aPlayers.length > 1) {
          const toMove = aPlayers[0]
          newPoolA.splice(newPoolA.indexOf(toMove), 1)
          newPoolB.push(toMove)
        } else if (bPlayers.length > aPlayers.length && bPlayers.length > 1) {
          const toMove = bPlayers[0]
          newPoolB.splice(newPoolB.indexOf(toMove), 1)
          newPoolA.push(toMove)
        }
      }
    })

    return { poolA: newPoolA, poolB: newPoolB }
  }

  /**
   * Generate initial two-sided bracket structure
   */
  static generateInitialBracket(
    players: TournamentPlayer[],
    tournamentId: string,
    avoidSameSchool: boolean = true
  ): TwoSidedBracket {
    // Step 1: Group by school
    const schoolGroups = this.groupPlayersBySchool(players)

    // Step 2: Build two pools
    const { poolA, poolB, poolASchools, poolBSchools } = this.buildTwoPools(schoolGroups)

    // Step 3: Resolve conflicts
    if (avoidSameSchool) {
      const resolved = this.resolveSameSchoolConflicts(poolA, poolB, poolASchools, poolBSchools)
      poolA = resolved.poolA
      poolB = resolved.poolB
    }

    // Step 4: Pair players in each pool for round 1
    const poolAResults = this.pairPlayersForRoundOne(poolA, 'A', avoidSameSchool)
    const poolBResults = this.pairPlayersForRoundOne(poolB, 'B', avoidSameSchool)

    // Step 5: Calculate rounds needed
    const maxPlayersPerPool = Math.max(poolA.length, poolB.length)
    const roundsNeeded = Math.ceil(Math.log2(maxPlayersPerPool))

    // Step 6: Create bracket structure
    const poolARounds: BracketRound[] = [{
      round_number: 1,
      slots: poolAResults.slots,
      matches: poolAResults.matches
    }]

    const poolBRounds: BracketRound[] = [{
      round_number: 1,
      slots: poolBResults.slots,
      matches: poolBResults.matches
    }]

    // Create empty slots for future rounds
    for (let round = 2; round <= roundsNeeded; round++) {
      const aSlots = this.createEmptyRoundSlots(tournamentId, round, 'A', Math.ceil(poolA.length / Math.pow(2, round - 1)))
      const bSlots = this.createEmptyRoundSlots(tournamentId, round, 'B', Math.ceil(poolB.length / Math.pow(2, round - 1)))

      poolARounds.push({
        round_number: round,
        slots: aSlots,
        matches: []
      })

      poolBRounds.push({
        round_number: round,
        slots: bSlots,
        matches: []
      })
    }

    return {
      tournament_id: tournamentId,
      pool_a: { rounds: poolARounds },
      pool_b: { rounds: poolBRounds },
      is_locked: false,
      total_players: players.length
    }
  }

  /**
   * Create empty slots for a round
   */
  private static createEmptyRoundSlots(
    tournamentId: string,
    roundNumber: number,
    poolSide: 'A' | 'B',
    count: number
  ): BracketSlot[] {
    const slots: BracketSlot[] = []
    for (let i = 1; i <= count; i++) {
      slots.push({
        id: `${tournamentId}-slot-${poolSide}-${roundNumber}-${i}`,
        tournament_id: tournamentId,
        round_number: roundNumber,
        slot_number: i,
        pool_side: poolSide,
        is_locked: false,
        created_at: new Date().toISOString()
      })
    }
    return slots
  }

  /**
   * Validate drag-drop operation
   */
  static validateSlotChange(
    slot: BracketSlot,
    newPlayer: TournamentPlayer,
    allSlots: BracketSlot[],
    allMatches: BracketMatch[],
    roundNumber: number
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = []

    // Check for same school in round 1
    if (roundNumber === 1) {
      const round1Matches = allMatches.filter(m => m.round_number === 1 && m.pool_side === slot.pool_side)
      const opponentMatch = round1Matches.find(m => 
        (m.slot_id_1 === slot.id || m.slot_id_2 === slot.id) &&
        m.player1_school !== newPlayer.school_name &&
        m.player2_school !== newPlayer.school_name
      )

      if (opponentMatch) {
        const opponentSchool = opponentMatch.player1_school === newPlayer.school_name 
          ? opponentMatch.player2_school 
          : opponentMatch.player1_school

        if (opponentSchool === newPlayer.school_name) {
          warnings.push({
            type: 'same_school_round1',
            message: `Warning: Same school match in round 1 (${newPlayer.school_name})`,
            slot_ids: [slot.id],
            severity: 'error'
          })
        }
      }
    }

    // Check for UTR imbalance
    const poolSlots = allSlots.filter(s => s.pool_side === slot.pool_side && s.round_number === roundNumber)
    const poolUtrs = poolSlots
      .map(s => s.utr_rating || s.player?.utr_rating)
      .filter((utr): utr is number => utr !== null && utr !== undefined)

    if (poolUtrs.length > 0) {
      const avgUtr = poolUtrs.reduce((sum, utr) => sum + utr, 0) / poolUtrs.length
      const newUtr = newPlayer.utr_rating || 0
      
      if (Math.abs(newUtr - avgUtr) > 3) { // Threshold of 3 UTR points
        warnings.push({
          type: 'utr_imbalance',
          message: `Warning: Significant UTR difference (${newUtr.toFixed(1)} vs pool avg ${avgUtr.toFixed(1)})`,
          slot_ids: [slot.id],
          severity: 'warning'
        })
      }
    }

    return warnings
  }

  /**
   * Progress winner to next round
   */
  static progressWinner(
    match: BracketMatch,
    winnerId: string,
    bracket: TwoSidedBracket
  ): TwoSidedBracket {
    if (!match.pool_side || match.round_number < 1) {
      return bracket
    }

    const pool = match.pool_side === 'A' ? bracket.pool_a : bracket.pool_b
    const currentRound = pool.rounds.find(r => r.round_number === match.round_number)
    const nextRound = pool.rounds.find(r => r.round_number === match.round_number + 1)

    if (!currentRound || !nextRound) {
      return bracket
    }

    // Update match status
    const updatedMatch = {
      ...match,
      winner_player_id: winnerId,
      status: 'completed' as const
    }

    // Find next available slot in next round
    const emptySlot = nextRound.slots.find(s => !s.player_id)

    if (emptySlot) {
      const winnerPlayer = match.player1_id === winnerId 
        ? { player_id: match.player1_id, school_name: match.player1_school, utr_rating: 0 }
        : { player_id: match.player2_id, school_name: match.player2_school, utr_rating: 0 }

      const updatedSlot: BracketSlot = {
        ...emptySlot,
        player_id: winnerPlayer.player_id,
        school_name: winnerPlayer.school_name,
        utr_rating: winnerPlayer.utr_rating
      }

      // Update bracket
      const updatedBracket = { ...bracket }
      const poolToUpdate = match.pool_side === 'A' ? updatedBracket.pool_a : updatedBracket.pool_b
      const roundToUpdate = poolToUpdate.rounds.find(r => r.round_number === match.round_number)!
      const nextRoundToUpdate = poolToUpdate.rounds.find(r => r.round_number === match.round_number + 1)!

      roundToUpdate.matches = roundToUpdate.matches.map(m => m.id === match.id ? updatedMatch : m)
      nextRoundToUpdate.slots = nextRoundToUpdate.slots.map(s => s.id === emptySlot.id ? updatedSlot : s)

      return updatedBracket
    }

    return bracket
  }

  /**
   * Calculate school average UTR
   */
  static calculateSchoolAverageUtr(players: TournamentPlayer[], schoolName: string): number {
    const schoolPlayers = players.filter(p => p.school_name === schoolName)
    const validUtrs = schoolPlayers
      .map(p => p.utr_rating)
      .filter((utr): utr is number => utr !== null && utr !== undefined && !isNaN(utr))

    if (validUtrs.length === 0) return 0

    return validUtrs.reduce((sum, utr) => sum + utr, 0) / validUtrs.length
  }
}

