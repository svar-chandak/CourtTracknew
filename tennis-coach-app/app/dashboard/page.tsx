'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { useTournamentStore } from '@/stores/tournament-store'
import { useTeamMatchStore } from '@/stores/team-match-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Trophy, TrendingUp, Clock, Plus, UserPlus, MessageSquare, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { coach, loading: authLoading, getCurrentCoach } = useAuthStore()
  const { currentTeam, players, loading: teamLoading, getCurrentTeam, getPlayers } = useTeamStore()
  const { tournaments, loading: tournamentLoading, getTournaments } = useTournamentStore()
  const { teamMatches, getTeamMatches } = useTeamMatchStore()

  useEffect(() => {
    if (coach && coach.id) {
      getCurrentTeam(coach.id)
    }
  }, [coach, getCurrentTeam])

  useEffect(() => {
    if (currentTeam) {
      getPlayers(currentTeam.id)
      getTeamMatches(currentTeam.id)
    }
  }, [currentTeam, getPlayers, getTeamMatches])

  useEffect(() => {
    getTournaments()
  }, [getTournaments])

  if (authLoading || teamLoading || !coach) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!coach || !coach.id || !currentTeam) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to CourtTrack!</h2>
        <p className="text-gray-600 mb-6">Let&apos;s set up your team to get started.</p>
        <Link href="/dashboard/team">
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Set Up Team
          </Button>
        </Link>
      </div>
    )
  }

  const upcomingMatches = teamMatches.filter(match => 
    new Date(match.match_date) >= new Date() && match.status === 'scheduled'
  ).slice(0, 3)

  const recentTournaments = tournaments.slice(0, 3)
  const activeTournaments = tournaments.filter(t => t.status === 'in_progress').length
  const totalPlayers = players.length

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {coach.full_name}!
        </h1>
        <p className="text-green-100">
          {currentTeam.school_name} • Season Record: {currentTeam.season_record_wins}-{currentTeam.season_record_losses}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              Players on roster
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Matches scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTournaments}</div>
            <p className="text-xs text-muted-foreground">
              Tournaments in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentTeam.season_record_wins + currentTeam.season_record_losses > 0 
                ? Math.round((currentTeam.season_record_wins / (currentTeam.season_record_wins + currentTeam.season_record_losses)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              This season
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Today&apos;s Schedule
            </CardTitle>
            <CardDescription>
              Your upcoming matches and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        vs {match.home_team_id === currentTeam.id ? match.away_team?.school_name : match.home_team?.school_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(match.match_date).toLocaleDateString()}
                        {match.match_time && ` at ${match.match_time}`}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {match.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No matches scheduled today</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Recent Tournaments
            </CardTitle>
            <CardDescription>
              Latest tournament activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTournaments.length > 0 ? (
              <div className="space-y-3">
                {recentTournaments.map((tournament) => (
                  <div key={tournament.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{tournament.name}</p>
                      <p className="text-sm text-gray-600">
                        {tournament.teams?.length || 0} teams • {tournament.tournament_type}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tournament.status === 'open' ? 'bg-green-100 text-green-800' :
                      tournament.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tournament.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tournaments yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard/team">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </Link>
            <Link href="/dashboard/matches">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Match
              </Button>
            </Link>
            <Link href="/dashboard/tournaments">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create Tournament
              </Button>
            </Link>
            <Link href="/dashboard/announcements">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Announcement
              </Button>
            </Link>
            <Link href="/dashboard/attendance">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Record Attendance
              </Button>
            </Link>
            <Link href="/dashboard/lineups">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Create Lineup
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
