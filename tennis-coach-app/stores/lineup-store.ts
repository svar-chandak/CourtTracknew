'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Lineup, Player } from '@/lib/types'

interface LineupState {
  lineups: Lineup[]
  loading: boolean
  error: string | null
  loadLineups: (teamId: string) => Promise<void>
  createLineup: (lineupData: Omit<Lineup, 'id' | 'created_at'>) => Promise<void>
  updateLineup: (id: string, updates: Partial<Lineup>) => Promise<void>
  deleteLineup: (id: string) => Promise<void>
}

export const useLineupStore = create<LineupState>((set, get) => ({
  lineups: [],
  loading: false,
  error: null,

  loadLineups: async (teamId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('lineups')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ lineups: data || [], loading: false })
    } catch (error) {
      console.error('Error loading lineups:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to load lineups', loading: false })
    }
  },

  createLineup: async (lineupData) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('lineups')
        .insert([lineupData])

      if (error) throw error

      // Reload lineups after creating
      const { lineups } = get()
      if (lineups.length > 0) {
        await get().loadLineups(lineupData.team_id)
      }
      
      set({ loading: false })
    } catch (error) {
      console.error('Error creating lineup:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to create lineup', loading: false })
    }
  },

  updateLineup: async (id: string, updates: Partial<Lineup>) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('lineups')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Update local state
      set(state => ({
        lineups: state.lineups.map(lineup => 
          lineup.id === id ? { ...lineup, ...updates } : lineup
        ),
        loading: false
      }))
    } catch (error) {
      console.error('Error updating lineup:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to update lineup', loading: false })
    }
  },

  deleteLineup: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('lineups')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      set(state => ({
        lineups: state.lineups.filter(lineup => lineup.id !== id),
        loading: false
      }))
    } catch (error) {
      console.error('Error deleting lineup:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to delete lineup', loading: false })
    }
  }
}))
