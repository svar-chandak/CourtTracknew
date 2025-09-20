'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { matchSchema, type MatchFormData } from '@/lib/validations'
import { useTeamStore } from '@/stores/team-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { TeamSearch } from '@/components/teams/team-search'
import type { Team } from '@/lib/types'

interface ScheduleMatchDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScheduleMatchDialog({ teamId, open, onOpenChange }: ScheduleMatchDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOpponentTeam, setSelectedOpponentTeam] = useState<Team | null>(null)
  const createMatch = useTeamStore((state) => state.createMatch)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      home_team_id: teamId,
      match_type: 'team_match',
    }
  })

  // Handle team selection
  const handleTeamSelect = (team: Team) => {
    setSelectedOpponentTeam(team)
    setValue('away_team_id', team.id)
  }

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset()
      setSelectedOpponentTeam(null)
    }
  }, [open, reset])

  const onSubmit = async (data: MatchFormData) => {
    // Debug logging
    console.log('Form submission data:', data)
    console.log('Selected opponent team:', selectedOpponentTeam)
    
    // Validate that a team is selected
    if (!selectedOpponentTeam) {
      toast.error('Please select an opponent team')
      return
    }

    // Validate that away_team_id is not empty
    if (!data.away_team_id || !data.away_team_id.trim()) {
      toast.error('Please select an opponent team')
      return
    }

    // Validate that away_team_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(data.away_team_id)) {
      toast.error('Invalid team selection. Please select a team again.')
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await createMatch({
        home_team_id: teamId,
        away_team_id: data.away_team_id,
        match_date: data.match_date,
        match_time: data.match_time || undefined,
        location: data.location || undefined,
        match_type: data.match_type,
        notes: data.notes || undefined,
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        created_by: '', // Will be set by the store
      })
      
      if (error) {
        toast.error(error)
      } else {
        toast.success('Match scheduled successfully!')
        reset()
        onOpenChange(false)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule New Match</DialogTitle>
          <DialogDescription>
            Create a new match for your team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Opponent Team *</Label>
            {selectedOpponentTeam ? (
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedOpponentTeam.school_name}</h4>
                    <p className="text-sm text-gray-600">
                      Team Code: #{selectedOpponentTeam.team_code}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedOpponentTeam(null)
                      setValue('away_team_id', '')
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <TeamSearch
                  onTeamSelect={handleTeamSelect}
                  currentTeamId={teamId}
                  placeholder="Search for opponent team by team code or school name..."
                />
              </div>
            )}
            {errors.away_team_id && (
              <p className="text-sm text-red-600">{errors.away_team_id.message}</p>
            )}
            {/* Hidden input to ensure away_team_id is properly set */}
            <input type="hidden" {...register('away_team_id')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="match_date">Match Date *</Label>
              <Input
                id="match_date"
                type="date"
                {...register('match_date')}
              />
              {errors.match_date && (
                <p className="text-sm text-red-600">{errors.match_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="match_time">Match Time</Label>
              <Input
                id="match_time"
                type="time"
                {...register('match_time')}
              />
              {errors.match_time && (
                <p className="text-sm text-red-600">{errors.match_time.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Home Courts, Opponent School"
              {...register('location')}
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about the match..."
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !selectedOpponentTeam}
            >
              {isLoading ? 'Scheduling...' : 'Schedule Match'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
