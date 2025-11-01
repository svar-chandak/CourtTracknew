'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'
import type { Announcement } from '@/lib/types'

interface AnnouncementState {
  announcements: Announcement[]
  loading: boolean
  error: string | null
  
  getAnnouncements: (teamId: string) => Promise<void>
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'created_at' | 'sent_at'>) => Promise<{ error: string | null }>
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<{ error: string | null }>
  deleteAnnouncement: (id: string) => Promise<{ error: string | null }>
  sendAnnouncement: (id: string) => Promise<{ error: string | null }>
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: [],
  loading: false,
  error: null,

  getAnnouncements: async (teamId: string) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          coach:coaches(*),
          team:teams(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (error) {
        set({ error: error.message, loading: false })
        return
      }

      set({ announcements: data || [], loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch announcements', loading: false })
    }
  },

  createAnnouncement: async (announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          ...announcement,
          sent_at: new Date().toISOString()
        })

      if (error) {
        return { error: error.message }
      }

      // Send push notification to team members
      try {
        const notificationService = NotificationService.getInstance()
        const title = announcement.is_urgent ? `🚨 URGENT: ${announcement.title}` : announcement.title
        await notificationService.sendNotification(title, {
          body: announcement.message,
          tag: `announcement-${announcement.team_id}`,
          requireInteraction: announcement.is_urgent,
        })
      } catch (notificationError) {
        console.warn('Failed to send push notification:', notificationError)
        // Don't fail the announcement creation if notification fails
      }

      // Refresh announcements
      if (announcement.team_id) {
        await get().getAnnouncements(announcement.team_id)
      }

      return { error: null }
    } catch (error) {
      return { error: 'Failed to create announcement' }
    }
  },

  updateAnnouncement: async (id: string, updates: Partial<Announcement>) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      // Update local state
      set(state => ({
        announcements: state.announcements.map(announcement =>
          announcement.id === id ? { ...announcement, ...updates } : announcement
        )
      }))

      return { error: null }
    } catch (error) {
      return { error: 'Failed to update announcement' }
    }
  },

  deleteAnnouncement: async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      // Update local state
      set(state => ({
        announcements: state.announcements.filter(announcement => announcement.id !== id)
      }))

      return { error: null }
    } catch (error) {
      return { error: 'Failed to delete announcement' }
    }
  },

  sendAnnouncement: async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      // Update local state
      set(state => ({
        announcements: state.announcements.map(announcement =>
          announcement.id === id 
            ? { ...announcement, sent_at: new Date().toISOString() }
            : announcement
        )
      }))

      return { error: null }
    } catch (error) {
      return { error: 'Failed to send announcement' }
    }
  }
}))
