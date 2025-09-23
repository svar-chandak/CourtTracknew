'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { useAnnouncementStore } from '@/stores/announcement-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateAnnouncementDialog } from '@/components/announcements/create-announcement-dialog'
import { AnnouncementsList } from '@/components/announcements/announcements-list'
import { MessageSquare, Plus, Send } from 'lucide-react'

export default function AnnouncementsPage() {
  const { coach } = useAuthStore()
  const { currentTeam, getCurrentTeam } = useTeamStore()
  const { getAnnouncements, announcements } = useAnnouncementStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (coach?.id) {
      getCurrentTeam(coach.id)
    }
  }, [coach, getCurrentTeam])

  useEffect(() => {
    if (currentTeam) {
      getAnnouncements(currentTeam.id)
    }
  }, [currentTeam, getAnnouncements])

  const urgentAnnouncements = announcements.filter(a => a.is_urgent)
  const recentAnnouncements = announcements.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Announcements</h1>
          <p className="text-gray-600 mt-1">
            Send messages and updates to your team
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Messages</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentAnnouncements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent (Last 5)</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentAnnouncements.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Announcements */}
      {urgentAnnouncements.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Urgent Announcements</CardTitle>
            <CardDescription className="text-red-600">
              High priority messages that need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="border border-red-200 bg-white rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-red-900">{announcement.title}</h4>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      URGENT
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mb-2">{announcement.message}</p>
                  <div className="text-xs text-red-600">
                    Sent {new Date(announcement.sent_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
          <CardDescription>
            Complete history of team announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementsList teamId={currentTeam?.id || ''} />
        </CardContent>
      </Card>

      {/* Create Announcement Dialog */}
      {currentTeam && (
        <CreateAnnouncementDialog
          teamId={currentTeam.id}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  )
}
