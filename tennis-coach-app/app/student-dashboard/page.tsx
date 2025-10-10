'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStudentAuthStore } from '@/stores/student-auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Calendar, Users, LogOut, Award, Target } from 'lucide-react'
import { toast } from 'sonner'
import type { PlayerMatchHistory } from '@/lib/types'

export default function StudentDashboard() {
  const { player, loading, signOut, getCurrentPlayer, getPlayerMatchHistory } = useStudentAuthStore()
  const [matchHistory, setMatchHistory] = useState<PlayerMatchHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getCurrentPlayer()
  }, [getCurrentPlayer])

  useEffect(() => {
    if (player?.id) {
      loadMatchHistory()
    }
  }, [player?.id])

  const loadMatchHistory = async () => {
    if (!player?.id) return
    
    setHistoryLoading(true)
    const { history, error } = await getPlayerMatchHistory(player.id)
    if (error) {
      toast.error('Failed to load match history')
    } else {
      setMatchHistory(history)
    }
    setHistoryLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    localStorage.removeItem('student_player_id')
    router.push('/student-login')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!player) {
    router.push('/student-login')
    return null
  }

  const wins = matchHistory.filter(match => match.is_winner).length
  const losses = matchHistory.filter(match => !match.is_winner).length
  const winRate = matchHistory.length > 0 ? Math.round((wins / matchHistory.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {player.name}!
              </h1>
              <p className="text-gray-600">
                {player.team?.school_name} • Player ID: {player.player_id}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Player Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{matchHistory.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wins</CardTitle>
                <Award className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{wins}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Losses</CardTitle>
                <Target className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{losses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{winRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Player Info */}
          <Card>
            <CardHeader>
              <CardTitle>Player Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Basic Info</h4>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p><strong>Name:</strong> {player.name}</p>
                    <p><strong>Player ID:</strong> {player.player_id}</p>
                    <p><strong>Team:</strong> {player.team?.school_name}</p>
                    <p><strong>Gender:</strong> {player.gender === 'male' ? 'Male' : 'Female'}</p>
                    {player.grade && <p><strong>Grade:</strong> {player.grade}</p>}
                    {player.team_level && (
                      <p><strong>Team Level:</strong> 
                        <Badge className="ml-2" variant="outline">
                          {player.team_level === 'varsity' ? 'Varsity' : 
                           player.team_level === 'jv' ? 'JV' : 'Freshman'}
                        </Badge>
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Tennis Info</h4>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {player.position_preference && (
                      <p><strong>Position:</strong> 
                        <Badge className="ml-2" variant="outline">
                          {player.position_preference.replace('_', ' ')}
                        </Badge>
                      </p>
                    )}
                    {player.utr_rating && (
                      <p><strong>UTR Rating:</strong> {player.utr_rating}</p>
                    )}
                    {player.phone && <p><strong>Phone:</strong> {player.phone}</p>}
                    {player.email && <p><strong>Email:</strong> {player.email}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match History */}
          <Card>
            <CardHeader>
              <CardTitle>Match History</CardTitle>
              <CardDescription>
                Your completed matches and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading match history...</p>
                </div>
              ) : matchHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No match history</h3>
                  <p className="text-gray-600">Your completed matches will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchHistory.map((match, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="font-medium text-lg">
                              vs {match.match.home_team_id === player.team?.id ? 
                                match.match.away_team?.school_name : 
                                match.match.home_team?.school_name}
                            </h3>
                            <Badge className={getStatusColor(match.match.status)}>
                              {match.match.status}
                            </Badge>
                            <Badge className={getDivisionColor(match.division)}>
                              {match.division.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{new Date(match.match.match_date).toLocaleDateString()}</span>
                            </div>
                            {match.match.location && (
                              <div className="flex items-center">
                                <span>{match.match.location}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-medium">
                              {match.sets_won} - {match.sets_lost}
                            </span>
                            <Badge variant={match.is_winner ? 'default' : 'secondary'}>
                              {match.is_winner ? 'W' : 'L'}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              Position #{match.position_number}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

