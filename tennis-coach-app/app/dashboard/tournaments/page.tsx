'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { useTournamentStore } from '@/stores/tournament-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreateTournamentDialog } from '@/components/tournaments/create-tournament-dialog'
import { JoinTournamentDialog } from '@/components/tournaments/join-tournament-dialog'
import { TournamentBracket } from '@/components/tournaments/tournament-bracket'
import { Trophy, Plus, Users, Calendar, MapPin, Eye, Play } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Tournament } from '@/lib/types'

export default function TournamentsPage() {
  const { coach } = useAuthStore()
  const { currentTeam } = useTeamStore()
  const { tournaments, loading, getTournaments } = useTournamentStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)

  useEffect(() => {
    getTournaments()
  }, [getTournaments])

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'full': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
          <p className="text-gray-600 mt-1">
            Create and join collaborative tournaments with other coaches
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
            Join Tournament
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        </div>
      </div>

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
                  onClick={() => setSelectedTournament(tournament)}
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
                      setShowJoinDialog(true)
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
            <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
              Join Tournament
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tournament
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateTournamentDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}

      {showJoinDialog && (
        <JoinTournamentDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
          tournament={selectedTournament}
        />
      )}

      {selectedTournament && (
        <TournamentBracket
          tournament={selectedTournament}
          open={!!selectedTournament}
          onOpenChange={(open) => !open && setSelectedTournament(null)}
        />
      )}
    </div>
  )
}
