'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Users, Edit, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTeamStore } from '@/stores/team-store'
import type { Player } from '@/lib/types'

interface MassEditPlayersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  players: Player[]
  onPlayersUpdated: () => void
}

export function MassEditPlayersDialog({ 
  open, 
  onOpenChange, 
  players, 
  onPlayersUpdated 
}: MassEditPlayersDialogProps) {
  const { bulkUpdatePlayers } = useTeamStore()
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [bulkTeamLevel, setBulkTeamLevel] = useState<string>('')
  const [bulkGender, setBulkGender] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Filter to only show unassigned players
  const unassignedPlayers = players.filter(p => !p.team_level)

  const handleSelectPlayer = (playerId: string, checked: boolean) => {
    const newSelected = new Set(selectedPlayers)
    if (checked) {
      newSelected.add(playerId)
    } else {
      newSelected.delete(playerId)
    }
    setSelectedPlayers(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlayers(new Set(unassignedPlayers.map(p => p.id)))
    } else {
      setSelectedPlayers(new Set())
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedPlayers.size === 0) {
      toast.error('Please select at least one player')
      return
    }

    if (!bulkTeamLevel && !bulkGender) {
      toast.error('Please select at least one field to update')
      return
    }

    setIsUpdating(true)

    try {
      const updates = Array.from(selectedPlayers).map(playerId => {
        const updateData: any = { id: playerId }
        if (bulkTeamLevel) updateData.team_level = bulkTeamLevel
        if (bulkGender) updateData.gender = bulkGender
        return updateData
      })

      const { error } = await bulkUpdatePlayers(updates)
      
      if (error) {
        toast.error(error)
      } else {
        toast.success(`Updated ${selectedPlayers.size} players successfully`)
        setSelectedPlayers(new Set())
        setBulkTeamLevel('')
        setBulkGender('')
        onPlayersUpdated()
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error updating players:', error)
      toast.error('Failed to update players')
    } finally {
      setIsUpdating(false)
    }
  }

  const selectedCount = selectedPlayers.size
  const allSelected = unassignedPlayers.length > 0 && selectedCount === unassignedPlayers.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Mass Edit Players
          </DialogTitle>
          <DialogDescription>
            Select players and assign team levels and genders in bulk
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Bulk Assignment Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bulk Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="team-level">Team Level</Label>
                  <Select value={bulkTeamLevel} onValueChange={setBulkTeamLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="varsity">Varsity</SelectItem>
                      <SelectItem value="jv">Junior Varsity</SelectItem>
                      <SelectItem value="freshman">Freshman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={bulkGender} onValueChange={setBulkGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleBulkUpdate}
                  disabled={selectedCount === 0 || (!bulkTeamLevel && !bulkGender) || isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? 'Saving...' : `Save Changes (${selectedCount} Players)`}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedPlayers(new Set())
                    setBulkTeamLevel('')
                    setBulkGender('')
                  }}
                >
                  Clear All
                </Button>
              </div>
              
              {selectedCount > 0 && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>Ready to update {selectedCount} players:</strong>
                  {bulkTeamLevel && <span className="ml-2">Team Level: {bulkTeamLevel}</span>}
                  {bulkGender && <span className="ml-2">Gender: {bulkGender}</span>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Player Selection */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Players ({unassignedPlayers.length} unassigned)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm">
                    Select All
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-96">
              {unassignedPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No unassigned players found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unassignedPlayers.map((player) => {
                    const isSelected = selectedPlayers.has(player.id)
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Checkbox
                          id={`player-${player.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectPlayer(player.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label 
                              htmlFor={`player-${player.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {player.name}
                            </Label>
                            {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                          </div>
                          <p className="text-xs text-gray-500 font-mono">
                            ID: {player.id}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="destructive" className="text-xs">
                            No Team Level
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            No Gender
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
