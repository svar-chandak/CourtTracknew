'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Trophy, Users, Target, CheckCircle, Play } from 'lucide-react'
import { toast } from 'sonner'
import type { IndividualMatch } from '@/lib/individual-tournament-engine'

interface IndividualScoreInputProps {
  match: IndividualMatch
  onScoreUpdate: (matchId: string, winner: 'home' | 'away', score: string) => void
  onMatchStart: (matchId: string) => void
  isReadOnly?: boolean
}

interface SetScore {
  home: number
  away: number
}

interface MatchScore {
  sets: SetScore[]
  currentSet: number
  homeGames: number
  awayGames: number
  homeSets: number
  awaySets: number
}

export function IndividualScoreInput({ 
  match, 
  onScoreUpdate, 
  onMatchStart,
  isReadOnly = false 
}: IndividualScoreInputProps) {
  const [isStarted, setIsStarted] = useState(match.status === 'in_progress' || match.status === 'completed')
  const [isLoading, setIsLoading] = useState(false)
  const [score, setScore] = useState<MatchScore>({
    sets: [{ home: 0, away: 0 }],
    currentSet: 0,
    homeGames: 0,
    awayGames: 0,
    homeSets: 0,
    awaySets: 0
  })

  const startMatch = () => {
    if (isReadOnly) return
    
    setIsStarted(true)
    onMatchStart(match.id)
    toast.success('Match started!')
  }

  const updateGameScore = (player: 'home' | 'away', action: 'increment' | 'decrement') => {
    if (isReadOnly || !isStarted || match.status === 'completed') return

    setScore(prev => {
      const newScore = { ...prev }
      
      if (action === 'increment') {
        newScore[player === 'home' ? 'homeGames' : 'awayGames']++
      } else {
        const currentGames = player === 'home' ? newScore.homeGames : newScore.awayGames
        if (currentGames > 0) {
          newScore[player === 'home' ? 'homeGames' : 'awayGames']--
        }
      }

      return newScore
    })
  }

  const completeSet = () => {
    if (isReadOnly || !isStarted || match.status === 'completed') return

    setScore(prev => {
      const newScore = { ...prev }
      
      // Add current games to the set
      newScore.sets[newScore.currentSet] = {
        home: newScore.homeGames,
        away: newScore.awayGames
      }

      // Determine set winner
      if (newScore.homeGames > newScore.awayGames) {
        newScore.homeSets++
      } else {
        newScore.awaySets++
      }

      // Check if match is complete (best of 3 sets)
      const setsToWin = 2
      if (newScore.homeSets >= setsToWin || newScore.awaySets >= setsToWin) {
        completeMatch(newScore)
        return newScore
      }

      // Start new set
      newScore.currentSet++
      newScore.sets.push({ home: 0, away: 0 })
      newScore.homeGames = 0
      newScore.awayGames = 0

      return newScore
    })
  }

  const completeMatch = (finalScore: MatchScore) => {
    if (isReadOnly) return

    const winner = finalScore.homeSets > finalScore.awaySets ? 'home' : 'away'
    
    setIsLoading(true)
    
    const scoreString = finalScore.sets
      .filter(set => set.home > 0 || set.away > 0)
      .map(set => `${set.home}-${set.away}`)
      .join(', ')

    onScoreUpdate(match.id, winner, scoreString)
    
    toast.success(`${winner === 'home' ? match.homeTeam?.school_name : match.awayTeam?.school_name} wins!`)
    setIsLoading(false)
  }

  const resetCurrentSet = () => {
    if (isReadOnly || !isStarted || match.status === 'completed') return

    setScore(prev => ({
      ...prev,
      homeGames: 0,
      awayGames: 0
    }))
  }

  const getStatusIcon = () => {
    switch (match.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Target className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (match.status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlayerName = (player: { name: string; team?: { school_name: string } } | null | undefined) => {
    return player ? `${player.name} (${player.team?.school_name || ''})` : 'TBD'
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">
              {match.division.replace('_', ' ').toUpperCase()} - Position {match.position}
            </span>
            <Badge className={getStatusColor()}>
              {match.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          {match.courtNumber && (
            <Badge variant="outline">Court {match.courtNumber}</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Home Player */}
          <div className="text-center">
            <div className="font-medium text-sm text-gray-600 mb-1">
              {match.homeTeam?.school_name}
            </div>
            <div className="font-semibold text-lg">
              {getPlayerName(match.homePlayer1)}
            </div>
            {match.homePlayer2 && (
              <div className="text-sm text-gray-600">
                & {getPlayerName(match.homePlayer2)}
              </div>
            )}
          </div>

          {/* Away Player */}
          <div className="text-center">
            <div className="font-medium text-sm text-gray-600 mb-1">
              {match.awayTeam?.school_name}
            </div>
            <div className="font-semibold text-lg">
              {getPlayerName(match.awayPlayer1)}
            </div>
            {match.awayPlayer2 && (
              <div className="text-sm text-gray-600">
                & {getPlayerName(match.awayPlayer2)}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Score Display */}
        {isStarted && (
          <div className="space-y-4">
            {/* Set Scores */}
            {score.sets.map((set, index) => (
              <div key={index} className="flex items-center justify-center gap-4">
                <span className="text-sm text-gray-600">Set {index + 1}:</span>
                <span className="font-mono text-lg">
                  {set.home} - {set.away}
                </span>
                {index === score.currentSet && match.status !== 'completed' && (
                  <Badge variant="outline">Current</Badge>
                )}
              </div>
            ))}

            {/* Current Set Games */}
            {match.status !== 'completed' && (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Current Set Games</div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateGameScore('home', 'decrement')}
                    disabled={isReadOnly || score.homeGames === 0}
                  >
                    -
                  </Button>
                  <span className="font-mono text-2xl font-bold min-w-[80px]">
                    {score.homeGames} - {score.awayGames}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateGameScore('away', 'decrement')}
                    disabled={isReadOnly || score.awayGames === 0}
                  >
                    -
                  </Button>
                </div>
                <div className="flex justify-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateGameScore('home', 'increment')}
                    disabled={isReadOnly}
                  >
                    +1 Home
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateGameScore('away', 'increment')}
                    disabled={isReadOnly}
                  >
                    +1 Away
                  </Button>
                </div>
              </div>
            )}

            {/* Set Controls */}
            {match.status !== 'completed' && (
              <div className="flex justify-center gap-2">
                <Button
                  onClick={completeSet}
                  disabled={isReadOnly || (score.homeGames === 0 && score.awayGames === 0)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Set
                </Button>
                <Button
                  variant="outline"
                  onClick={resetCurrentSet}
                  disabled={isReadOnly}
                >
                  Reset Set
                </Button>
              </div>
            )}

            {/* Final Score */}
            {match.status === 'completed' && match.score && (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Final Score</div>
                <div className="font-mono text-lg font-bold">{match.score}</div>
                <div className="text-sm text-green-600 font-medium">
                  Winner: {match.winner === 'home' ? match.homeTeam?.school_name : match.awayTeam?.school_name}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Start Match Button */}
        {!isStarted && (
          <div className="text-center">
            <Button
              onClick={startMatch}
              disabled={isReadOnly || !match.homePlayer1 || !match.awayPlayer1}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Match
            </Button>
            {(!match.homePlayer1 || !match.awayPlayer1) && (
              <p className="text-sm text-gray-500 mt-2">
                Players need to be assigned before starting
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
