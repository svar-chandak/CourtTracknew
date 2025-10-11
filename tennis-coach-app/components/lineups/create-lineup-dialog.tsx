'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { GripVertical, Users, Trophy } from 'lucide-react'
import type { Player } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface CreateLineupDialogProps {
  players: Player[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onLineupCreated?: (lineup: Record<string, string[]>) => void
  selectedTeamLevel?: 'varsity' | 'jv' | 'freshman'
  teamId?: string
  currentLineup?: Record<string, string[]>
}

const positions = [
  { id: '1GS', name: 'Girls Line 1', type: 'singles', gender: 'female', maxPlayers: 1, rosterOrder: 1 },
  { id: '2GS', name: 'Girls Line 2', type: 'singles', gender: 'female', maxPlayers: 1, rosterOrder: 2 },
  { id: '3GS', name: 'Girls Line 3', type: 'singles', gender: 'female', maxPlayers: 1, rosterOrder: 3 },
  { id: '4GS', name: 'Girls Line 4', type: 'singles', gender: 'female', maxPlayers: 1, rosterOrder: 4 },
  { id: '5GS', name: 'Girls Line 5', type: 'singles', gender: 'female', maxPlayers: 1, rosterOrder: 5 },
  { id: '6GS', name: 'Girls Line 6', type: 'singles', gender: 'female', maxPlayers: 1, rosterOrder: 6 },
  { id: '1BS', name: 'Boys Line 1', type: 'singles', gender: 'male', maxPlayers: 1, rosterOrder: 1 },
  { id: '2BS', name: 'Boys Line 2', type: 'singles', gender: 'male', maxPlayers: 1, rosterOrder: 2 },
  { id: '3BS', name: 'Boys Line 3', type: 'singles', gender: 'male', maxPlayers: 1, rosterOrder: 3 },
  { id: '4BS', name: 'Boys Line 4', type: 'singles', gender: 'male', maxPlayers: 1, rosterOrder: 4 },
  { id: '5BS', name: 'Boys Line 5', type: 'singles', gender: 'male', maxPlayers: 1, rosterOrder: 5 },
  { id: '6BS', name: 'Boys Line 6', type: 'singles', gender: 'male', maxPlayers: 1, rosterOrder: 6 },
  { id: '1GD', name: 'Girls Doubles 1', type: 'doubles', gender: 'female', maxPlayers: 2, rosterOrder: 7 },
  { id: '2GD', name: 'Girls Doubles 2', type: 'doubles', gender: 'female', maxPlayers: 2, rosterOrder: 8 },
  { id: '1BD', name: 'Boys Doubles 1', type: 'doubles', gender: 'male', maxPlayers: 2, rosterOrder: 7 },
  { id: '2BD', name: 'Boys Doubles 2', type: 'doubles', gender: 'male', maxPlayers: 2, rosterOrder: 8 },
  { id: 'MD', name: 'Mixed Doubles', type: 'mixed', gender: 'mixed', maxPlayers: 2, rosterOrder: 9 },
]

interface DraggablePlayerProps {
  player: Player
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
  positionGender?: 'male' | 'female' | 'mixed'
}

function DraggablePlayer({ player, isSelected, onToggle, disabled, positionGender }: DraggablePlayerProps) {
  // Check if this player can be placed in this position
  // Allow if player's gender is unknown; only block when known and mismatched
  const canPlace = !positionGender || positionGender === 'mixed' || !player.gender || positionGender === player.gender
  
  return (
    <button
      type="button"
      style={{ pointerEvents: 'auto' }}
      className={`w-full text-left p-3 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-green-100 border-green-300 shadow-md' 
          : canPlace 
            ? 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
      } ${disabled || !canPlace ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => {
        if (!disabled && canPlace) {
          onToggle()
        }
      }}
      onKeyDown={(e) => {
        if (disabled || !canPlace) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{player.name}</div>
          <div className="text-xs text-gray-500">
            {player.grade && `Grade ${player.grade}`}
            {player.team_level && ` • ${player.team_level === 'varsity' ? 'Varsity' : player.team_level === 'jv' ? 'JV' : 'Freshman'}`}
            {player.utr_rating && ` • UTR ${player.utr_rating}`}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isSelected && <Badge variant="default" className="text-xs">Selected</Badge>}
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </button>
  )
}

interface PositionDropZoneProps {
  position: typeof positions[0]
  selectedPlayers: string[]
  allPlayers: Player[]
  onPlayerToggle: (positionId: string, playerId: string) => void
}

function PositionDropZone({ position, selectedPlayers, allPlayers, onPlayerToggle, lineup }: PositionDropZoneProps & { lineup: Record<string, string[]> }) {
  const selectedPlayerObjects = selectedPlayers.map(id => allPlayers.find(p => p.id === id)).filter(Boolean) as Player[]
  
  // Get players assigned to conflicting positions
  let conflictingPlayers: string[] = []
  
  if (position.type === 'singles') {
    // For singles: exclude players already in ANY other singles position
    const singlesPositions = ['1GS', '2GS', '3GS', '4GS', '5GS', '6GS', '1BS', '2BS', '3BS', '4BS', '5BS', '6BS']
    conflictingPlayers = singlesPositions
      .filter(posId => posId !== position.id)
      .flatMap(posId => lineup[posId] || [])
  } else if (position.type === 'doubles' || position.type === 'mixed') {
    // For any doubles position: exclude players already in ANY other doubles position (regular or mixed)
    const doublesPositions = ['1GD', '2GD', '1BD', '2BD', 'MD']
    conflictingPlayers = doublesPositions
      .filter(posId => posId !== position.id)
      .flatMap(posId => lineup[posId] || [])
  }
  
  // Filter available players - exclude players in ANY lineup position (only those visible in this dialog)
  const visiblePlayerIds = new Set(allPlayers.map(p => p.id))
  const allAssignedPlayers = Object.values(lineup).flat().filter(id => visiblePlayerIds.has(id))
  let availablePlayers = allPlayers.filter(p => !allAssignedPlayers.includes(p.id))
  
  // Add back players who are selected in THIS position (they should show as available to deselect)
  const currentPositionPlayers = lineup[position.id] || []
  availablePlayers = [...availablePlayers, ...currentPositionPlayers.map(id => allPlayers.find(p => p.id === id)).filter(Boolean) as Player[]]
  
  // Remove duplicates
  availablePlayers = availablePlayers.filter((player, index, self) => 
    index === self.findIndex(p => p.id === player.id)
  )
  
  if (position.gender === 'female') {
    availablePlayers = availablePlayers.filter(p => p.gender === 'female')
  } else if (position.gender === 'male') {
    availablePlayers = availablePlayers.filter(p => p.gender === 'male')
  } else if (position.gender === 'mixed') {
    // For mixed doubles, show all players but we'll validate in the toggle function
    availablePlayers = availablePlayers
  }

  // Sort players by name to maintain consistent roster order
  availablePlayers = availablePlayers.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Card className="min-h-[200px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{position.name}</span>
          <Badge variant="outline" className="text-xs">
            {selectedPlayerObjects.length}/{position.maxPlayers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Selected Players */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Selected Players</Label>
          {selectedPlayerObjects.length > 0 ? (
            <div className="space-y-1">
              {selectedPlayerObjects.map((player) => (
                <DraggablePlayer
                  key={player.id}
                  player={player}
                  isSelected={true}
                  onToggle={() => onPlayerToggle(position.id, player.id)}
                  positionGender={position.gender as 'male' | 'female' | 'mixed'}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Available Players */}
        {availablePlayers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Available Players</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {availablePlayers.map((player) => (
                <DraggablePlayer
                  key={player.id}
                  player={player}
                  isSelected={false}
                  onToggle={() => onPlayerToggle(position.id, player.id)}
                  disabled={selectedPlayerObjects.length >= position.maxPlayers}
                  positionGender={position.gender as 'male' | 'female' | 'mixed'}
                />
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

export function CreateLineupDialog({ players, open, onOpenChange, onLineupCreated, selectedTeamLevel, teamId, currentLineup }: CreateLineupDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lineup, setLineup] = useState<Record<string, string[]>>({})

  // Filter players by selected team level and sort by name to maintain roster order
  const filteredPlayers = selectedTeamLevel 
    ? players.filter(player => player.team_level === selectedTeamLevel).sort((a, b) => a.name.localeCompare(b.name))
    : players.sort((a, b) => a.name.localeCompare(b.name))

  // Load current lineup when dialog opens
  useEffect(() => {
    if (open) {
      if (currentLineup && Object.keys(currentLineup).length > 0) {
        setLineup(currentLineup)
      } else {
        setLineup({})
      }
    }
  }, [open, currentLineup])

  // Clean lineup when filteredPlayers changes (remove invalid player IDs)
  useEffect(() => {
    if (open && Object.keys(lineup).length > 0) {
      const validPlayerIds = new Set(filteredPlayers.map(p => p.id))
      const cleanedLineup: Record<string, string[]> = {}
      
      Object.entries(lineup).forEach(([positionId, playerIds]) => {
        const validIds = playerIds.filter(id => validPlayerIds.has(id))
        if (validIds.length > 0) {
          cleanedLineup[positionId] = validIds
        }
      })
      
      // Only update if there's a change
      const hasChanges = Object.keys(cleanedLineup).length !== Object.keys(lineup).length ||
        Object.entries(cleanedLineup).some(([posId, ids]) => 
          !lineup[posId] || lineup[posId].length !== ids.length || 
          !ids.every(id => lineup[posId].includes(id))
        )
      
      if (hasChanges) {
        setLineup(cleanedLineup)
      }
    }
  }, [filteredPlayers, open, lineup])




  const handlePlayerToggle = (positionId: string, playerId: string) => {
    setLineup(prev => {
      const current = prev[positionId] || []
      const position = positions.find(p => p.id === positionId)
      const player = filteredPlayers.find(p => p.id === playerId)
      
      if (!position || !player) return prev
      
      // Check gender validation (allow if player's gender is unknown)
      if (position.gender !== 'mixed' && player.gender && position.gender !== player.gender) {
        toast.error(`${position.name} is for ${position.gender === 'female' ? 'girls' : 'boys'} only`)
        return prev
      }
      
      // For mixed doubles, check if we have one of each gender
      if (position.gender === 'mixed') {
        const currentPlayers = current.map(id => filteredPlayers.find(p => p.id === id)).filter(Boolean) as Player[]
        const hasMale = currentPlayers.some(p => p.gender === 'male')
        const hasFemale = currentPlayers.some(p => p.gender === 'female')
        
        if (current.includes(playerId)) {
          // Remove player
          return { ...prev, [positionId]: current.filter(id => id !== playerId) }
        } else if (current.length < position.maxPlayers) {
          // Add player if we don't already have both genders or if this player completes the pair
          if (current.length === 0 || (current.length === 1 && ((hasMale && player.gender === 'female') || (hasFemale && player.gender === 'male')))) {
            // Remove player from all other positions first
            const newLineup = { ...prev }
            Object.keys(newLineup).forEach(posId => {
              if (posId !== positionId) {
                newLineup[posId] = (newLineup[posId] || []).filter(id => id !== playerId)
              }
            })
            newLineup[positionId] = [...current, playerId]
            return newLineup
          } else {
            toast.error('Mixed doubles needs one boy and one girl')
            return prev
          }
        }
      } else {
        if (current.includes(playerId)) {
          // Remove player
          return { ...prev, [positionId]: current.filter(id => id !== playerId) }
        } else if (current.length < position.maxPlayers) {
          // Add player and remove from conflicting positions
          const newLineup = { ...prev }
          
          // Determine which positions conflict with this one
          let conflictingPositions: string[] = []
          
          if (position.type === 'singles') {
            // For singles: remove from other singles positions
            const singlesPositions = ['1GS', '2GS', '3GS', '4GS', '5GS', '6GS', '1BS', '2BS', '3BS', '4BS', '5BS', '6BS']
            conflictingPositions = singlesPositions.filter(posId => posId !== positionId)
          } else if (position.type === 'doubles' || position.type === 'mixed') {
            // For any doubles position: remove from other doubles positions (regular or mixed)
            const doublesPositions = ['1GD', '2GD', '1BD', '2BD', 'MD']
            conflictingPositions = doublesPositions.filter(posId => posId !== positionId)
          }
          
          // Remove player from conflicting positions
          conflictingPositions.forEach(posId => {
            newLineup[posId] = (newLineup[posId] || []).filter(id => id !== playerId)
          })
          
          // Add player to current position
          newLineup[positionId] = [...current, playerId]
          
          return newLineup
        }
      }
      
      return prev
    })
  }


  const onSubmit = async () => {
    if (!teamId) {
      toast.error('Team ID is required to save lineup')
      return
    }

    setIsLoading(true)
    
    try {
      // Convert the lineup format to database format
      const lineupEntries = Object.entries(lineup).map(([positionId, playerIds]) => {
        const position = positions.find(p => p.id === positionId)
        if (!position) return null

        // Map position types to database position names
        let positionName: string
        if (position.type === 'singles') {
          positionName = position.gender === 'male' ? `boys_singles_${position.rosterOrder}` : `girls_singles_${position.rosterOrder}`
        } else if (position.type === 'doubles') {
          positionName = position.gender === 'male' ? `boys_doubles_${position.rosterOrder}` : `girls_doubles_${position.rosterOrder}`
        } else if (position.type === 'mixed') {
          positionName = 'mixed_doubles_1'
        } else {
          return null
        }

        return {
          team_id: teamId,
          match_id: null, // For now, we'll create general lineups without specific matches
          position: positionName,
          player_ids: playerIds
        }
      }).filter(Boolean)

      if (lineupEntries.length === 0) {
        toast.error('No valid lineup positions to save')
        return
      }

      // Save to database
      console.log('Attempting to save lineup entries:', lineupEntries)
      const { error } = await supabase
        .from('lineups')
        .insert(lineupEntries)

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      toast.success('Lineup created successfully!')
      onLineupCreated?.(lineup)
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating lineup:', error)
      toast.error('Failed to save lineup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Create Match Lineup
          </DialogTitle>
          <DialogDescription>
            Click on players to assign them to positions. Singles positions need 1 player, doubles need 2.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position) => (
                <div key={position.id} id={position.id}>
                  <PositionDropZone
                    position={position}
                    selectedPlayers={lineup[position.id] || []}
                    allPlayers={filteredPlayers}
                    onPlayerToggle={handlePlayerToggle}
                    lineup={lineup}
                  />
                </div>
              ))}
            </div>

            {/* Lineup Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Lineup Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Singles</h4>
                    <div className="space-y-1">
                      {positions.filter(p => p.type === 'singles').map(position => {
                        const selectedPlayers = lineup[position.id] || []
                        return (
                          <div key={position.id} className="text-sm">
                            <span className="font-medium">{position.name}:</span>{' '}
                            {selectedPlayers.length > 0 ? (
                              <span className="text-green-600">
                                {selectedPlayers.map(id => filteredPlayers.find(p => p.id === id)?.name).join(', ')}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Doubles</h4>
                    <div className="space-y-1">
                      {positions.filter(p => p.type === 'doubles' || p.type === 'mixed').map(position => {
                        const selectedPlayers = lineup[position.id] || []
                        return (
                          <div key={position.id} className="text-sm">
                            <span className="font-medium">{position.name}:</span>{' '}
                            {selectedPlayers.length > 0 ? (
                              <span className="text-green-600">
                                {selectedPlayers.map(id => filteredPlayers.find(p => p.id === id)?.name).join(', ')}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

        {/* Save Button */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setLineup({})}
            disabled={isLoading}
          >
            Clear Lineup
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Lineup'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
