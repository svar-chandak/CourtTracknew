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
  ChevronRight, 
  ChevronDown, 
  Clock,
  CheckCircle,
  Play,
  Eye,
  Settings
} from 'lucide-react'
import { LiveScoreInput } from './live-score-input'
import type { BracketMatch, TournamentBracket } from '@/lib/tournament-engine'
import type { TournamentTeam } from '@/lib/types'

interface InteractiveBracketProps {
  bracket: TournamentBracket
  onScoreUpdate: (matchId: string, winner: TournamentTeam, score: string) => void
  onMatchStart: (matchId: string) => void
  onMatchComplete: (matchId: string) => void
  isReadOnly?: boolean
}

export function InteractiveBracket({ 
  bracket, 
  onScoreUpdate, 
  onMatchStart, 
  onMatchComplete,
  isReadOnly = false 
}: InteractiveBracketProps) {
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]))

  useEffect(() => {
    // Auto-expand current round
    setSelectedRound(bracket.currentRound)
    setExpandedRounds(prev => new Set([...prev, bracket.currentRound]))
  }, [bracket.currentRound])

  const getRoundMatches = (round: number) => {
    return bracket.matches
      .filter(match => match.round === round)
      .sort((a, b) => a.matchNumber - b.matchNumber)
  }

  const getMatchStatusIcon = (match: BracketMatch) => {
    switch (match.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getMatchStatusColor = (match: BracketMatch) => {
    switch (match.status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'in_progress':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const toggleRound = (round: number) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(round)) {
        newSet.delete(round)
      } else {
        newSet.add(round)
      }
      return newSet
    })
  }

  const getRoundTitle = (round: number) => {
    const totalRounds = bracket.rounds
    if (round === totalRounds) return 'Championship'
    if (round === totalRounds - 1) return 'Semi-Finals'
    if (round === totalRounds - 2) return 'Quarter-Finals'
    return `Round ${round}`
  }

  const getRoundMatchesCount = (round: number) => {
    return getRoundMatches(round).length
  }

  const getCompletedMatchesCount = (round: number) => {
    return getRoundMatches(round).filter(m => m.status === 'completed').length
  }

  const renderBracketTree = () => {
    const rounds = Array.from({ length: bracket.rounds }, (_, i) => i + 1)
    
    return (
      <div className="space-y-8 overflow-x-auto">
        {rounds.map(round => {
          const matches = getRoundMatches(round)
          const isExpanded = expandedRounds.has(round)
          const completedCount = getCompletedMatchesCount(round)
          const totalCount = getRoundMatchesCount(round)
          
          return (
            <div key={round} className="min-w-[600px]">
              {/* Round Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRound(round)}
                    className="p-1"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <h3 className="text-lg font-semibold">{getRoundTitle(round)}</h3>
                    <div className="text-sm text-gray-600">
                      {completedCount}/{totalCount} matches completed
                    </div>
                  </div>
                </div>
                <Badge variant={round === bracket.currentRound ? 'default' : 'outline'}>
                  {round === bracket.currentRound ? 'Current Round' : `Round ${round}`}
                </Badge>
              </div>

              {/* Round Matches */}
              {isExpanded && (
                <div className="grid gap-4">
                  {matches.map(match => (
                    <Card 
                      key={match.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${getMatchStatusColor(match)}`}
                      onClick={() => setSelectedMatch(match.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {getMatchStatusIcon(match)}
                              <div className="font-medium">
                                {match.team1?.team?.school_name || 'TBD'} vs {match.team2?.team?.school_name || 'TBD'}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Match {match.matchNumber}
                              </Badge>
                              {match.courtNumber && (
                                <Badge variant="outline" className="text-xs">
                                  Court {match.courtNumber}
                                </Badge>
                              )}
                            </div>
                            
                            {match.score && (
                              <div className="text-sm text-gray-600 mb-2">
                                Score: {match.score}
                              </div>
                            )}
                            
                            {match.winner && (
                              <div className="flex items-center space-x-2 text-green-600">
                                <Trophy className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Winner: {match.winner.team?.school_name}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedMatch(match.id)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderBracketGrid = () => {
    const rounds = Array.from({ length: bracket.rounds }, (_, i) => i + 1)
    const maxMatchesPerRound = Math.max(...rounds.map(round => getRoundMatchesCount(round)))
    
    return (
      <div className="overflow-x-auto">
        <div 
          className="grid gap-4 min-w-max"
          style={{ gridTemplateColumns: `repeat(${bracket.rounds}, 1fr)` }}
        >
          {rounds.map(round => {
            const matches = getRoundMatches(round)
            
            return (
              <div key={round} className="space-y-2">
                <div className="text-center mb-4">
                  <h3 className="font-semibold">{getRoundTitle(round)}</h3>
                  <div className="text-sm text-gray-600">
                    {getCompletedMatchesCount(round)}/{getRoundMatchesCount(round)} complete
                  </div>
                </div>
                
                <div className="space-y-2 min-h-[200px]">
                  {matches.map(match => (
                    <Card 
                      key={match.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${getMatchStatusColor(match)}`}
                      onClick={() => setSelectedMatch(match.id)}
                    >
                      <CardContent className="p-3">
                        <div className="text-center space-y-2">
                          <div className="flex items-center justify-center space-x-2">
                            {getMatchStatusIcon(match)}
                            <span className="text-xs font-medium">
                              Match {match.matchNumber}
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            <div className="font-medium">
                              {match.team1?.team?.school_name || 'TBD'}
                            </div>
                            <div className="text-gray-500">vs</div>
                            <div className="font-medium">
                              {match.team2?.team?.school_name || 'TBD'}
                            </div>
                          </div>
                          
                          {match.score && (
                            <div className="text-xs text-gray-600">
                              {match.score}
                            </div>
                          )}
                          
                          {match.winner && (
                            <div className="flex items-center justify-center space-x-1 text-green-600">
                              <Trophy className="h-3 w-3" />
                              <span className="text-xs">
                                {match.winner.team?.school_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const selectedMatchData = bracket.matches.find(m => m.id === selectedMatch)

  return (
    <div className="space-y-6">
      {/* Bracket Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Bracket</h2>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{bracket.matches.length} total matches</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>{bracket.completedMatches} completed</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>Round {bracket.currentRound} of {bracket.rounds}</span>
            </div>
          </div>
        </div>
        
        {bracket.isComplete && bracket.winner && (
          <div className="text-center">
            <div className="flex items-center space-x-2 text-green-600">
              <Trophy className="h-6 w-6" />
              <div>
                <div className="font-bold">Tournament Champion</div>
                <div className="text-lg">{bracket.winner.team?.school_name}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bracket Views */}
      <Tabs defaultValue="tree" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tree">Tree View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tree" className="space-y-4">
          {renderBracketTree()}
        </TabsContent>
        
        <TabsContent value="grid" className="space-y-4">
          {renderBracketGrid()}
        </TabsContent>
      </Tabs>

      {/* Match Details Modal */}
      {selectedMatchData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Match Details</h3>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMatch(null)}
                >
                  Close
                </Button>
              </div>
              
              <LiveScoreInput
                match={selectedMatchData}
                onScoreUpdate={onScoreUpdate}
                onMatchStart={onMatchStart}
                onMatchComplete={onMatchComplete}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
