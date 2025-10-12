'use client'

import { useState, useEffect } from 'react'
import { useTeamMatchStore } from '@/stores/team-match-store'
import { useTeamStore } from '@/stores/team-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IndividualPositionScoreInput } from '@/components/matches/individual-position-score-input'
import { 
  Trophy, 
  Clock, 
  Calendar, 
  School, 
  Users,
  Target,
  Award,
  Play,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { TeamMatch, IndividualPositionMatch } from '@/lib/team-match-types'

interface TeamMatchDetailsDialogProps {
  match: TeamMatch
  open: boolean
  onOpenChange: (open: boolean) => void
  onMatchUpdated: () => void
  onMatchDeleted: () => void
}

export function TeamMatchDetailsDialog({ 
  match, 
  open, 
  onOpenChange, 
  onMatchUpdated,
  onMatchDeleted 
}: TeamMatchDetailsDialogProps) {
  const [individualMatches, setIndividualMatches] = useState<IndividualPositionMatch[]>([])
  const [activeDivision, setActiveDivision] = useState<string>('boys_singles')
  const [isLoading, setIsLoading] = useState(false)
  const { getIndividualMatches, updateIndividualMatch, updateTeamMatch, deleteTeamMatch } = useTeamMatchStore()
  const { currentTeam } = useTeamStore()

  useEffect(() => {
    if (open && match) {
      loadIndividualMatches()
    }
  }, [open, match])

  const loadIndividualMatches = async () => {
    await getIndividualMatches(match.id)
    // Get the individual matches from the store
    const { individualMatches: matches } = useTeamMatchStore.getState()
    setIndividualMatches(matches)
  }

  const handleIndividualMatchUpdate = async (individualMatchId: string, winner: 'home' | 'away', score: string) => {
    setIsLoading(true)
    try {
      const { error } = await updateIndividualMatch(individualMatchId, {
        winner,
        score,
        status: 'completed'
      })

      if (error) {
        toast.error(error)
        return
      }

      // Reload individual matches to get updated data
      await loadIndividualMatches()
      onMatchUpdated()
      toast.success('Match result updated!')
    } catch (error) {
      toast.error('Failed to update match result')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartMatch = async () => {
    setIsLoading(true)
    try {
      const { error } = await updateTeamMatch(match.id, { status: 'in_progress' })
      if (error) {
        toast.error(error)
        return
      }
      onMatchUpdated()
      toast.success('Match started!')
    } catch (error) {
      toast.error('Failed to start match')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMatch = async () => {
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await deleteTeamMatch(match.id)
      if (error) {
        toast.error(error)
        return
      }
      onMatchDeleted()
      toast.success('Match deleted successfully')
    } catch (error) {
      toast.error('Failed to delete match')
    } finally {
      setIsLoading(false)
    }
  }

  const getDivisionMatches = (division: string) => {
    return individualMatches.filter(match => match.division === division)
      .sort((a, b) => a.position - b.position)
  }

  const getDivisionName = (division: string) => {
    const names: Record<string, string> = {
      'boys_singles': 'Boys Singles',
      'girls_singles': 'Girls Singles',
      'boys_doubles': 'Boys Doubles',
      'girls_doubles': 'Girls Doubles',
      'mixed_doubles': 'Mixed Doubles'
    }
    return names[division] || division
  }

  const getStatusIcon = () => {
    switch (match.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'cancelled':
        return <Target className="h-4 w-4 text-red-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (match.status) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isHomeTeam = currentTeam?.id === match.home_team_id
  const opponentName = isHomeTeam ? match.away_team?.school_name : match.home_team?.school_name
  const homeWins = individualMatches.filter(m => m.winner === 'home').length
  const awayWins = individualMatches.filter(m => m.winner === 'away').length
  const totalPositions = individualMatches.length
  const completedPositions = individualMatches.filter(m => m.status === 'completed').length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon()}
                {isHomeTeam ? 'vs' : '@'} {opponentName}
              </DialogTitle>
              <DialogDescription>
                {match.team_level.toUpperCase()} Team Match - {formatDate(match.match_date)}
                {match.match_time && ` at ${formatTime(match.match_time)}`}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor()}>
                {match.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {match.status === 'scheduled' && (
                <Button onClick={handleStartMatch} disabled={isLoading} size="sm">
                  <Play className="h-4 w-4 mr-1" />
                  Start Match
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{homeWins}</div>
              <div className="text-sm text-gray-600">{match.home_team?.school_name} Wins</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedPositions}</div>
              <div className="text-sm text-gray-600">Completed Positions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{awayWins}</div>
              <div className="text-sm text-gray-600">{match.away_team?.school_name} Wins</div>
            </div>
          </div>

          {/* Match Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <School className="h-4 w-4" />
                Match Details
              </h4>
              <div className="text-sm space-y-1">
                <div><strong>Date:</strong> {formatDate(match.match_date)}</div>
                {match.match_time && <div><strong>Time:</strong> {formatTime(match.match_time)}</div>}
                {match.location && <div><strong>Location:</strong> {match.location}</div>}
                <div><strong>Team Level:</strong> {match.team_level.toUpperCase()}</div>
                <div><strong>Total Positions:</strong> {totalPositions}</div>
              </div>
            </div>
            
            {match.notes && (
              <div className="space-y-2">
                <h4 className="font-medium">Notes</h4>
                <p className="text-sm text-gray-600">{match.notes}</p>
              </div>
            )}
          </div>

          {/* Individual Position Matches */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Individual Position Matches
            </h4>
            
            <Tabs value={activeDivision} onValueChange={setActiveDivision}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="boys_singles">Boys Singles</TabsTrigger>
                <TabsTrigger value="girls_singles">Girls Singles</TabsTrigger>
                <TabsTrigger value="boys_doubles">Boys Doubles</TabsTrigger>
                <TabsTrigger value="girls_doubles">Girls Doubles</TabsTrigger>
                <TabsTrigger value="mixed_doubles">Mixed Doubles</TabsTrigger>
              </TabsList>
              
              {['boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles'].map(division => (
                <TabsContent key={division} value={division} className="space-y-4">
                  <div className="grid gap-4">
                    {getDivisionMatches(division).map((individualMatch) => (
                      <IndividualPositionScoreInput
                        key={individualMatch.id}
                        match={individualMatch}
                        homeTeam={match.home_team!}
                        awayTeam={match.away_team!}
                        onScoreUpdate={handleIndividualMatchUpdate}
                        isReadOnly={match.status === 'completed' || match.status === 'cancelled'}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDeleteMatch}
              disabled={isLoading}
            >
              Delete Match
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
