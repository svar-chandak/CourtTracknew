'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Trophy, 
  Users, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Calendar,
  MapPin,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Crown,
  BarChart3
} from 'lucide-react'
import { InteractiveBracket } from './interactive-bracket'
import { toast } from 'sonner'
import type { Tournament, TournamentTeam } from '@/lib/types'
import type { BracketMatch, TournamentBracket } from '@/lib/tournament-engine'

interface TournamentManagerProps {
  tournament: Tournament
  teams: TournamentTeam[]
  onUpdateTournament: (updates: Partial<Tournament>) => Promise<void>
  onGenerateBracket: () => Promise<void>
  onUpdateMatch: (matchId: string, updates: Partial<BracketMatch>) => Promise<void>
  onStartTournament: () => Promise<void>
  onEndTournament: () => Promise<void>
  onResetTournament: () => Promise<void>
  isReadOnly?: boolean
}

export function TournamentManager({
  tournament,
  teams,
  onUpdateTournament,
  onGenerateBracket,
  onUpdateMatch,
  onStartTournament,
  onEndTournament,
  onResetTournament,
  isReadOnly = false
}: TournamentManagerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [bracket, setBracket] = useState<TournamentBracket | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Mock bracket data - in real app, this would come from the tournament store
  useEffect(() => {
    // This would be replaced with actual bracket data from the tournament
    const mockBracket: TournamentBracket = {
      tournamentId: tournament.id,
      matches: [],
      rounds: 0,
      totalMatches: 0,
      completedMatches: 0,
      currentRound: 1,
      isComplete: false
    }
    setBracket(mockBracket)
  }, [tournament.id])

  const handleScoreUpdate = async (matchId: string, winner: TournamentTeam, score: string) => {
    setIsLoading(true)
    try {
      await onUpdateMatch(matchId, { winner, score, status: 'completed' })
      toast.success('Match result updated!')
    } catch (error) {
      toast.error('Failed to update match result')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMatchStart = async (matchId: string) => {
    setIsLoading(true)
    try {
      await onUpdateMatch(matchId, { status: 'in_progress' })
      toast.success('Match started!')
    } catch (error) {
      toast.error('Failed to start match')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMatchComplete = async (matchId: string) => {
    setIsLoading(true)
    try {
      await onUpdateMatch(matchId, { status: 'completed' })
      toast.success('Match completed!')
    } catch (error) {
      toast.error('Failed to complete match')
    } finally {
      setIsLoading(false)
    }
  }

  const getTournamentStatus = () => {
    if (tournament.status === 'completed') return 'completed'
    if (tournament.status === 'in_progress') return 'in_progress'
    if (teams.length >= tournament.max_teams) return 'ready_to_start'
    return 'open'
  }

  const getStatusColor = () => {
    const status = getTournamentStatus()
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'ready_to_start': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = () => {
    const status = getTournamentStatus()
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Play className="h-4 w-4" />
      case 'ready_to_start': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const canStartTournament = () => {
    return getTournamentStatus() === 'ready_to_start' && !isReadOnly
  }

  const canEndTournament = () => {
    return getTournamentStatus() === 'in_progress' && !isReadOnly
  }

  const canResetTournament = () => {
    return tournament.status !== 'open' && !isReadOnly
  }

  const getTournamentProgress = () => {
    if (!bracket) return 0
    return bracket.totalMatches > 0 ? (bracket.completedMatches / bracket.totalMatches) * 100 : 0
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{tournament.name}</CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={getStatusColor()}>
                  {getStatusIcon()}
                  <span className="ml-1 capitalize">
                    {getTournamentStatus().replace('_', ' ')}
                  </span>
                </Badge>
                <Badge variant="outline">
                  {tournament.tournament_type.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">
                  Code: {tournament.tournament_code}
                </Badge>
              </div>
            </div>
            
            {!isReadOnly && (
              <div className="flex space-x-2">
                {canStartTournament() && (
                  <Button onClick={onStartTournament} className="flex items-center space-x-2">
                    <Play className="h-4 w-4" />
                    <span>Start Tournament</span>
                  </Button>
                )}
                {canEndTournament() && (
                  <Button 
                    variant="outline" 
                    onClick={onEndTournament}
                    className="flex items-center space-x-2"
                  >
                    <Pause className="h-4 w-4" />
                    <span>End Tournament</span>
                  </Button>
                )}
                {canResetTournament() && (
                  <Button 
                    variant="destructive" 
                    onClick={onResetTournament}
                    className="flex items-center space-x-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">Teams</div>
                <div className="font-semibold">{teams.length}/{tournament.max_teams}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-600">Matches</div>
                <div className="font-semibold">
                  {bracket?.completedMatches || 0}/{bracket?.totalMatches || 0}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm text-gray-600">Start Date</div>
                <div className="font-semibold">
                  {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-sm text-gray-600">Location</div>
                <div className="font-semibold">{tournament.location || 'TBD'}</div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          {bracket && bracket.totalMatches > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tournament Progress</span>
                <span className="text-sm text-gray-600">{Math.round(getTournamentProgress())}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getTournamentProgress()}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tournament Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tournament Info */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {tournament.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {tournament.tournament_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Max Teams</Label>
                    <p className="text-sm text-gray-600 mt-1">{tournament.max_teams}</p>
                  </div>
                </div>
                
                {tournament.location && (
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm text-gray-600 mt-1">{tournament.location}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!bracket && (
                  <Button 
                    onClick={onGenerateBracket} 
                    className="w-full justify-start"
                    disabled={teams.length < 2 || isReadOnly}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Generate Bracket
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('teams')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Teams
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('settings')}
                  disabled={isReadOnly}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Tournament Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bracket" className="space-y-4">
          {bracket ? (
            <InteractiveBracket
              bracket={bracket}
              onScoreUpdate={handleScoreUpdate}
              onMatchStart={handleMatchStart}
              onMatchComplete={handleMatchComplete}
              isReadOnly={isReadOnly}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bracket Generated</h3>
                <p className="text-gray-600 mb-6">
                  Generate a bracket to start the tournament
                </p>
                <Button 
                  onClick={onGenerateBracket}
                  disabled={teams.length < 2 || isReadOnly}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Generate Bracket
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Participating Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Joined</h3>
                  <p className="text-gray-600">Share the tournament code with other coaches to invite teams</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team, index) => (
                    <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
                          {team.seed_number || index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{team.team?.school_name}</div>
                          <div className="text-sm text-gray-600">
                            Joined {new Date(team.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {team.seed_number && (
                          <Badge variant="outline">Seed {team.seed_number}</Badge>
                        )}
                        {team.team?.season_record_wins !== undefined && (
                          <Badge variant="outline">
                            {team.team.season_record_wins}-{team.team.season_record_losses}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tournament-name">Tournament Name</Label>
                <Input
                  id="tournament-name"
                  value={tournament.name}
                  onChange={(e) => onUpdateTournament({ name: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
              
              <div>
                <Label htmlFor="tournament-description">Description</Label>
                <Textarea
                  id="tournament-description"
                  value={tournament.description || ''}
                  onChange={(e) => onUpdateTournament({ description: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={tournament.start_date || ''}
                    onChange={(e) => onUpdateTournament({ start_date: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={tournament.location || ''}
                    onChange={(e) => onUpdateTournament({ location: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="Tournament location"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
