'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddPlayerDialog } from '@/components/team/add-player-dialog'
import { EditPlayerDialog } from '@/components/team/edit-player-dialog'
import { Users, Plus, Edit, Trash2, Phone, Mail, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import type { Player } from '@/lib/types'

export default function TeamPage() {
  const { coach } = useAuthStore()
  const { currentTeam, players, loading, getCurrentTeam, getPlayers, deletePlayer } = useTeamStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
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

  const getSkillLevelColor = (skillLevel?: string) => {
    switch (skillLevel) {
      case 'Varsity': return 'bg-green-100 text-green-800'
      case 'Advanced': return 'bg-blue-100 text-blue-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Beginner': return 'bg-gray-100 text-gray-800'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium">Varsity Players</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {players.filter(p => p.skill_level === 'Varsity').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seniors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {players.filter(p => p.grade === 12).length}
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
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <div key={player.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-lg">{player.name}</h3>
                      {player.position_preference && (
                        <p className="text-sm text-gray-600">
                          Prefers: {player.position_preference}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPlayer(player)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlayer(player.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {player.grade && (
                      <Badge className={getGradeColor(player.grade)}>
                        Grade {player.grade}
                      </Badge>
                    )}
                    
                    {player.skill_level && (
                      <Badge className={getSkillLevelColor(player.skill_level)}>
                        {player.skill_level}
                      </Badge>
                    )}

                    {player.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate">{player.email}</span>
                      </div>
                    )}

                    {player.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />
                        <span>{player.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
