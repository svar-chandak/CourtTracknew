'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { PlayerTournamentEngine } from '@/lib/player-tournament-engine'
import type {
  TournamentPlayer,
  SchoolGroup,
  BracketSlot,
  BracketMatch,
  TwoSidedBracket,
  TournamentSettings,
  CreateTournamentPlayerData,
  UpdateBracketSlotData,
  ValidationWarning
} from '@/lib/player-tournament-types'
import type { Player } from '@/lib/types'

interface PlayerTournamentState {
  tournamentPlayers: TournamentPlayer[]
  bracket: TwoSidedBracket | null
  bracketSlots: BracketSlot[]
  bracketMatches: BracketMatch[]
  tournamentSettings: TournamentSettings | null
  schoolGroups: SchoolGroup[]
  loading: boolean
  error: string | null

  // Tournament player actions
  getTournamentPlayers: (tournamentId: string) => Promise<void>
  joinTournamentWithCode: (tournamentCode: string, coachId: string) => Promise<{ error: string | null }>
  submitPlayers: (tournamentId: string, playerIds: string[], coachId: string, schoolName: string) => Promise<{ error: string | null }>
  removePlayer: (tournamentId: string, playerId: string) => Promise<{ error: string | null }>

  // Bracket actions
  getBracket: (tournamentId: string) => Promise<void>
  generateInitialBracket: (tournamentId: string) => Promise<{ error: string | null }>
  updateBracketSlot: (slotId: string, updates: UpdateBracketSlotData) => Promise<{ error: string | null }>
  lockBracket: (tournamentId: string, directorId: string) => Promise<{ error: string | null }>
  unlockBracket: (tournamentId: string) => Promise<{ error: string | null }>

  // Match actions
  getBracketMatches: (tournamentId: string) => Promise<void>
  updateBracketMatch: (matchId: string, winnerId: string, score: string) => Promise<{ error: string | null }>

  // Utility
  getSchoolGroups: (tournamentId: string) => Promise<void>
  getTournamentSettings: (tournamentId: string) => Promise<void>
}

export const usePlayerTournamentStore = create<PlayerTournamentState>((set, get) => ({
  tournamentPlayers: [],
  bracket: null,
  bracketSlots: [],
  bracketMatches: [],
  tournamentSettings: null,
  schoolGroups: [],
  loading: false,
  error: null,

  getTournamentPlayers: async (tournamentId: string) => {
    try {
      set({ loading: true, error: null })

      const { data, error } = await supabase
        .from('tournament_players')
        .select(`
          *,
          player:players(*),
          coach:coaches(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('joined_at', { ascending: true })

      if (error) {
        set({ error: error.message, loading: false })
        return
      }

      set({ tournamentPlayers: data || [], loading: false })

      // Update school groups
      if (data && data.length > 0) {
        const players: TournamentPlayer[] = data.map((tp: any) => ({
          id: tp.id,
          tournament_id: tp.tournament_id,
          player_id: tp.player_id,
          coach_id: tp.coach_id,
          school_name: tp.school_name,
          utr_rating: tp.utr_rating || tp.player?.utr_rating || 0,
          joined_at: tp.joined_at,
          player: tp.player,
          coach: tp.coach
        }))

        const schoolGroups = PlayerTournamentEngine.groupPlayersBySchool(players)
        set({ schoolGroups })
      }
    } catch (error) {
      set({ error: 'Failed to fetch tournament players', loading: false })
    }
  },

  joinTournamentWithCode: async (tournamentCode: string, coachId: string) => {
    try {
      // First get the tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('tournament_code', tournamentCode)
        .single()

      if (tournamentError || !tournament) {
        return { error: 'Tournament not found with that code' }
      }

      if (tournament.status !== 'open') {
        return { error: 'Tournament is not accepting new participants' }
      }

      // Get coach info for school name
      const { data: coach } = await supabase
        .from('coaches')
        .select('school_name')
        .eq('id', coachId)
        .single()

      if (!coach) {
        return { error: 'Coach not found' }
      }

      // Coach is now "joined" - they can submit players
      // We don't create a record here, just validate they can join
      // The actual join happens when they submit players

      return { error: null }
    } catch (error) {
      return { error: 'Failed to join tournament' }
    }
  },

  submitPlayers: async (
    tournamentId: string,
    playerIds: string[],
    coachId: string,
    schoolName: string
  ) => {
    try {
      // Get player details including UTR
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, utr_rating')
        .in('id', playerIds)

      if (playersError || !players || players.length === 0) {
        return { error: 'Failed to fetch player details' }
      }

      // Create tournament player entries
      const tournamentPlayers: CreateTournamentPlayerData[] = players.map(player => ({
        tournament_id: tournamentId,
        player_id: player.id,
        coach_id: coachId,
        school_name: schoolName,
        utr_rating: player.utr_rating || 0
      }))

      const { error } = await supabase
        .from('tournament_players')
        .upsert(tournamentPlayers, { onConflict: 'tournament_id,player_id' })

      if (error) {
        return { error: error.message }
      }

      // Refresh players list
      await get().getTournamentPlayers(tournamentId)

      return { error: null }
    } catch (error) {
      return { error: 'Failed to submit players' }
    }
  },

  removePlayer: async (tournamentId: string, playerId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_players')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)

      if (error) {
        return { error: error.message }
      }

      await get().getTournamentPlayers(tournamentId)
      return { error: null }
    } catch (error) {
      return { error: 'Failed to remove player' }
    }
  },

  getBracket: async (tournamentId: string) => {
    try {
      set({ loading: true, error: null })

      // Get slots
      const { data: slots, error: slotsError } = await supabase
        .from('tournament_bracket_slots')
        .select(`
          *,
          player:players(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('pool_side', { ascending: true })
        .order('slot_number', { ascending: true })

      if (slotsError) {
        set({ error: slotsError.message, loading: false })
        return
      }

      // Get matches
      const { data: matches, error: matchesError } = await supabase
        .from('tournament_bracket_matches')
        .select(`
          *,
          player1:players!player1_id(*),
          player2:players!player2_id(*),
          winner:players!winner_player_id(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true })

      if (matchesError) {
        set({ error: matchesError.message, loading: false })
        return
      }

      set({ bracketSlots: slots || [], bracketMatches: matches || [], loading: false })

      // Reconstruct bracket structure
      const bracket = reconstructBracketFromData(slots || [], matches || [], tournamentId)
      set({ bracket })
    } catch (error) {
      set({ error: 'Failed to fetch bracket', loading: false })
    }
  },

  generateInitialBracket: async (tournamentId: string) => {
    try {
      const { tournamentPlayers } = get()

      if (tournamentPlayers.length === 0) {
        await get().getTournamentPlayers(tournamentId)
      }

      const players: TournamentPlayer[] = get().tournamentPlayers.map(tp => ({
        id: tp.id,
        tournament_id: tp.tournament_id,
        player_id: tp.player_id,
        coach_id: tp.coach_id,
        school_name: tp.school_name,
        utr_rating: tp.utr_rating,
        joined_at: tp.joined_at
      }))

      if (players.length < 2) {
        return { error: 'Need at least 2 players to generate bracket' }
      }

      // Generate bracket structure
      const bracket = PlayerTournamentEngine.generateInitialBracket(players, tournamentId, true)

      // Clear existing bracket data
      await supabase.from('tournament_bracket_matches').delete().eq('tournament_id', tournamentId)
      await supabase.from('tournament_bracket_slots').delete().eq('tournament_id', tournamentId)

      // Save slots
      const allSlots: BracketSlot[] = [
        ...bracket.pool_a.rounds.flatMap(r => r.slots),
        ...bracket.pool_b.rounds.flatMap(r => r.slots)
      ]

      const slotsToInsert = allSlots.map(slot => ({
        tournament_id: slot.tournament_id,
        round_number: slot.round_number,
        slot_number: slot.slot_number,
        pool_side: slot.pool_side,
        player_id: slot.player_id,
        school_name: slot.school_name,
        utr_rating: slot.utr_rating,
        is_locked: slot.is_locked
      }))

      const { error: slotsError } = await supabase
        .from('tournament_bracket_slots')
        .insert(slotsToInsert)

      if (slotsError) {
        return { error: slotsError.message }
      }

      // Save matches
      const allMatches: BracketMatch[] = [
        ...bracket.pool_a.rounds.flatMap(r => r.matches),
        ...bracket.pool_b.rounds.flatMap(r => r.matches)
      ]

      const matchesToInsert = allMatches.map(match => ({
        tournament_id: match.tournament_id,
        round_number: match.round_number,
        match_number: match.match_number,
        pool_side: match.pool_side,
        slot_id_1: match.slot_id_1,
        slot_id_2: match.slot_id_2,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        player1_school: match.player1_school,
        player2_school: match.player2_school,
        winner_player_id: match.winner_player_id,
        score_summary: match.score_summary,
        status: match.status
      }))

      const { error: matchesError } = await supabase
        .from('tournament_bracket_matches')
        .insert(matchesToInsert)

      if (matchesError) {
        return { error: matchesError.message }
      }

      // Refresh bracket
      await get().getBracket(tournamentId)

      return { error: null }
    } catch (error) {
      return { error: 'Failed to generate bracket' }
    }
  },

  updateBracketSlot: async (slotId: string, updates: UpdateBracketSlotData) => {
    try {
      const { error } = await supabase
        .from('tournament_bracket_slots')
        .update(updates)
        .eq('id', slotId)

      if (error) {
        return { error: error.message }
      }

      // Get tournament_id to refresh
      const { data: slot } = await supabase
        .from('tournament_bracket_slots')
        .select('tournament_id')
        .eq('id', slotId)
        .single()

      if (slot) {
        await get().getBracket(slot.tournament_id)
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to update bracket slot' }
    }
  },

  lockBracket: async (tournamentId: string, directorId: string) => {
    try {
      // Update or create tournament settings
      const { error: settingsError } = await supabase
        .from('tournament_settings')
        .upsert({
          tournament_id: tournamentId,
          is_bracket_locked: true,
          bracket_locked_at: new Date().toISOString(),
          bracket_locked_by: directorId
        }, { onConflict: 'tournament_id' })

      if (settingsError) {
        return { error: settingsError.message }
      }

      // Lock all slots
      const { error: slotsError } = await supabase
        .from('tournament_bracket_slots')
        .update({ is_locked: true })
        .eq('tournament_id', tournamentId)

      if (slotsError) {
        return { error: slotsError.message }
      }

      await get().getTournamentSettings(tournamentId)
      await get().getBracket(tournamentId)

      return { error: null }
    } catch (error) {
      return { error: 'Failed to lock bracket' }
    }
  },

  unlockBracket: async (tournamentId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_settings')
        .update({
          is_bracket_locked: false,
          bracket_locked_at: null,
          bracket_locked_by: null
        })
        .eq('tournament_id', tournamentId)

      if (error) {
        return { error: error.message }
      }

      await get().getTournamentSettings(tournamentId)
      return { error: null }
    } catch (error) {
      return { error: 'Failed to unlock bracket' }
    }
  },

  getBracketMatches: async (tournamentId: string) => {
    await get().getBracket(tournamentId)
  },

  updateBracketMatch: async (matchId: string, winnerId: string, score: string) => {
    try {
      // Get match to find tournament_id
      const { data: match, error: matchError } = await supabase
        .from('tournament_bracket_matches')
        .select('tournament_id, round_number, pool_side')
        .eq('id', matchId)
        .single()

      if (matchError || !match) {
        return { error: 'Match not found' }
      }

      // Update match
      const { error } = await supabase
        .from('tournament_bracket_matches')
        .update({
          winner_player_id: winnerId,
          score_summary: score,
          status: 'completed'
        })
        .eq('id', matchId)

      if (error) {
        return { error: error.message }
      }

      // Progress winner to next round
      const { bracket } = get()
      if (bracket) {
        const bracketMatch = bracket.pool_a.rounds
          .concat(bracket.pool_b.rounds)
          .flatMap(r => r.matches)
          .find(m => m.id === matchId)

        if (bracketMatch) {
          const updatedBracket = PlayerTournamentEngine.progressWinner(
            bracketMatch,
            winnerId,
            bracket
          )

          // Save updated slots to DB
          const winnerSlot = updatedBracket.pool_a.rounds
            .concat(updatedBracket.pool_b.rounds)
            .flatMap(r => r.slots)
            .find(s => s.player_id === winnerId && s.round_number === match.round_number + 1)

          if (winnerSlot) {
            await supabase
              .from('tournament_bracket_slots')
              .update({
                player_id: winnerSlot.player_id,
                school_name: winnerSlot.school_name,
                utr_rating: winnerSlot.utr_rating
              })
              .eq('id', winnerSlot.id)
          }

          set({ bracket: updatedBracket })
        }
      }

      await get().getBracket(match.tournament_id)
      return { error: null }
    } catch (error) {
      return { error: 'Failed to update match' }
    }
  },

  getSchoolGroups: async (tournamentId: string) => {
    await get().getTournamentPlayers(tournamentId)
  },

  getTournamentSettings: async (tournamentId: string) => {
    try {
      const { data, error } = await supabase
        .from('tournament_settings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        set({ error: error.message })
        return
      }

      set({ tournamentSettings: data || null })
    } catch (error) {
      set({ error: 'Failed to fetch tournament settings' })
    }
  }
}))

// Helper to reconstruct bracket from database data
function reconstructBracketFromData(
  slots: any[],
  matches: any[],
  tournamentId: string
): TwoSidedBracket {
  const poolASlots = slots.filter((s: any) => s.pool_side === 'A')
  const poolBSlots = slots.filter((s: any) => s.pool_side === 'B')
  const poolAMatches = matches.filter((m: any) => m.pool_side === 'A')
  const poolBMatches = matches.filter((m: any) => m.pool_side === 'B')

  const maxRound = Math.max(
    ...slots.map((s: any) => s.round_number),
    ...matches.map((m: any) => m.round_number),
    1
  )

  const poolARounds = []
  const poolBRounds = []

  for (let round = 1; round <= maxRound; round++) {
    poolARounds.push({
      round_number: round,
      slots: poolASlots.filter((s: any) => s.round_number === round),
      matches: poolAMatches.filter((m: any) => m.round_number === round)
    })

    poolBRounds.push({
      round_number: round,
      slots: poolBSlots.filter((s: any) => s.round_number === round),
      matches: poolBMatches.filter((m: any) => m.round_number === round)
    })
  }

  return {
    tournament_id: tournamentId,
    pool_a: { rounds: poolARounds },
    pool_b: { rounds: poolBRounds },
    is_locked: false, // Will be set from settings
    total_players: new Set(slots.map((s: any) => s.player_id).filter(Boolean)).size
  }
}

