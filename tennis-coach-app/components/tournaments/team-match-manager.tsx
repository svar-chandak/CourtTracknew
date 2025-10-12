'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Users, 
  Target, 
  Clock,
  CheckCircle,
  Play,
  School,
  Award
} from 'lucide-react'
import { IndividualPositionScoreInput } from './individual-position-score-input'
import { TeamMatchEngine, type TeamMatch, type TeamMatchResult } from '@/lib/team-match-engine'
import type { Tournament, Team, Player } from '@/lib/types'

interface TeamMatchManagerProps {
  tournament: Tournament
  homeTeam: Team
  awayTeam: Team
  teamLevel: 'varsity' | 'jv' | 'freshman'
  homePlayers: Player[]
  awayPlayers: Player[]
  onUpdateMatch: (matchId: string, data: Partial<TeamMatch>) => Promise<void>
  isReadOnly?: boolean
}

export function TeamMatchManager({
  tournament,
  homeTeam,
  awayTeam,
  teamLevel,
  homePlayers,
  awayPlayers,
  onUpdateMatch,
  isReadOnly = false
}: TeamMatchManagerProps) {
  const [teamMatch, setTeamMatch] = useState<TeamMatch | null>(null)
  const [activeDivision, setActiveDivision] = useState<string>('boys_singles')
  const [isLoading, setIsLoading] = useState(false)

  // Create team match when component mounts
  useEffect(() => {
    const newTeamMatch = TeamMatchEngine.createTeamMatch(
      tournament.id,
      homeTeam,
      awayTeam,
      teamLevel,
      new Date().toISOString()
    )

    const matchWithPlayers = TeamMatchEngine.assignPlayersToTeamMatch(
      newTeamMatch,
      homePlayers,
      awayPlayers
    )

    setTeamMatch(matchWithPlayers)
  }, [tournament.id, homeTeam, awayTeam, teamLevel, homePlayers, awayPlayers])

  const handleIndividualMatchUpdate = async (individualMatchId: string, winner: 'home' | 'away', score: string) => {
    if (!teamMatch) return

    setIsLoading(true)
    try {
      const updatedTeamMatch = TeamMatchEngine.updateIndividualMatchResult(
        teamMatch,
        individualMatchId,
        winner,
        score
      )

      setTeamMatch(updatedTeamMatch)
      await onUpdateMatch(teamMatch.id, updatedTeamMatch)
    } catch (error) {
      console.error('Failed to update individual match:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMatchStart = async () => {
    if (!teamMatch) return

    setIsLoading(true)
    try {
      const updatedTeamMatch = { ...teamMatch, status: 'in_progress' as const }
      setTeamMatch(updatedTeamMatch)
      await onUpdateMatch(teamMatch.id, { status: 'in_progress' })
    } catch (error) {
      console.error('Failed to start match:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDivisionMatches = (division: string) => {
    if (!teamMatch) return []
    return TeamMatchEngine.getMatchesByDivision(teamMatch, division)
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

  const getTeamMatchResult = (): TeamMatchResult | null => {
    if (!teamMatch) return null
    return TeamMatchEngine.getTeamMatchResult(teamMatch)
  }

  const getStatusIcon = () => {
    if (!teamMatch) return <Target className="h-4 w-4 text-gray-400" />
    
    switch (teamMatch.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Target className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    if (!teamMatch) return 'bg-gray-100 text-gray-800'
    
    switch (teamMatch.status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!teamMatch) {
    return <div>Loading team match...</div>
  }

  const result = getTeamMatchResult()

  return (
    <div className="space-y-6">
      {/* Team Match Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <School className="h-6 w-6" />
                {homeTeam.school_name} vs {awayTeam.school_name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {teamLevel.toUpperCase()} Team Match
              </p>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor()}>
                {teamMatch.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {result && result.winner !== 'tie' && (
                <p className="text-sm font-medium text-green-600 mt-1">
                  Winner: {result.winner === 'home' ? homeTeam.school_name : awayTeam.school_name}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{teamMatch.individualMatches.length}</div>
              <div className="text-sm text-gray-600">Total Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result?.homeWins || 0}</div>
              <div className="text-sm text-gray-600">{homeTeam.school_name} Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{result?.awayWins || 0}</div>
              <div className="text-sm text-gray-600">{awayTeam.school_name} Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {teamMatch.individualMatches.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Position Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Individual Position Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  {getDivisionMatches(division).map((match) => (
                    <IndividualPositionScoreInput
                      key={match.id}
                      match={match}
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                      onScoreUpdate={handleIndividualMatchUpdate}
                      isReadOnly={isReadOnly}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Start Match Button */}
      {teamMatch.status === 'scheduled' && !isReadOnly && (
        <div className="text-center">
          <Button
            onClick={handleMatchStart}
            disabled={isLoading}
            className="flex items-center gap-2"
            size="lg"
          >
            <Play className="h-5 w-5" />
            Start Team Match
          </Button>
        </div>
      )}
    </div>
  )
}
