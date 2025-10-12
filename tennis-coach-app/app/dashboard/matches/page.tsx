'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { useTeamMatchStore } from '@/stores/team-match-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateTeamMatchDialog } from '@/components/matches/create-team-match-dialog'
import { TeamMatchDetailsDialog } from '@/components/matches/team-match-details-dialog'
import { 
  Calendar, 
  Plus, 
  Trophy, 
  Clock, 
  Target, 
  Users,
  School,
  Award
} from 'lucide-react'
import type { TeamMatch, TeamMatchSummary } from '@/lib/team-match-types'

export default function MatchesPage() {
  const { coach } = useAuthStore()
  const { currentTeam, getCurrentTeam } = useTeamStore()
  const { 
    teamMatches, 
    loading, 
    getTeamMatches, 
    getTeamMatchSummary,
    deleteTeamMatch 
  } = useTeamMatchStore()
  
  const [showCreateMatchDialog, setShowCreateMatchDialog] = useState(false)
  const [showMatchDetailsDialog, setShowMatchDetailsDialog] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<TeamMatch | null>(null)
  const [summary, setSummary] = useState<TeamMatchSummary | null>(null)
  const [activeTeamLevel, setActiveTeamLevel] = useState<'varsity' | 'jv' | 'freshman'>('varsity')

  useEffect(() => {
    if (coach?.id) {
      getCurrentTeam(coach.id)
    }
  }, [coach, getCurrentTeam])

  useEffect(() => {
    if (currentTeam) {
      getTeamMatches(currentTeam.id)
      loadSummary()
    }
  }, [currentTeam, getTeamMatches])

  const loadSummary = async () => {
    if (currentTeam) {
      const summaryData = await getTeamMatchSummary(currentTeam.id)
      setSummary(summaryData)
    }
  }

  const handleCreateMatch = () => {
    setShowCreateMatchDialog(true)
  }

  const handleViewMatch = (match: TeamMatch) => {
    setSelectedMatch(match)
    setShowMatchDetailsDialog(true)
  }

  const handleDeleteMatch = async (matchId: string) => {
    const { error } = await deleteTeamMatch(matchId)
    if (!error) {
      loadSummary() // Refresh summary
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Trophy className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'cancelled':
        return <Target className="h-4 w-4 text-red-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTeamLevelMatches = (teamLevel: string) => {
    return teamMatches.filter(match => match.team_level === teamLevel)
  }

  const getUpcomingMatches = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return teamMatches.filter(match => 
      new Date(match.match_date) >= today && match.status === 'scheduled'
    )
  }

  const getCompletedMatches = () => {
    return teamMatches.filter(match => match.status === 'completed')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading team information...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="text-gray-600">Schedule and manage your team's matches</p>
        </div>
        <Button onClick={handleCreateMatch} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule Match
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Matches</p>
                  <p className="text-2xl font-bold">{summary.totalMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold">{summary.upcomingMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{summary.completedMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold">{summary.winRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Level Tabs */}
      <Tabs value={activeTeamLevel} onValueChange={(value) => setActiveTeamLevel(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="varsity">Varsity</TabsTrigger>
          <TabsTrigger value="jv">JV</TabsTrigger>
          <TabsTrigger value="freshman">Freshman</TabsTrigger>
        </TabsList>

        {(['varsity', 'jv', 'freshman'] as const).map(teamLevel => (
          <TabsContent key={teamLevel} value={teamLevel} className="space-y-6">
            {/* Upcoming Matches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming {teamLevel.charAt(0).toUpperCase() + teamLevel.slice(1)} Matches
                </CardTitle>
                <CardDescription>
                  Your scheduled {teamLevel} matches and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getTeamLevelMatches(teamLevel).filter(match => 
                  match.status === 'scheduled' && new Date(match.match_date) >= new Date()
                ).length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming matches</h3>
                    <p className="text-gray-600">Schedule your first {teamLevel} match to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getTeamLevelMatches(teamLevel)
                      .filter(match => match.status === 'scheduled' && new Date(match.match_date) >= new Date())
                      .map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            {getStatusIcon(match.status)}
                            <div>
                              <h4 className="font-medium">
                                {currentTeam.id === match.home_team_id ? 'vs' : '@'} {match.home_team_id === currentTeam.id ? match.away_team?.school_name : match.home_team?.school_name}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(match.match_date)}
                                </span>
                                {match.match_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatTime(match.match_time)}
                                  </span>
                                )}
                                {match.location && (
                                  <span className="flex items-center gap-1">
                                    <School className="h-4 w-4" />
                                    {match.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(match.status)}>
                              {match.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewMatch(match)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Match History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {teamLevel.charAt(0).toUpperCase() + teamLevel.slice(1)} Match History
                </CardTitle>
                <CardDescription>
                  Previous {teamLevel} matches and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getTeamLevelMatches(teamLevel).filter(match => 
                  match.status === 'completed' || match.status === 'cancelled'
                ).length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No match history</h3>
                    <p className="text-gray-600">Completed matches will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getTeamLevelMatches(teamLevel)
                      .filter(match => match.status === 'completed' || match.status === 'cancelled')
                      .map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            {getStatusIcon(match.status)}
                            <div>
                              <h4 className="font-medium">
                                {currentTeam.id === match.home_team_id ? 'vs' : '@'} {match.home_team_id === currentTeam.id ? match.away_team?.school_name : match.home_team?.school_name}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(match.match_date)}
                                </span>
                                {match.status === 'completed' && (
                                  <span className="flex items-center gap-1">
                                    <Award className="h-4 w-4" />
                                    {match.home_score} - {match.away_score}
                                    {match.winner && (
                                      <span className={`font-medium ${
                                        (match.winner === 'home' && match.home_team_id === currentTeam.id) ||
                                        (match.winner === 'away' && match.away_team_id === currentTeam.id)
                                          ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {match.winner === 'tie' ? 'Tie' : 
                                         (match.winner === 'home' && match.home_team_id === currentTeam.id) ||
                                         (match.winner === 'away' && match.away_team_id === currentTeam.id) ? 'W' : 'L'}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(match.status)}>
                              {match.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewMatch(match)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
      <CreateTeamMatchDialog
        open={showCreateMatchDialog}
        onOpenChange={setShowCreateMatchDialog}
        onMatchCreated={() => {
          loadSummary()
          setShowCreateMatchDialog(false)
        }}
      />

      {selectedMatch && (
        <TeamMatchDetailsDialog
          match={selectedMatch}
          open={showMatchDetailsDialog}
          onOpenChange={setShowMatchDetailsDialog}
          onMatchUpdated={() => {
            loadSummary()
            setShowMatchDetailsDialog(false)
          }}
          onMatchDeleted={() => {
            loadSummary()
            setShowMatchDetailsDialog(false)
          }}
        />
      )}
    </div>
  )
}