'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Plus, Users, Calendar, Trophy } from 'lucide-react'
import { CreateLineupDialog } from '@/components/lineups/create-lineup-dialog'

export default function LineupsPage() {
  const { coach } = useAuthStore()
  const { currentTeam, players, loading, getCurrentTeam, getPlayers } = useTeamStore()
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (coach?.id) {
      getCurrentTeam(coach.id)
    }
  }, [coach, getCurrentTeam])

  useEffect(() => {
    if (currentTeam) {
      getPlayers(currentTeam.id)
    }
  }, [currentTeam, getPlayers])

  const positions = [
    { id: '1S', name: '1st Singles', type: 'singles' },
    { id: '2S', name: '2nd Singles', type: 'singles' },
    { id: '3S', name: '3rd Singles', type: 'singles' },
    { id: '4S', name: '4th Singles', type: 'singles' },
    { id: '5S', name: '5th Singles', type: 'singles' },
    { id: '6S', name: '6th Singles', type: 'singles' },
    { id: '1D', name: '1st Doubles', type: 'doubles' },
    { id: '2D', name: '2nd Doubles', type: 'doubles' },
    { id: '3D', name: '3rd Doubles', type: 'doubles' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lineups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lineups</h1>
          <p className="text-gray-600 mt-1">
            Create and manage match lineups for your team
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Lineup
        </Button>
      </div>

      {/* Lineup Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Players</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lineups</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lineup Templates</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Lineup Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Lineup Builder</CardTitle>
          <CardDescription>
            Drag and drop players to create your match lineup
          </CardDescription>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No players available</h3>
              <p className="text-gray-600 mb-4">Add players to your team first to create lineups</p>
              <Button onClick={() => window.location.href = '/dashboard/team'}>
                <Plus className="h-4 w-4 mr-2" />
                Add Players
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Available Players */}
              <div>
                <h3 className="text-lg font-medium mb-3">Available Players</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {players.map((player) => (
                    <div key={player.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-move">
                      <div className="text-sm font-medium">{player.name}</div>
                      <div className="text-xs text-gray-600">
                        {player.grade && `Grade ${player.grade}`}
                        {player.team_level && ` • ${player.team_level === 'varsity' ? 'Varsity' : player.team_level === 'jv' ? 'JV' : 'Freshman'}`}
                        {player.utr_rating && ` • UTR ${player.utr_rating}`}
                      </div>
                      {player.position_preference && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {player.position_preference}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lineup Positions */}
              <div>
                <h3 className="text-lg font-medium mb-3">Lineup Positions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Singles */}
                  <div>
                    <h4 className="font-medium mb-2">Singles</h4>
                    <div className="space-y-2">
                      {positions.filter(p => p.type === 'singles').map((position) => (
                        <div key={position.id} className="border-2 border-dashed border-gray-300 rounded-lg p-3 min-h-[60px] flex items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{position.name}</div>
                            <div className="text-xs text-gray-500">Drag player here</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doubles */}
                  <div>
                    <h4 className="font-medium mb-2">Doubles</h4>
                    <div className="space-y-2">
                      {positions.filter(p => p.type === 'doubles').map((position) => (
                        <div key={position.id} className="border-2 border-dashed border-gray-300 rounded-lg p-3 min-h-[60px] flex items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{position.name}</div>
                            <div className="text-xs text-gray-500">Drag 2 players here</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  Save as Template
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Create Lineup
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Lineups */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lineups</CardTitle>
          <CardDescription>
            Your recent match lineups and templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lineups yet</h3>
            <p className="text-gray-600">Create your first lineup to get started</p>
          </div>
        </CardContent>
      </Card>

      {/* Create Lineup Dialog */}
      <CreateLineupDialog
        players={players}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
