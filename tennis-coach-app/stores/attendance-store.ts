'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Attendance, PracticeSession, AttendanceStatus, EventType } from '@/lib/types'

interface AttendanceState {
  attendance: Attendance[]
  practiceSessions: PracticeSession[]
  loading: boolean
  error: string | null
  
  getAttendance: (teamId: string, startDate?: string, endDate?: string) => Promise<void>
  getPracticeSessions: (teamId: string) => Promise<void>
  createPracticeSession: (session: Omit<PracticeSession, 'id' | 'created_at'>) => Promise<{ error: string | null }>
  recordAttendance: (attendance: Omit<Attendance, 'id' | 'created_at'>) => Promise<{ error: string | null }>
  updateAttendance: (id: string, status: AttendanceStatus, notes?: string) => Promise<{ error: string | null }>
  deletePracticeSession: (id: string) => Promise<{ error: string | null }>
  getAttendanceForEvent: (eventType: EventType, eventId: string) => Promise<Attendance[]>
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendance: [],
  practiceSessions: [],
  loading: false,
  error: null,

  getAttendance: async (teamId: string, startDate?: string, endDate?: string) => {
    set({ loading: true, error: null })
    
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          player:players(*),
          team:teams(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error } = await query

      if (error) {
        set({ error: error.message, loading: false })
        return
      }

      set({ attendance: data || [], loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch attendance', loading: false })
    }
  },

  getPracticeSessions: async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('team_id', teamId)
        .order('practice_date', { ascending: false })

      if (error) {
        console.error('Error fetching practice sessions:', error)
        set({ error: error.message })
        return
      }

      set({ practiceSessions: data || [] })
    } catch (error) {
      console.error('Failed to fetch practice sessions:', error)
      set({ error: 'Failed to fetch practice sessions' })
    }
  },

  createPracticeSession: async (session) => {
    try {
      const { error } = await supabase
        .from('practice_sessions')
        .insert(session)

      if (error) {
        return { error: error.message }
      }

      // Refresh practice sessions
      if (session.team_id) {
        await get().getPracticeSessions(session.team_id)
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to create practice session' }
    }
  },

  recordAttendance: async (attendance) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert(attendance)

      if (error) {
        return { error: error.message }
      }

      // Refresh attendance
      if (attendance.team_id) {
        await get().getAttendance(attendance.team_id)
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to record attendance' }
    }
  },

  updateAttendance: async (id: string, status: AttendanceStatus, notes?: string) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({ status, notes })
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      // Update local state
      set(state => ({
        attendance: state.attendance.map(attendance =>
          attendance.id === id ? { ...attendance, status, notes } : attendance
        )
      }))

      return { error: null }
    } catch (error) {
      return { error: 'Failed to update attendance' }
    }
  },

  deletePracticeSession: async (id: string) => {
    try {
      const { error } = await supabase
        .from('practice_sessions')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      // Update local state
      set(state => ({
        practiceSessions: state.practiceSessions.filter(session => session.id !== id)
      }))

      return { error: null }
    } catch (error) {
      return { error: 'Failed to delete practice session' }
    }
  },

  getAttendanceForEvent: async (eventType: EventType, eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          player:players(*),
          team:teams(*)
        `)
        .eq('event_type', eventType)
        .eq('event_id', eventId)

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch attendance for event:', error)
      return []
    }
  }
}))
