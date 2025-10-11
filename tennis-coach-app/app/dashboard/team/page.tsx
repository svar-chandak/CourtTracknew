'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddPlayerDialog } from '@/components/team/add-player-dialog'
import { EditPlayerDialog } from '@/components/team/edit-player-dialog'
import { MassAddPlayersDialog } from '@/components/team/mass-add-players-dialog'
import { MassEditPlayersDialog } from '@/components/team/mass-edit-players-dialog'
import { Users, Plus, Edit, Trash2, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import type { Player } from '@/lib/types'

export default function TeamPage() {
  const { coach } = useAuthStore()
  const { currentTeam, players, loading, getCurrentTeam, getPlayers, deletePlayer } = useTeamStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showMassAddDialog, setShowMassAddDialog] = useState(false)
  const [showMassEditDialog, setShowMassEditDialog] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)

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

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      const { error } = await deletePlayer(playerId)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Player deleted successfully')
      }
    }
  }

  const getTeamLevelColor = (teamLevel?: string) => {
    switch (teamLevel) {
      case 'varsity': return 'bg-green-100 text-green-800'
      case 'jv': return 'bg-blue-100 text-blue-800'
      case 'freshman': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getGradeColor = (grade?: number) => {
    if (!grade) return 'bg-gray-100 text-gray-800'
    if (grade === 12) return 'bg-purple-100 text-purple-800'
    if (grade === 11) return 'bg-blue-100 text-blue-800'
    if (grade === 10) return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{currentTeam?.school_name}</h1>
        <p className="text-green-100">
          Season Record: {currentTeam?.season_record_wins}-{currentTeam?.season_record_losses}
        </p>
        <p className="text-green-100 text-sm font-mono">Team Code: #{currentTeam?.team_code}</p>
      </div>

      {/* Team Stats */}
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
            <CardTitle className="text-sm font-medium">Varsity</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {players.filter(p => p.team_level === 'varsity').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Junior Varsity</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {players.filter(p => p.team_level === 'jv').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freshman</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {players.filter(p => p.team_level === 'freshman').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Players Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Roster</CardTitle>
            <CardDescription>
              Manage your team players and their information
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
            <Button onClick={() => setShowMassAddDialog(true)} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Mass Add
            </Button>
            {players.filter(p => !p.team_level).length > 0 && (
              <Button onClick={() => setShowMassEditDialog(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Mass Edit ({players.filter(p => !p.team_level).length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No players yet</h3>
              <p className="text-gray-600 mb-4">Add your first player to get started</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Player
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {(['varsity', 'jv', 'freshman'] as const).map((teamLevel) => {
                const levelPlayers = players.filter(p => p.team_level === teamLevel)
                if (levelPlayers.length === 0) return null

                const boysPlayers = levelPlayers.filter(p => p.gender === 'male')
                const girlsPlayers = levelPlayers.filter(p => p.gender === 'female')

                return (
                  <div key={teamLevel} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getTeamLevelColor(teamLevel)}>
                        {teamLevel === 'varsity' ? 'Varsity' : 
                         teamLevel === 'jv' ? 'Junior Varsity' : 'Freshman'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {levelPlayers.length} player{levelPlayers.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Boys Team */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-blue-700 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Boys Team ({boysPlayers.length})
                        </h4>
                        <div className="space-y-2">
                          {boysPlayers.map((player) => (
                            <div key={player.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-blue-50">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h5 className="font-medium">{player.name}</h5>
                                  <p className="text-xs text-gray-500 font-mono">
                                    ID: {player.id}
                                  </p>
                                  {player.position_preference && (
                                    <p className="text-xs text-gray-600">
                                      Prefers: {player.position_preference.replace('_', ' ')}
                                    </p>
                                  )}
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingPlayer(player)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePlayer(player.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {player.grade && (
                                  <Badge className={`${getGradeColor(player.grade)} text-xs`}>
                                    Grade {player.grade}
                                  </Badge>
                                )}
                                {player.utr_rating && (
                                  <Badge variant="outline" className="text-xs">
                                    UTR {player.utr_rating}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          {boysPlayers.length === 0 && (
                            <p className="text-sm text-gray-500 italic text-center py-4">No boys players</p>
                          )}
                        </div>
                      </div>

                      {/* Girls Team */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-pink-700 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Girls Team ({girlsPlayers.length})
                        </h4>
                        <div className="space-y-2">
                          {girlsPlayers.map((player) => (
                            <div key={player.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-pink-50">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h5 className="font-medium">{player.name}</h5>
                                  <p className="text-xs text-gray-500 font-mono">
                                    ID: {player.id}
                                  </p>
                                  {player.position_preference && (
                                    <p className="text-xs text-gray-600">
                                      Prefers: {player.position_preference.replace('_', ' ')}
                                    </p>
                                  )}
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingPlayer(player)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePlayer(player.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {player.grade && (
                                  <Badge className={`${getGradeColor(player.grade)} text-xs`}>
                                    Grade {player.grade}
                                  </Badge>
                                )}
                                {player.utr_rating && (
                                  <Badge variant="outline" className="text-xs">
                                    UTR {player.utr_rating}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          {girlsPlayers.length === 0 && (
                            <p className="text-sm text-gray-500 italic text-center py-4">No girls players</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Show players without team levels */}
              {players.filter(p => !p.team_level).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-100 text-gray-700">
                      Unassigned
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {players.filter(p => !p.team_level).length} player{players.filter(p => !p.team_level).length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Unassigned Boys */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Unassigned Boys ({players.filter(p => !p.team_level && p.gender === 'male').length})
                      </h4>
                      <div className="space-y-2">
                        {players.filter(p => !p.team_level && p.gender === 'male').map((player) => (
                          <div key={player.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-blue-50">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-medium">{player.name}</h5>
                                {player.position_preference && (
                                  <p className="text-xs text-gray-600">
                                    Prefers: {player.position_preference.replace('_', ' ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingPlayer(player)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePlayer(player.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {player.grade && (
                                <Badge className={`${getGradeColor(player.grade)} text-xs`}>
                                  Grade {player.grade}
                                </Badge>
                              )}
                              {player.utr_rating && (
                                <Badge variant="outline" className="text-xs">
                                  UTR {player.utr_rating}
                                </Badge>
                              )}
                              <Badge variant="destructive" className="text-xs">
                                No Team Level
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {players.filter(p => !p.team_level && p.gender === 'male').length === 0 && (
                          <p className="text-sm text-gray-500 italic text-center py-4">No unassigned boys players</p>
                        )}
                      </div>
                    </div>

                    {/* Unassigned Girls */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-pink-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Unassigned Girls ({players.filter(p => !p.team_level && p.gender === 'female').length})
                      </h4>
                      <div className="space-y-2">
                        {players.filter(p => !p.team_level && p.gender === 'female').map((player) => (
                          <div key={player.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-pink-50">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-medium">{player.name}</h5>
                                {player.position_preference && (
                                  <p className="text-xs text-gray-600">
                                    Prefers: {player.position_preference.replace('_', ' ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingPlayer(player)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePlayer(player.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {player.grade && (
                                <Badge className={`${getGradeColor(player.grade)} text-xs`}>
                                  Grade {player.grade}
                                </Badge>
                              )}
                              {player.utr_rating && (
                                <Badge variant="outline" className="text-xs">
                                  UTR {player.utr_rating}
                                </Badge>
                              )}
                              <Badge variant="destructive" className="text-xs">
                                No Team Level
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {players.filter(p => !p.team_level && p.gender === 'female').length === 0 && (
                          <p className="text-sm text-gray-500 italic text-center py-4">No unassigned girls players</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show all unassigned players regardless of gender */}
              {players.filter(p => !p.team_level).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-100 text-gray-700">
                      All Unassigned Players
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {players.filter(p => !p.team_level).length} player{players.filter(p => !p.team_level).length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {players.filter(p => !p.team_level).map((player) => (
                      <div key={player.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium">{player.name}</h5>
                            <p className="text-xs text-gray-500 font-mono">
                              ID: {player.id}
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPlayer(player)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePlayer(player.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="destructive" className="text-xs">
                            No Team Level
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            No Gender
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show message if no players have team levels assigned */}
              {players.length > 0 && players.every(p => !p.team_level) && (
                <div className="text-center py-8 text-gray-500">
                  <p>Players found but no team levels assigned.</p>
                  <p className="text-sm">Edit players to assign team levels (Varsity, JV, Freshman).</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showAddDialog && (
        <AddPlayerDialog
          teamId={currentTeam?.id || ''}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      )}

      {showMassAddDialog && currentTeam && (
        <MassAddPlayersDialog
          teamId={currentTeam.id}
          open={showMassAddDialog}
          onOpenChange={setShowMassAddDialog}
        />
      )}

      {showMassEditDialog && (
        <MassEditPlayersDialog
          open={showMassEditDialog}
          onOpenChange={setShowMassEditDialog}
          players={players}
          onPlayersUpdated={() => {
            if (currentTeam) {
              getPlayers(currentTeam.id)
            }
          }}
        />
      )}

      {editingPlayer && (
        <EditPlayerDialog
          player={editingPlayer}
          open={!!editingPlayer}
          onOpenChange={(open) => !open && setEditingPlayer(null)}
        />
      )}
    </div>
  )
}
