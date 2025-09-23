'use client'

import { useEffect } from 'react'
import { useAnnouncementStore } from '@/stores/announcement-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, MessageSquare, Calendar, AlertCircle, Clock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Announcement } from '@/lib/types'

interface AnnouncementsListProps {
  teamId: string
}

export function AnnouncementsList({ teamId }: AnnouncementsListProps) {
  const { announcements, loading, getAnnouncements, deleteAnnouncement } = useAnnouncementStore()

  useEffect(() => {
    if (teamId) {
      getAnnouncements(teamId)
    }
  }, [teamId, getAnnouncements])

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'match_reminder':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'practice_change':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-green-500" />
    }
  }

  const getAnnouncementColor = (type: string, isUrgent: boolean) => {
    if (isUrgent) return 'border-red-200 bg-red-50'
    
    switch (type) {
      case 'emergency':
        return 'border-red-200 bg-red-50'
      case 'match_reminder':
        return 'border-blue-200 bg-blue-50'
      case 'practice_change':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-green-200 bg-green-50'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'match_reminder':
        return 'Match Reminder'
      case 'practice_change':
        return 'Practice Change'
      case 'emergency':
        return 'Emergency'
      default:
        return 'General'
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      const { error } = await deleteAnnouncement(id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Announcement deleted')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {announcements.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
          <p className="text-gray-600">Send your first announcement to get started</p>
        </div>
      ) : (
        announcements.map((announcement) => (
          <Card key={announcement.id} className={`hover:shadow-md transition-shadow ${getAnnouncementColor(announcement.announcement_type, announcement.is_urgent)}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  {getAnnouncementIcon(announcement.announcement_type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-sm">{announcement.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(announcement.announcement_type)}
                      </Badge>
                      {announcement.is_urgent && (
                        <Badge variant="destructive" className="text-xs">
                          URGENT
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Sent {new Date(announcement.sent_at).toLocaleString()}
                        </span>
                      </div>
                      <span>by {announcement.coach?.full_name}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(announcement.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
