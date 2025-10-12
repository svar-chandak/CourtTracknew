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
  Eye,
  Award
} from 'lucide-react'
import { IndividualScoreInput } from './individual-score-input'
import { IndividualTournamentEngine, type IndividualMatch, type SchoolStanding } from '@/lib/individual-tournament-engine'
import type { Tournament, Team, Player } from '@/lib/types'

interface IndividualTournamentManagerProps {
  tournament: Tournament
  teams: Team[]
  teamPlayers: Record<string, Player[]> // team_id -> players
  onUpdateMatch: (matchId: string, data: Partial<IndividualMatch>) => Promise<void>
  isReadOnly?: boolean
}

export function IndividualTournamentManager({
  tournament,
  teams,
  teamPlayers,
  onUpdateMatch,
  isReadOnly = false
}: IndividualTournamentManagerProps) {
  const [matches, setMatches] = useState<IndividualMatch[]>([])
  const [standings, setStandings] = useState<SchoolStanding[]>([])
  const [activeDivision, setActiveDivision] = useState<string>('boys_singles')
  const [isLoading, setIsLoading] = useState(false)

  // Generate matches when component mounts
  useEffect(() => {
    if (teams.length > 0) {
      const divisions: Array<'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles'> = [
        'boys_singles',
        'girls_singles', 
        'boys_doubles',
        'girls_doubles',
        'mixed_doubles'
      ]
      
      const generatedMatches = IndividualTournamentEngine.generateIndividualBracket(
        tournament.id,
        teams,
        divisions,
        6 // 6 positions per division
      )
      
      const matchesWithPlayers = IndividualTournamentEngine.assignPlayersToMatches(
        generatedMatches,
        teamPlayers
      )
      
      setMatches(matchesWithPlayers)
      updateStandings(matchesWithPlayers)
    }
  }, [tournament.id, teams, teamPlayers])

  const updateStandings = (currentMatches: IndividualMatch[]) => {
    const newStandings = IndividualTournamentEngine.getSchoolStandings(currentMatches, teams)
    setStandings(newStandings)
  }

  const handleScoreUpdate = async (matchId: string, winner: 'home' | 'away', score: string) => {
    setIsLoading(true)
    try {
      const updatedMatches = IndividualTournamentEngine.updateMatchResult(
        matches,
        matchId,
        winner,
        score
      )
      
      setMatches(updatedMatches)
      updateStandings(updatedMatches)
      
      await onUpdateMatch(matchId, { winner, score, status: 'completed' })
    } catch (error) {
      console.error('Failed to update match:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMatchStart = async (matchId: string) => {
    setIsLoading(true)
    try {
      await onUpdateMatch(matchId, { status: 'in_progress' })
      
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, status: 'in_progress' }
          : match
      ))
    } catch (error) {
      console.error('Failed to start match:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDivisionMatches = (division: string) => {
    return IndividualTournamentEngine.getDivisionMatches(matches, division)
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

  const getTournamentStatus = () => {
    const totalMatches = matches.length
    const completedMatches = matches.filter(m => m.status === 'completed').length
    
    if (completedMatches === 0) return 'Not Started'
    if (completedMatches === totalMatches) return 'Completed'
    return 'In Progress'
  }

  const getWinner = () => {
    if (standings.length === 0) return null
    return standings[0].wins > standings[1]?.wins ? standings[0].school : null
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                {tournament.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Individual Player Tournament - {teams.length} schools competing
              </p>
            </div>
            <div className="text-right">
              <Badge variant={getTournamentStatus() === 'Completed' ? 'default' : 'secondary'}>
                {getTournamentStatus()}
              </Badge>
              {getWinner() && (
                <p className="text-sm font-medium text-green-600 mt-1">
                  Winner: {getWinner()?.school_name}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{matches.length}</div>
              <div className="text-sm text-gray-600">Total Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {matches.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {matches.filter(m => m.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {matches.filter(m => m.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Standings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            School Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {standings.map((standing, index) => (
              <div key={standing.school.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{standing.school.school_name}</div>
                    <div className="text-sm text-gray-600">
                      {standing.wins}W - {standing.losses}L ({Math.round(standing.winPercentage * 100)}%)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{standing.wins}</div>
                  <div className="text-sm text-gray-600">Wins</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Division Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Individual Matches
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
                  {getDivisionMatches(division).map((match, index) => (
                    <IndividualScoreInput
                      key={match.id}
                      match={match}
                      onScoreUpdate={handleScoreUpdate}
                      onMatchStart={handleMatchStart}
                      isReadOnly={isReadOnly}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
