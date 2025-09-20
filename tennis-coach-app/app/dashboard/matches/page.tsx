'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, MapPin, Clock, Users, Trophy } from 'lucide-react'
import { ScheduleMatchDialog } from '@/components/matches/schedule-match-dialog'
import Link from 'next/link'

export default function MatchesPage() {
  const { coach } = useAuthStore()
  const { currentTeam, matches, loading, getCurrentTeam, getMatches } = useTeamStore()
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  useEffect(() => {
    if (coach) {
      getCurrentTeam(coach.id)
    }
  }, [coach, getCurrentTeam])

  useEffect(() => {
    if (currentTeam) {
      getMatches(currentTeam.id)
    }
  }, [currentTeam, getMatches])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const upcomingMatches = matches.filter(match => 
    new Date(match.match_date) >= new Date() && match.status === 'scheduled'
  ).sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

  const pastMatches = matches.filter(match => 
    new Date(match.match_date) < new Date() || match.status === 'completed'
  ).sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage your team&apos;s matches
          </p>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Match
        </Button>
      </div>

      {/* Match Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMatches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches.filter(m => m.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentTeam ? Math.round((currentTeam.season_record_wins / Math.max(1, currentTeam.season_record_wins + currentTeam.season_record_losses)) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Matches</CardTitle>
          <CardDescription>
            Your scheduled matches and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming matches</h3>
              <p className="text-gray-600 mb-4">Schedule your first match to get started</p>
              <Button onClick={() => setShowScheduleDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Match
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-medium text-lg">
                          vs {match.home_team_id === currentTeam?.id ? match.away_team?.school_name : match.home_team?.school_name}
                        </h3>
                        <Badge className={getStatusColor(match.status)}>
                          {match.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(match.match_date).toLocaleDateString()}</span>
                        </div>
                        {match.match_time && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{match.match_time}</span>
                          </div>
                        )}
                        {match.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{match.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Match History</CardTitle>
          <CardDescription>
            Previous matches and results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastMatches.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No match history</h3>
              <p className="text-gray-600">Your completed matches will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastMatches.slice(0, 10).map((match) => (
                <div key={match.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-medium text-lg">
                          vs {match.home_team_id === currentTeam?.id ? match.away_team?.school_name : match.home_team?.school_name}
                        </h3>
                        <Badge className={getStatusColor(match.status)}>
                          {match.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(match.match_date).toLocaleDateString()}</span>
                        </div>
                        {match.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{match.location}</span>
                          </div>
                        )}
                      </div>
                      {match.status === 'completed' && (
                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-medium">
                            {match.home_score} - {match.away_score}
                          </span>
                          <Badge variant={match.home_team_id === currentTeam?.id ? 
                            (match.home_score > match.away_score ? 'default' : 'secondary') :
                            (match.away_score > match.home_score ? 'default' : 'secondary')
                          }>
                            {match.home_team_id === currentTeam?.id ? 
                              (match.home_score > match.away_score ? 'W' : 'L') :
                              (match.away_score > match.home_score ? 'W' : 'L')
                            }
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Match Dialog */}
      {currentTeam && (
        <ScheduleMatchDialog
          teamId={currentTeam.id}
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
        />
      )}
    </div>
  )
}
