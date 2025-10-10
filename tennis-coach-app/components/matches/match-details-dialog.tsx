'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Calendar, MapPin, Clock, Users, Plus } from 'lucide-react'
import { ScoreEntryDialog } from './score-entry-dialog'
import type { Match, TeamMatchDivision, Player } from '@/lib/types'

interface MatchDetailsDialogProps {
  match: Match | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MatchDetailsDialog({ match, open, onOpenChange }: MatchDetailsDialogProps) {
  const [divisions, setDivisions] = useState<TeamMatchDivision[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [showScoreEntry, setShowScoreEntry] = useState(false)

  useEffect(() => {
    if (match && open) {
      loadMatchDetails()
    }
  }, [match, open])

  const loadMatchDetails = async () => {
    if (!match) return

    setLoading(true)
    try {
      // Load match divisions
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('team_match_divisions')
        .select(`
          *,
          home_players:players!team_match_divisions_home_player_ids_fkey(*),
          away_players:players!team_match_divisions_away_player_ids_fkey(*)
        `)
        .eq('match_id', match.id)
        .order('position_number')

      if (divisionsError) {
        console.error('Error loading divisions:', divisionsError)
      } else {
        setDivisions(divisionsData || [])
      }

      // Load all players for both teams
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .or(`team_id.eq.${match.home_team_id},team_id.eq.${match.away_team_id}`)

      if (playersError) {
        console.error('Error loading players:', playersError)
      } else {
        setPlayers(playersData || [])
      }
    } catch (error) {
      console.error('Error loading match details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    return player ? player.name : 'Unknown Player'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDivisionColor = (division: string) => {
    switch (division) {
      case 'boys_singles': return 'bg-blue-100 text-blue-800'
      case 'girls_singles': return 'bg-pink-100 text-pink-800'
      case 'boys_doubles': return 'bg-blue-100 text-blue-800'
      case 'girls_doubles': return 'bg-pink-100 text-pink-800'
      case 'mixed_doubles': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!match) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Match Details
          </DialogTitle>
          <DialogDescription>
            {match.home_team?.school_name} vs {match.away_team?.school_name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Match Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Match Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(match.match_date).toLocaleDateString()}
                      </span>
                    </div>
                    {match.match_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{match.match_time}</span>
                      </div>
                    )}
                    {match.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{match.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(match.status)}>
                        {match.status}
                      </Badge>
                    </div>
                    {match.status === 'completed' && (
                      <div className="text-2xl font-bold">
                        {match.home_score} - {match.away_score}
                      </div>
                    )}
                  </div>
                </div>
                {match.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{match.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Match Divisions */}
            {divisions.length > 0 ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Match Results</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowScoreEntry(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Score
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {divisions.map((division) => (
                      <div key={division.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getDivisionColor(division.division)}>
                              {division.division.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              Position #{division.position_number}
                            </span>
                          </div>
                          {division.completed && (
                            <Badge variant={division.winner === 'home' ? 'default' : 'secondary'}>
                              {division.winner === 'home' ? 'Home Wins' : 'Away Wins'}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Home Team */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">
                              {match.home_team?.school_name}
                            </h4>
                            <div className="space-y-1">
                              {division.home_player_ids.map((playerId) => (
                                <div key={playerId} className="text-sm text-gray-600">
                                  {getPlayerName(playerId)}
                                </div>
                              ))}
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {division.home_sets_won}
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">
                              {match.away_team?.school_name}
                            </h4>
                            <div className="space-y-1">
                              {division.away_player_ids.map((playerId) => (
                                <div key={playerId} className="text-sm text-gray-600">
                                  {getPlayerName(playerId)}
                                </div>
                              ))}
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {division.away_sets_won}
                            </div>
                          </div>
                        </div>

                        {division.score_details && Object.keys(division.score_details).length > 0 && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <strong>Set Details:</strong>
                            <pre className="mt-1 text-xs">
                              {JSON.stringify(division.score_details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No match details</h3>
                  <p className="text-gray-600 mb-4">
                    Individual match results haven&apos;t been entered yet.
                  </p>
                  <Button onClick={() => setShowScoreEntry(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Enter First Score
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        {/* Score Entry Dialog */}
        <ScoreEntryDialog
          match={match}
          open={showScoreEntry}
          onOpenChange={setShowScoreEntry}
          onScoreEntered={() => {
            loadMatchDetails() // Refresh the match details
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
