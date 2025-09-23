'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Trophy, Users, Target, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { TournamentTeam } from '@/lib/types'
import type { BracketMatch } from '@/lib/tournament-engine'

interface LiveScoreInputProps {
  match: BracketMatch
  onScoreUpdate: (matchId: string, winner: TournamentTeam, score: string) => void
  onMatchStart: (matchId: string) => void
  onMatchComplete: (matchId: string) => void
  isReadOnly?: boolean
}

interface SetScore {
  team1: number
  team2: number
}

interface MatchScore {
  sets: SetScore[]
  currentSet: number
  team1Games: number
  team2Games: number
  team1Sets: number
  team2Sets: number
}

export function LiveScoreInput({ 
  match, 
  onScoreUpdate, 
  onMatchStart, 
  onMatchComplete,
  isReadOnly = false 
}: LiveScoreInputProps) {
  const [isStarted, setIsStarted] = useState(match.status === 'in_progress' || match.status === 'completed')
  const [score, setScore] = useState<MatchScore>({
    sets: [{ team1: 0, team2: 0 }],
    currentSet: 0,
    team1Games: 0,
    team2Games: 0,
    team1Sets: 0,
    team2Sets: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (match.score) {
      parseExistingScore(match.score)
    }
  }, [match.score])

  const parseExistingScore = (scoreString: string) => {
    // Parse existing score format: "6-4, 6-2" or "6-4 6-2"
    const sets = scoreString.split(/[,\s]+/).filter(s => s.includes('-'))
    const parsedSets: SetScore[] = sets.map(set => {
      const [t1, t2] = set.split('-').map(Number)
      return { team1: t1 || 0, team2: t2 || 0 }
    })

    if (parsedSets.length > 0) {
      const currentSet = parsedSets.length - 1
      const currentSetScore = parsedSets[currentSet]
      
      setScore({
        sets: parsedSets,
        currentSet,
        team1Games: currentSetScore.team1,
        team2Games: currentSetScore.team2,
        team1Sets: parsedSets.filter(s => s.team1 > s.team2).length,
        team2Sets: parsedSets.filter(s => s.team2 > s.team1).length
      })
    }
  }

  const startMatch = () => {
    setIsStarted(true)
    onMatchStart(match.id)
    toast.success('Match started!')
  }

  const updateGameScore = (team: 'team1' | 'team2', action: 'increment' | 'decrement') => {
    if (isReadOnly || !isStarted) return

    setScore(prev => {
      const newScore = { ...prev }
      
      if (action === 'increment') {
        newScore[team === 'team1' ? 'team1Games' : 'team2Games']++
      } else {
        const currentGames = team === 'team1' ? newScore.team1Games : newScore.team2Games
        if (currentGames > 0) {
          newScore[team === 'team1' ? 'team1Games' : 'team2Games']--
        }
      }

      return newScore
    })
  }

  const completeSet = () => {
    if (isReadOnly || !isStarted) return

    setScore(prev => {
      const newScore = { ...prev }
      
      // Add current games to the set
      newScore.sets[newScore.currentSet] = {
        team1: newScore.team1Games,
        team2: newScore.team2Games
      }

      // Determine set winner
      if (newScore.team1Games > newScore.team2Games) {
        newScore.team1Sets++
      } else {
        newScore.team2Sets++
      }

      // Check if match is complete (best of 3 sets)
      const setsToWin = 2
      if (newScore.team1Sets >= setsToWin || newScore.team2Sets >= setsToWin) {
        completeMatch(newScore)
        return newScore
      }

      // Start new set
      newScore.currentSet++
      newScore.sets.push({ team1: 0, team2: 0 })
      newScore.team1Games = 0
      newScore.team2Games = 0

      return newScore
    })
  }

  const completeMatch = (finalScore: MatchScore) => {
    if (isReadOnly) return

    const winner = finalScore.team1Sets > finalScore.team2Sets ? match.team1 : match.team2
    if (!winner) return

    setIsLoading(true)
    
    const scoreString = finalScore.sets
      .filter(set => set.team1 > 0 || set.team2 > 0)
      .map(set => `${set.team1}-${set.team2}`)
      .join(', ')

    onScoreUpdate(match.id, winner, scoreString)
    onMatchComplete(match.id)
    
    toast.success(`${winner.team?.school_name} wins!`)
    setIsLoading(false)
  }

  const resetCurrentSet = () => {
    if (isReadOnly || !isStarted) return

    setScore(prev => ({
      ...prev,
      team1Games: 0,
      team2Games: 0
    }))
  }

  const getMatchStatus = () => {
    if (match.status === 'completed') return 'completed'
    if (isStarted) return 'in_progress'
    return 'pending'
  }

  const getStatusColor = () => {
    const status = getMatchStatus()
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatScore = () => {
    if (score.team1Sets === 0 && score.team2Sets === 0 && score.team1Games === 0 && score.team2Games === 0) {
      return '0-0'
    }

    const setScores = score.sets
      .filter(set => set.team1 > 0 || set.team2 > 0)
      .map(set => `${set.team1}-${set.team2}`)
      .join(', ')

    const currentGames = ` ${score.team1Games}-${score.team2Games}`
    
    return setScores + (isStarted && getMatchStatus() !== 'completed' ? currentGames : '')
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {match.team1?.team?.school_name || 'TBD'} vs {match.team2?.team?.school_name || 'TBD'}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={getStatusColor()}>
                {getMatchStatus()}
              </Badge>
              <Badge variant="outline">
                Round {match.round}, Match {match.matchNumber}
              </Badge>
              {match.courtNumber && (
                <Badge variant="outline">
                  Court {match.courtNumber}
                </Badge>
              )}
            </div>
          </div>
          {match.scheduledTime && (
            <div className="text-right text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(match.scheduledTime).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Score Display */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            {formatScore()}
          </div>
          <div className="text-sm text-gray-600">
            {isStarted && getMatchStatus() !== 'completed' ? 'Current Set' : 'Final Score'}
          </div>
        </div>

        {/* Game Score Controls */}
        {isStarted && getMatchStatus() !== 'completed' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 Games */}
              <div className="text-center">
                <Label className="text-sm font-medium mb-2 block">
                  {match.team1?.team?.school_name}
                </Label>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateGameScore('team1', 'decrement')}
                    disabled={isReadOnly || score.team1Games === 0}
                  >
                    -
                  </Button>
                  <div className="text-2xl font-bold w-12">
                    {score.team1Games}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateGameScore('team1', 'increment')}
                    disabled={isReadOnly}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Team 2 Games */}
              <div className="text-center">
                <Label className="text-sm font-medium mb-2 block">
                  {match.team2?.team?.school_name}
                </Label>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateGameScore('team2', 'decrement')}
                    disabled={isReadOnly || score.team2Games === 0}
                  >
                    -
                  </Button>
                  <div className="text-2xl font-bold w-12">
                    {score.team2Games}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateGameScore('team2', 'increment')}
                    disabled={isReadOnly}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Set Management */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={completeSet}
                disabled={isReadOnly || (score.team1Games === 0 && score.team2Games === 0)}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Complete Set</span>
              </Button>
              <Button
                variant="outline"
                onClick={resetCurrentSet}
                disabled={isReadOnly}
              >
                Reset Set
              </Button>
            </div>
          </div>
        )}

        {/* Set History */}
        {score.sets.some(set => set.team1 > 0 || set.team2 > 0) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Set History</Label>
            <div className="grid grid-cols-3 gap-2">
              {score.sets.map((set, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600 mb-1">Set {index + 1}</div>
                  <div className="font-medium">
                    {set.team1}-{set.team2}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Controls */}
        <div className="flex justify-center">
          {!isStarted ? (
            <Button
              onClick={startMatch}
              disabled={isReadOnly || !match.team1 || !match.team2}
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Start Match</span>
            </Button>
          ) : getMatchStatus() === 'completed' ? (
            <div className="flex items-center space-x-2 text-green-600">
              <Trophy className="h-4 w-4" />
              <span>Match Complete - {match.winner?.team?.school_name} wins!</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Match in Progress</div>
              <div className="text-xs text-gray-500">
                {match.team1?.team?.school_name}: {score.team1Sets} sets | {match.team2?.team?.school_name}: {score.team2Sets} sets
              </div>
            </div>
          )}
        </div>

        {/* Match Details */}
        {(match.team1 || match.team2) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Team 1</div>
              <div className="font-medium">{match.team1?.team?.school_name || 'TBD'}</div>
              {match.team1?.team?.season_record_wins !== undefined && (
                <div className="text-xs text-gray-500">
                  {match.team1.team.season_record_wins}-{match.team1.team.season_record_losses} record
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Team 2</div>
              <div className="font-medium">{match.team2?.team?.school_name || 'TBD'}</div>
              {match.team2?.team?.season_record_wins !== undefined && (
                <div className="text-xs text-gray-500">
                  {match.team2.team.season_record_wins}-{match.team2.team.season_record_losses} record
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
