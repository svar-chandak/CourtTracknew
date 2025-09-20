'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lineupSchema, type LineupFormData } from '@/lib/validations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Player } from '@/lib/types'

interface CreateLineupDialogProps {
  players: Player[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export function CreateLineupDialog({ players, open, onOpenChange }: CreateLineupDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lineup, setLineup] = useState<Record<string, string[]>>({})

  const {
    handleSubmit,
    formState: { errors },
  } = useForm<LineupFormData>({
    resolver: zodResolver(lineupSchema),
  })

  const handlePlayerSelect = (positionId: string, playerId: string, isSelected: boolean) => {
    setLineup(prev => {
      const current = prev[positionId] || []
      if (isSelected) {
        // Add player if not already selected and position can accommodate
        const position = positions.find(p => p.id === positionId)
        const maxPlayers = position?.type === 'singles' ? 1 : 2
        if (current.length < maxPlayers && !current.includes(playerId)) {
          return { ...prev, [positionId]: [...current, playerId] }
        }
      } else {
        // Remove player
        return { ...prev, [positionId]: current.filter(id => id !== playerId) }
      }
      return prev
    })
  }

  const onSubmit = async (data: LineupFormData) => {
    setIsLoading(true)
    
    try {
      // For now, just show success - in a real app, this would save to database
      console.log('Creating lineup:', lineup)
      toast.success('Lineup created successfully!')
      onOpenChange(false)
      setLineup({})
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getSelectedPlayers = (positionId: string) => {
    return lineup[positionId] || []
  }

  const isPlayerSelected = (positionId: string, playerId: string) => {
    return getSelectedPlayers(positionId).includes(playerId)
  }

  const canSelectMore = (positionId: string) => {
    const position = positions.find(p => p.id === positionId)
    const maxPlayers = position?.type === 'singles' ? 1 : 2
    return getSelectedPlayers(positionId).length < maxPlayers
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Match Lineup</DialogTitle>
          <DialogDescription>
            Select players for each position in your lineup.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Lineup Positions</h3>
            
            {positions.map((position) => (
              <div key={position.id} className="space-y-2">
                <Label className="text-sm font-medium">
                  {position.name}
                </Label>
                
                <div className="grid grid-cols-2 gap-2">
                  {players.map((player) => {
                    const isSelected = isPlayerSelected(position.id, player.id)
                    const canSelect = canSelectMore(position.id)
                    const disabled = !isSelected && !canSelect
                    
                    return (
                      <Button
                        key={player.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        disabled={disabled}
                        onClick={() => handlePlayerSelect(position.id, player.id, !isSelected)}
                        className="justify-start text-left h-auto p-2"
                      >
                        <div>
                          <div className="font-medium text-sm">{player.name}</div>
                          <div className="text-xs opacity-70">
                            {player.grade && `Grade ${player.grade}`}
                            {player.team_level && ` • ${player.team_level === 'varsity' ? 'Varsity' : player.team_level === 'jv' ? 'JV' : 'Freshman'}`}
                            {player.utr_rating && ` • UTR ${player.utr_rating}`}
                          </div>
                        </div>
                      </Button>
                    )
                  })}
                </div>
                
                <div className="text-xs text-gray-500">
                  Selected: {getSelectedPlayers(position.id).length} / {position.type === 'singles' ? '1' : '2'}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Lineup'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
