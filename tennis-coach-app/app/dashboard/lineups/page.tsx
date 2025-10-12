'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { useLineupStore } from '@/stores/lineup-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Plus, Users, Trophy } from 'lucide-react'
import { CreateLineupDialog } from '@/components/lineups/create-lineup-dialog'
import type { Player } from '@/lib/types'

export default function LineupsPage() {
  const { coach } = useAuthStore()
  const { currentTeam, players, loading, getCurrentTeam, getPlayers } = useTeamStore()
  const { lineups, loadLineups } = useLineupStore()
  const [selectedTeamLevel, setSelectedTeamLevel] = useState<'varsity' | 'jv' | 'freshman' | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)


  useEffect(() => {
    if (coach?.id) {
      getCurrentTeam(coach.id)
    }
  }, [coach, getCurrentTeam])

  useEffect(() => {
    if (currentTeam) {
      getPlayers(currentTeam.id)
      loadLineups(currentTeam.id)
    }
  }, [currentTeam, getPlayers, loadLineups])

  // Auto-select team level if only one has players
  useEffect(() => {
    if (players.length > 0 && !selectedTeamLevel) {
      const varsityPlayers = players.filter(p => p.team_level === 'varsity')
      const jvPlayers = players.filter(p => p.team_level === 'jv')
      const freshmanPlayers = players.filter(p => p.team_level === 'freshman')
      
      if (varsityPlayers.length > 0) setSelectedTeamLevel('varsity')
      else if (jvPlayers.length > 0) setSelectedTeamLevel('jv')
      else if (freshmanPlayers.length > 0) setSelectedTeamLevel('freshman')
    }
  }, [players, selectedTeamLevel])

  const getTeamLevelStats = () => {
    const varsityPlayers = players.filter(p => p.team_level === 'varsity')
    const jvPlayers = players.filter(p => p.team_level === 'jv')
    const freshmanPlayers = players.filter(p => p.team_level === 'freshman')
    
    return {
      varsity: varsityPlayers.length,
      jv: jvPlayers.length,
      freshman: freshmanPlayers.length,
      total: players.length
    }
  }

  const stats = getTeamLevelStats()

  // Get current lineup for display
  const getCurrentLineup = () => {
    const currentLineup: Record<string, Player[]> = {}
    
    
    // Sort lineups by creation date (most recent first) and group by position
    const lineupsByPosition = new Map<string, any>()
    
    lineups.forEach(lineup => {
      const { position, player_ids } = lineup
      
      // Skip if no player_ids or empty array
      if (!player_ids || player_ids.length === 0) {
        return
      }

      // Filter by selected team level - only show lineups where all players match the selected team level
      if (selectedTeamLevel) {
        const lineupPlayers = player_ids
          .map(id => players.find(p => p.id === id))
          .filter(Boolean) as Player[]
        
        // Check if all players in this lineup match the selected team level
        const allPlayersMatchTeamLevel = lineupPlayers.every(player => player.team_level === selectedTeamLevel)
        
        if (!allPlayersMatchTeamLevel) {
          return // Skip this lineup if not all players match the selected team level
        }
      }
      
      // Store the most recent lineup for this position
      if (!lineupsByPosition.has(position) || new Date(lineup.created_at) > new Date(lineupsByPosition.get(position).created_at)) {
        lineupsByPosition.set(position, lineup)
      }
    })
    
    // Process only the most recent lineup for each position
    lineupsByPosition.forEach(lineup => {
      const { position, player_ids } = lineup
      
      // Map database position names to display position IDs
      let positionKey: string
      
      // Handle different possible position formats
      if (position.startsWith('boys_singles_')) {
        const order = position.split('_')[2]
        positionKey = `${order}BS`
      } else if (position.startsWith('girls_singles_')) {
        const order = position.split('_')[2]
        positionKey = `${order}GS`
      } else if (position.startsWith('boys_doubles_')) {
        const order = position.split('_')[2]
        // Map roster order to position ID (7->1, 8->2)
        const positionNumber = order === '7' ? '1' : order === '8' ? '2' : order
        positionKey = `${positionNumber}BD`
      } else if (position.startsWith('girls_doubles_')) {
        const order = position.split('_')[2]
        // Map roster order to position ID (7->1, 8->2)
        const positionNumber = order === '7' ? '1' : order === '8' ? '2' : order
        positionKey = `${positionNumber}GD`
      } else if (position === 'mixed_doubles_1') {
        positionKey = 'MD'
      } else if (position === '1GS' || position === '2GS' || position === '3GS' || position === '4GS' || position === '5GS' || position === '6GS') {
        // Already in display format
        positionKey = position
      } else if (position === '1BS' || position === '2BS' || position === '3BS' || position === '4BS' || position === '5BS' || position === '6BS') {
        // Already in display format
        positionKey = position
      } else if (position === '1GD' || position === '2GD' || position === '1BD' || position === '2BD' || position === 'MD') {
        // Already in display format
        positionKey = position
      } else {
        return // Skip unknown positions
      }
      
      const lineupPlayers = player_ids
        .map((id: string) => players.find(p => p.id === id))
        .filter(Boolean) as Player[]
      
      if (lineupPlayers.length > 0) {
        currentLineup[positionKey] = lineupPlayers
      }
    })
    
    return currentLineup
  }

  // Convert lineup data from database format to dialog format
  const getDialogLineupFormat = (): Record<string, string[]> => {
    const dialogLineup: Record<string, string[]> = {}
    
    if (lineups.length === 0) {
      return dialogLineup
    }
    
    lineups.forEach((lineup) => {
      const { position, player_ids } = lineup
      
      // Skip if no player_ids or empty array
      if (!player_ids || player_ids.length === 0) {
        return
      }
      
      // Map database position names to dialog position IDs
      let positionId: string
      
      // Handle different possible position formats
      if (position.startsWith('boys_singles_')) {
        const order = position.split('_')[2]
        positionId = `${order}BS`
      } else if (position.startsWith('girls_singles_')) {
        const order = position.split('_')[2]
        positionId = `${order}GS`
      } else if (position.startsWith('boys_doubles_')) {
        const order = position.split('_')[2]
        // Map roster order to position ID (7->1, 8->2)
        const positionNumber = order === '7' ? '1' : order === '8' ? '2' : order
        positionId = `${positionNumber}BD`
      } else if (position.startsWith('girls_doubles_')) {
        const order = position.split('_')[2]
        // Map roster order to position ID (7->1, 8->2)
        const positionNumber = order === '7' ? '1' : order === '8' ? '2' : order
        positionId = `${positionNumber}GD`
      } else if (position === 'mixed_doubles_1') {
        positionId = 'MD'
      } else if (position === '1GS' || position === '2GS' || position === '3GS' || position === '4GS' || position === '5GS' || position === '6GS') {
        // Already in dialog format
        positionId = position
      } else if (position === '1BS' || position === '2BS' || position === '3BS' || position === '4BS' || position === '5BS' || position === '6BS') {
        // Already in dialog format
        positionId = position
      } else if (position === '1GD' || position === '2GD' || position === '1BD' || position === '2BD' || position === 'MD') {
        // Already in dialog format
        positionId = position
      } else {
        return // Skip unknown positions
      }
      
      // Only add if we have a valid positionId and player_ids
      if (positionId && player_ids && player_ids.length > 0) {
        dialogLineup[positionId] = player_ids
      }
    })
    
    return dialogLineup
  }

  const currentLineup = useMemo(() => getCurrentLineup(), [lineups, players, selectedTeamLevel])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading lineups...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lineups</h1>
          <p className="text-gray-600">Create and manage match lineups for your team</p>
        </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Lineup
            </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Varsity Players</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.varsity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">JV Players</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.jv}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freshman Players</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.freshman}</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Level Selection */}
      {players.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Team Level</CardTitle>
            <CardDescription>Choose which team level to create lineups for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              {(['varsity', 'jv', 'freshman'] as const).map((level) => {
                const levelPlayers = players.filter(p => p.team_level === level)
                const levelName = level === 'varsity' ? 'Varsity' : level === 'jv' ? 'Junior Varsity' : 'Freshman'
                
                return (
                  <Button
                    key={level}
                    variant={selectedTeamLevel === level ? 'default' : 'outline'}
                    onClick={() => setSelectedTeamLevel(level)}
                    className="flex items-center gap-2"
                    disabled={levelPlayers.length === 0}
                  >
                    <Users className="h-4 w-4" />
                    {levelName} ({levelPlayers.length})
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lineup Builder */}
      {selectedTeamLevel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              {selectedTeamLevel === 'varsity' ? 'Varsity' : selectedTeamLevel === 'jv' ? 'Junior Varsity' : 'Freshman'} Lineup Builder
            </CardTitle>
            <CardDescription>
              Create lineups for {selectedTeamLevel === 'varsity' ? 'Varsity' : selectedTeamLevel === 'jv' ? 'JV' : 'Freshman'} team matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Available Players for Selected Level */}
              <div>
                <h3 className="text-lg font-medium mb-3">
                  Available {selectedTeamLevel === 'varsity' ? 'Varsity' : selectedTeamLevel === 'jv' ? 'JV' : 'Freshman'} Players
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {players
                    .filter(player => player.team_level === selectedTeamLevel)
                    .filter(player => {
                      // Filter out players who are already assigned to any lineup position
                      const assignedPlayerIds = lineups.flatMap(lineup => lineup.player_ids || [])
                      return !assignedPlayerIds.includes(player.id)
                    })
                    .map((player) => (
                      <div key={player.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-move">
                        <div className="text-sm font-medium">{player.name}</div>
                        <div className="text-xs text-gray-600">
                          {player.grade && `Grade ${player.grade}`}
                          {player.gender && ` • ${player.gender === 'male' ? 'Boys' : 'Girls'}`}
                          {player.utr_rating && ` • UTR ${player.utr_rating}`}
                        </div>
                        {player.position_preference && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {player.position_preference.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    ))}
                  {players
                    .filter(player => player.team_level === selectedTeamLevel)
                    .filter(player => {
                      const assignedPlayerIds = lineups.flatMap(lineup => lineup.player_ids || [])
                      return !assignedPlayerIds.includes(player.id)
                    }).length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <p>No {selectedTeamLevel} players available</p>
                      <p className="text-sm">All players are assigned to lineup positions</p>
                    </div>
                  )}
                </div>
              </div>

              {/* High School Tennis Lineup Positions */}
              <div>
                <h3 className="text-lg font-medium mb-3">High School Tennis Lineup Positions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Boys Division */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-700">Boys Division</h4>
                    
                    {/* Boys Singles */}
                    <div>
                      <h5 className="font-medium mb-2 text-sm">Boys Singles</h5>
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          const positionKey = `${num}BS`
                          const assignedPlayers = currentLineup[positionKey] || []
                          const isEmpty = assignedPlayers.length === 0
                          
                          return (
                            <div key={`boys_singles_${num}`} className={`border-2 rounded-lg p-3 min-h-[60px] flex items-center ${
                              isEmpty 
                                ? 'border-dashed border-blue-200 bg-blue-50' 
                                : 'border-solid border-blue-300 bg-blue-100'
                            }`}>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{num}st Boys Singles</div>
                                {!isEmpty && (
                                  <div className="text-xs text-green-600 font-medium">
                                    {assignedPlayers.map(p => p.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Boys Doubles */}
                    <div>
                      <h5 className="font-medium mb-2 text-sm">Boys Doubles</h5>
                      <div className="space-y-2">
                        {[1, 2].map((num) => {
                          const positionKey = `${num}BD`
                          const assignedPlayers = currentLineup[positionKey] || []
                          const isEmpty = assignedPlayers.length === 0
                          
                          return (
                            <div key={`boys_doubles_${num}`} className={`border-2 rounded-lg p-3 min-h-[60px] flex items-center ${
                              isEmpty 
                                ? 'border-dashed border-blue-200 bg-blue-50' 
                                : 'border-solid border-blue-300 bg-blue-100'
                            }`}>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{num}st Boys Doubles</div>
                                {!isEmpty && (
                                  <div className="text-xs text-green-600 font-medium">
                                    {assignedPlayers.map(p => p.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Girls Division */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-pink-700">Girls Division</h4>
                    
                    {/* Girls Singles */}
                    <div>
                      <h5 className="font-medium mb-2 text-sm">Girls Singles</h5>
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          const positionKey = `${num}GS`
                          const assignedPlayers = currentLineup[positionKey] || []
                          const isEmpty = assignedPlayers.length === 0
                          
                          return (
                            <div key={`girls_singles_${num}`} className={`border-2 rounded-lg p-3 min-h-[60px] flex items-center ${
                              isEmpty 
                                ? 'border-dashed border-pink-200 bg-pink-50' 
                                : 'border-solid border-pink-300 bg-pink-100'
                            }`}>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{num}st Girls Singles</div>
                                {!isEmpty && (
                                  <div className="text-xs text-green-600 font-medium">
                                    {assignedPlayers.map(p => p.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Girls Doubles */}
                    <div>
                      <h5 className="font-medium mb-2 text-sm">Girls Doubles</h5>
                      <div className="space-y-2">
                        {[1, 2].map((num) => {
                          const positionKey = `${num}GD`
                          const assignedPlayers = currentLineup[positionKey] || []
                          const isEmpty = assignedPlayers.length === 0
                          
                          return (
                            <div key={`girls_doubles_${num}`} className={`border-2 rounded-lg p-3 min-h-[60px] flex items-center ${
                              isEmpty 
                                ? 'border-dashed border-pink-200 bg-pink-50' 
                                : 'border-solid border-pink-300 bg-pink-100'
                            }`}>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{num}st Girls Doubles</div>
                                {!isEmpty && (
                                  <div className="text-xs text-green-600 font-medium">
                                    {assignedPlayers.map(p => p.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mixed Doubles */}
                <div className="mt-6">
                  <h4 className="font-medium text-purple-700 mb-2">Mixed Doubles</h4>
                  <div className={`border-2 rounded-lg p-3 min-h-[60px] flex items-center ${
                    currentLineup['MD']?.length === 0
                      ? 'border-dashed border-purple-200 bg-purple-50'
                      : 'border-solid border-purple-300 bg-purple-100'
                  }`}>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Mixed Doubles</div>
                      {currentLineup['MD'] && currentLineup['MD'].length > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          {currentLineup['MD'].map(p => p.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={() => setShowCreateDialog(true)}>
                  Create Lineup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Players Message */}
      {players.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No players available</h3>
            <p className="text-gray-600 mb-4">Add players to your team first to create lineups</p>
            <Button onClick={() => window.location.href = '/dashboard/team'}>
              <Plus className="h-4 w-4 mr-2" />
              Add Players
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Lineup Dialog */}
      <CreateLineupDialog
        players={players}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        selectedTeamLevel={selectedTeamLevel || undefined}
        teamId={currentTeam?.id}
        currentLineup={getDialogLineupFormat()}
        onLineupCreated={() => {
          if (currentTeam) {
            loadLineups(currentTeam.id)
          }
        }}
      />
    </div>
  )
}