'use client'

import { useState, useEffect } from 'react'
import { useTournamentStore } from '@/stores/tournament-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Trophy, Users, Calendar, MapPin, Play, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { Tournament } from '@/lib/types'

interface TournamentBracketProps {
  tournament: Tournament
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TournamentBracket({ tournament, open, onOpenChange }: TournamentBracketProps) {
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false)
  const { coach } = useAuthStore()
  const { tournamentMatches, getTournamentMatches, generateBracket } = useTournamentStore()

  useEffect(() => {
    if (tournament && open) {
      getTournamentMatches(tournament.id)
    }
  }, [tournament, open, getTournamentMatches])

  const isCreator = coach?.id === tournament.creator_id
  const canGenerateBracket = isCreator && 
                            tournament.status === 'full' && 
                            (tournament.teams?.length || 0) >= 2

  const handleGenerateBracket = async () => {
    if (!canGenerateBracket) return

    setIsGeneratingBracket(true)
    try {
      const { error } = await generateBracket(tournament.id)
      
      if (error) {
        toast.error(error)
      } else {
        toast.success('Tournament bracket generated successfully!')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsGeneratingBracket(false)
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

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'full': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderSingleEliminationBracket = () => {
    const rounds = Math.ceil(Math.log2(tournament.teams?.length || 2))
    const matchesByRound: { [round: number]: typeof tournamentMatches } = {}

    tournamentMatches.forEach(match => {
      if (!matchesByRound[match.round_number]) {
        matchesByRound[match.round_number] = []
      }
      matchesByRound[match.round_number].push(match)
    })

    return (
      <div className="space-y-6">
        {Array.from({ length: rounds }, (_, i) => i + 1).map(round => (
          <div key={round}>
            <h3 className="text-lg font-semibold mb-4">Round {round}</h3>
            <div className="grid gap-4">
              {matchesByRound[round]?.map((match) => (
                <Card key={match.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{match.team1?.school_name || 'TBD'}</span>
                        <span className="text-gray-500">vs</span>
                        <span className="font-medium">{match.team2?.school_name || 'TBD'}</span>
                      </div>
                      {match.score_summary && (
                        <p className="text-sm text-gray-600 text-center">
                          Final: {match.score_summary}
                        </p>
                      )}
                      {match.winner_team && (
                        <p className="text-sm font-medium text-green-600 text-center">
                          Winner: {match.winner_team.school_name}
                        </p>
                      )}
                    </div>
                    <Badge className={getMatchStatusColor(match.status)}>
                      {match.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderRoundRobinBracket = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Matches</h3>
        <div className="grid gap-4">
          {tournamentMatches.map((match) => (
            <Card key={match.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{match.team1?.school_name || 'TBD'}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="font-medium">{match.team2?.school_name || 'TBD'}</span>
                  </div>
                  {match.score_summary && (
                    <p className="text-sm text-gray-600 text-center">
                      Final: {match.score_summary}
                    </p>
                  )}
                  {match.winner_team && (
                    <p className="text-sm font-medium text-green-600 text-center">
                      Winner: {match.winner_team.school_name}
                    </p>
                  )}
                </div>
                <Badge className={getMatchStatusColor(match.status)}>
                  {match.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{tournament.name}</span>
            <Badge className={getStatusColor(tournament.status)}>
              {tournament.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {getTypeLabel(tournament.tournament_type)} Tournament
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Tournament Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Tournament Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                <span>{tournament.teams?.length || 0} / {tournament.max_teams} teams joined</span>
              </div>
              
              {tournament.start_date && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Starts: {new Date(tournament.start_date).toLocaleDateString()}</span>
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

              {tournament.description && (
                <p className="text-sm text-gray-600 mt-3">
                  {tournament.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Participating Teams */}
          <Card>
            <CardHeader>
              <CardTitle>Participating Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tournament.teams?.map((team, index) => (
                  <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{team.team?.school_name}</p>
                      <p className="text-sm text-gray-600">#{team.team?.team_code}</p>
                    </div>
                    {team.seed_number && (
                      <Badge variant="outline">Seed {team.seed_number}</Badge>
                    )}
                  </div>
                ))}
              </div>
              
              {tournament.teams?.length === 0 && (
                <p className="text-gray-500 text-center py-4">No teams have joined yet</p>
              )}
            </CardContent>
          </Card>

          {/* Tournament Bracket */}
          {tournamentMatches.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tournament Bracket</span>
                  {isCreator && tournament.status === 'full' && tournamentMatches.length === 0 && (
                    <Button
                      onClick={handleGenerateBracket}
                      disabled={isGeneratingBracket}
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isGeneratingBracket ? 'Generating...' : 'Generate Bracket'}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tournament.tournament_type === 'single_elimination' && renderSingleEliminationBracket()}
                {tournament.tournament_type === 'round_robin' && renderRoundRobinBracket()}
                {tournament.tournament_type === 'dual_match' && (
                  <p className="text-gray-500 text-center py-4">Dual match format coming soon</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matches yet</h3>
                <p className="text-gray-600 mb-4">
                  {tournament.status === 'full' && isCreator 
                    ? 'Generate the bracket to start the tournament'
                    : 'Wait for the tournament to fill up and the bracket to be generated'
                  }
                </p>
                {canGenerateBracket && (
                  <Button onClick={handleGenerateBracket} disabled={isGeneratingBracket}>
                    <Play className="h-4 w-4 mr-2" />
                    {isGeneratingBracket ? 'Generating...' : 'Generate Bracket'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
