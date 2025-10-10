'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lineupSchema, type LineupFormData } from '@/lib/validations'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { GripVertical, Users, Trophy } from 'lucide-react'
import type { Player } from '@/lib/types'

interface CreateLineupDialogProps {
  players: Player[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onLineupCreated?: (lineup: Record<string, string[]>) => void
}

const positions = [
  { id: '1S', name: '1st Singles', type: 'singles', maxPlayers: 1 },
  { id: '2S', name: '2nd Singles', type: 'singles', maxPlayers: 1 },
  { id: '3S', name: '3rd Singles', type: 'singles', maxPlayers: 1 },
  { id: '4S', name: '4th Singles', type: 'singles', maxPlayers: 1 },
  { id: '5S', name: '5th Singles', type: 'singles', maxPlayers: 1 },
  { id: '6S', name: '6th Singles', type: 'singles', maxPlayers: 1 },
  { id: '1D', name: '1st Doubles', type: 'doubles', maxPlayers: 2 },
  { id: '2D', name: '2nd Doubles', type: 'doubles', maxPlayers: 2 },
  { id: '3D', name: '3rd Doubles', type: 'doubles', maxPlayers: 2 },
]

interface DraggablePlayerProps {
  player: Player
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
}

function DraggablePlayer({ player, isSelected, onToggle, disabled }: DraggablePlayerProps) {
  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-green-100 border-green-300 shadow-md' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onToggle}
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
    </div>
  )
}

interface PositionDropZoneProps {
  position: typeof positions[0]
  selectedPlayers: string[]
  allPlayers: Player[]
  onPlayerToggle: (positionId: string, playerId: string) => void
}

function PositionDropZone({ position, selectedPlayers, allPlayers, onPlayerToggle }: PositionDropZoneProps) {
  const selectedPlayerObjects = selectedPlayers.map(id => allPlayers.find(p => p.id === id)).filter(Boolean) as Player[]
  const availablePlayers = allPlayers.filter(p => !selectedPlayers.includes(p.id))

  return (
    <Card className="min-h-[200px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{position.name}</span>
          <Badge variant="outline" className="text-xs">
            {selectedPlayers.length}/{position.maxPlayers}
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              Drag players here or click to select
            </div>
          )}
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
                  disabled={selectedPlayers.length >= position.maxPlayers}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CreateLineupDialog({ players, open, onOpenChange, onLineupCreated }: CreateLineupDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lineup, setLineup] = useState<Record<string, string[]>>({})
  const [activePlayer, setActivePlayer] = useState<Player | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const {
    handleSubmit,
    formState: { errors },
  } = useForm<LineupFormData>({
    resolver: zodResolver(lineupSchema),
  })

  const handlePlayerToggle = (positionId: string, playerId: string) => {
    setLineup(prev => {
      const current = prev[positionId] || []
      const position = positions.find(p => p.id === positionId)
      
      if (current.includes(playerId)) {
        // Remove player
        return { ...prev, [positionId]: current.filter(id => id !== playerId) }
      } else if (current.length < (position?.maxPlayers || 1)) {
        // Add player
        return { ...prev, [positionId]: [...current, playerId] }
      }
      
      return prev
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const playerId = event.active.id as string
    const player = players.find(p => p.id === playerId)
    setActivePlayer(player || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActivePlayer(null)

    if (!over) return

    const playerId = active.id as string
    const positionId = over.id as string

    // Check if player is already in this position
    const currentPositionPlayers = lineup[positionId] || []
    if (currentPositionPlayers.includes(playerId)) return

    // Check if position can accommodate more players
    const position = positions.find(p => p.id === positionId)
    if (!position || currentPositionPlayers.length >= position.maxPlayers) return

    // Remove player from any other position
    const newLineup = { ...lineup }
    Object.keys(newLineup).forEach(posId => {
      newLineup[posId] = newLineup[posId].filter(id => id !== playerId)
    })

    // Add player to new position
    newLineup[positionId] = [...(newLineup[positionId] || []), playerId]

    setLineup(newLineup)
  }

  const onSubmit = async (data: LineupFormData) => {
    setIsLoading(true)
    
    try {
      console.log('Creating lineup:', lineup)
      toast.success('Lineup created successfully!')
      onLineupCreated?.(lineup)
      onOpenChange(false)
      setLineup({})
    } catch (error) {
      toast.error('An unexpected error occurred')
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
            Drag and drop players to positions or click to select. Singles positions need 1 player, doubles need 2.
          </DialogDescription>
        </DialogHeader>
        
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position) => (
                <div key={position.id} id={position.id}>
                  <PositionDropZone
                    position={position}
                    selectedPlayers={lineup[position.id] || []}
                    allPlayers={players}
                    onPlayerToggle={handlePlayerToggle}
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
                                {selectedPlayers.map(id => players.find(p => p.id === id)?.name).join(', ')}
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
                      {positions.filter(p => p.type === 'doubles').map(position => {
                        const selectedPlayers = lineup[position.id] || []
                        return (
                          <div key={position.id} className="text-sm">
                            <span className="font-medium">{position.name}:</span>{' '}
                            {selectedPlayers.length > 0 ? (
                              <span className="text-green-600">
                                {selectedPlayers.map(id => players.find(p => p.id === id)?.name).join(', ')}
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

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLineup({})
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Lineup'}
              </Button>
            </div>
          </form>

          <DragOverlay>
            {activePlayer ? (
              <div className="p-3 bg-white border rounded-lg shadow-lg">
                <div className="font-medium text-sm">{activePlayer.name}</div>
                <div className="text-xs text-gray-500">
                  {activePlayer.grade && `Grade ${activePlayer.grade}`}
                  {activePlayer.team_level && ` • ${activePlayer.team_level === 'varsity' ? 'Varsity' : activePlayer.team_level === 'jv' ? 'JV' : 'Freshman'}`}
                  {activePlayer.utr_rating && ` • UTR ${activePlayer.utr_rating}`}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </DialogContent>
    </Dialog>
  )
}
