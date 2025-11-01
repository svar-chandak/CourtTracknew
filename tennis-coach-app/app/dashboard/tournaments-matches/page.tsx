'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { useTournamentStore } from '@/stores/tournament-store'
import { useTeamMatchStore } from '@/stores/team-match-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateTournamentDialog } from '@/components/tournaments/create-tournament-dialog'
import { JoinTournamentPlayerDialog } from '@/components/tournaments/join-tournament-player-dialog'
import { SimpleTournamentManager } from '@/components/tournaments/simple-tournament-manager'
import { CreateTeamMatchDialog } from '@/components/matches/create-team-match-dialog'
import { TeamMatchDetailsDialog } from '@/components/matches/team-match-details-dialog'
import { 
  Trophy, Plus, Users, Calendar, MapPin, Eye, Play, Clock, Target, School, Award
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Tournament } from '@/lib/types'
import type { TeamMatch, TeamMatchSummary } from '@/lib/team-match-types'

export default function TournamentsAndMatchesPage() {
  const { coach } = useAuthStore()
  const { currentTeam, getCurrentTeam } = useTeamStore()
  const { tournaments, loading: tournamentsLoading, getTournaments, getTournament } = useTournamentStore()
  const { 
    teamMatches, 
    loading: matchesLoading, 
    getTeamMatches, 
    getTeamMatchSummary,
    deleteTeamMatch 
  } = useTeamMatchStore()
  
  const [showCreateTournamentDialog, setShowCreateTournamentDialog] = useState(false)
  const [showJoinTournamentDialog, setShowJoinTournamentDialog] = useState(false)
  const [showCreateMatchDialog, setShowCreateMatchDialog] = useState(false)
  const [showMatchDetailsDialog, setShowMatchDetailsDialog] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<TeamMatch | null>(null)
  const [summary, setSummary] = useState<TeamMatchSummary | null>(null)
  const [activeTeamLevel, setActiveTeamLevel] = useState<'varsity' | 'jv' | 'freshman'>('varsity')
  const [activeTab, setActiveTab] = useState<'tournaments' | 'matches'>('tournaments')

  useEffect(() => {
    getTournaments()
  }, [getTournaments])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'full': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: Tournament['tournament_type']) => {
    switch (type) {
      case 'single_elimination': return 'Single Elimination'
      case 'round_robin': return 'Round Robin'
      case 'dual_match': return 'Dual Match'
      default: return type
    }
  }

  const isTeamInTournament = (tournament: Tournament) => {
    return tournament.teams?.some(team => team.team_id === currentTeam?.id)
  }

  const canJoinTournament = (tournament: Tournament) => {
    return tournament.status === 'open' && 
           !isTeamInTournament(tournament) && 
           (tournament.teams?.length || 0) < tournament.max_teams
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Trophy className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'cancelled':
        return <Target className="h-4 w-4 text-red-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-400" />
    }
  }

  const getTeamLevelMatches = (teamLevel: string) => {
    return teamMatches.filter(match => match.team_level === teamLevel)
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

  const handleViewMatch = (match: TeamMatch) => {
    setSelectedMatch(match)
    setShowMatchDetailsDialog(true)
  }

  const handleViewTournament = async (tournament: Tournament) => {
    // Load tournament into store so SimpleTournamentManager can access it
    await getTournament(tournament.tournament_code)
    setSelectedTournament(tournament)
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
          <h1 className="text-3xl font-bold text-gray-900">Tournaments & Matches</h1>
          <p className="text-gray-600 mt-1">
            Manage tournaments and schedule team matches
          </p>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'tournaments' ? (
            <>
              <Button variant="outline" onClick={() => setShowJoinTournamentDialog(true)}>
                Join Tournament
              </Button>
              <Button onClick={() => setShowCreateTournamentDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tournament
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowCreateMatchDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Match
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'tournaments' | 'matches')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="matches">Team Matches</TabsTrigger>
        </TabsList>

        {/* TOURNAMENTS TAB */}
        <TabsContent value="tournaments" className="space-y-6">
          {/* Tournament Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tournaments.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tournaments.filter(t => t.status === 'in_progress').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tournaments.filter(t => t.status === 'open').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tournaments</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tournaments.filter(t => t.creator_id === coach?.id).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tournaments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tournament.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {getTypeLabel(tournament.tournament_type)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(tournament.status)}>
                      {tournament.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{tournament.teams?.length || 0} / {tournament.max_teams} teams</span>
                    </div>
                    
                    {tournament.start_date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {tournament.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{tournament.location}</span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-600">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span>Code: {tournament.tournament_code}</span>
                    </div>
                  </div>

                  {tournament.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {tournament.description}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewTournament(tournament)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    {canJoinTournament(tournament) && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedTournament(tournament)
                          setShowJoinTournamentDialog(true)
                        }}
                      >
                        Join
                      </Button>
                    )}
                  </div>

                  {isTeamInTournament(tournament) && (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        You&apos;re in this tournament
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {tournaments.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments yet</h3>
              <p className="text-gray-600 mb-6">Create your first tournament or join an existing one</p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => setShowJoinTournamentDialog(true)}>
                  Join Tournament
                </Button>
                <Button onClick={() => setShowCreateTournamentDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* MATCHES TAB */}
        <TabsContent value="matches" className="space-y-6">
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
          <Tabs value={activeTeamLevel} onValueChange={(value) => setActiveTeamLevel(value as 'varsity' | 'jv' | 'freshman')}>
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
                            <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
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
                            <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
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
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTournamentDialog
        open={showCreateTournamentDialog}
        onOpenChange={setShowCreateTournamentDialog}
      />

      <JoinTournamentPlayerDialog
        open={showJoinTournamentDialog}
        onOpenChange={setShowJoinTournamentDialog}
        onJoined={(tournament) => {
          setShowJoinTournamentDialog(false)
          setSelectedTournament(tournament)
          getTournaments() // Refresh tournaments list
        }}
      />

      {selectedTournament && (
        <Dialog open={!!selectedTournament} onOpenChange={(open) => !open && setSelectedTournament(null)}>
          <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTournament.name}</DialogTitle>
            </DialogHeader>
            <SimpleTournamentManager
              tournamentId={selectedTournament.id}
              tournamentCode={selectedTournament.tournament_code}
            />
          </DialogContent>
        </Dialog>
      )}

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