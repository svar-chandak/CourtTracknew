import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Coach } from '@/lib/types'

interface AuthState {
  coach: Coach | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, schoolName: string, phone?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  getCurrentCoach: () => Promise<void>
  updateProfile: (updates: Partial<Coach>) => Promise<{ error: string | null }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  coach: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { error: error.message }

      if (data.user) {
        await get().getCurrentCoach()
      }

      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  signUp: async (email: string, password: string, fullName: string, schoolName: string, phone?: string) => {
    try {
      // Generate unique 6-digit team code
      const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) return { error: error.message }

      if (data.user) {
        // Create coach record
        const { error: coachError } = await supabase
          .from('coaches')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            school_name: schoolName,
            team_code: teamCode,
            phone,
          })

        if (coachError) return { error: coachError.message }

        // Create team record
        const { error: teamError } = await supabase
          .from('teams')
          .insert({
            coach_id: data.user.id,
            team_code: teamCode,
            school_name: schoolName,
          })

        if (teamError) return { error: teamError.message }

        await get().getCurrentCoach()
      }

      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ coach: null })
  },

  getCurrentCoach: async () => {
    try {
      set({ loading: true })
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        set({ coach: null, loading: false })
        return
      }

      const { data: coach, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching coach:', error)
        set({ coach: null, loading: false })
        return
      }

      set({ coach, loading: false })
    } catch (error) {
      console.error('Error in getCurrentCoach:', error)
      set({ coach: null, loading: false })
    }
  },

  updateProfile: async (updates: Partial<Coach>) => {
    try {
      const { coach } = get()
      if (!coach) return { error: 'No coach found' }

      const { error } = await supabase
        .from('coaches')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coach.id)

      if (error) return { error: error.message }

      // Update local state
      set({ coach: { ...coach, ...updates } })
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },
}))
