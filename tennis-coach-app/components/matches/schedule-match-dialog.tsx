'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { matchSchema, type MatchFormData } from '@/lib/validations'
import { useTeamStore } from '@/stores/team-store'
import { supabase } from '@/lib/supabase'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Team } from '@/lib/types'

interface ScheduleMatchDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScheduleMatchDialog({ teamId, open, onOpenChange }: ScheduleMatchDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const createMatch = useTeamStore((state) => state.createMatch)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
  })

  const awayTeamId = watch('away_team_id')

  // Load available teams (excluding current team)
  useEffect(() => {
    if (open) {
      loadAvailableTeams()
    }
  }, [open, teamId])

  const loadAvailableTeams = async () => {
    setLoadingTeams(true)
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .neq('id', teamId)
        .order('school_name')

      if (error) {
        console.error('Error loading teams:', error)
        toast.error('Failed to load teams')
        return
      }

      setAvailableTeams(teams || [])
    } catch (error) {
      console.error('Error loading teams:', error)
      toast.error('Failed to load teams')
    } finally {
      setLoadingTeams(false)
    }
  }

  const onSubmit = async (data: MatchFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await createMatch({
        home_team_id: teamId,
        away_team_id: data.away_team_id,
        match_date: data.match_date,
        match_time: data.match_time || undefined,
        location: data.location || undefined,
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
            <Label htmlFor="away_team_id">Opponent Team *</Label>
            <Select
              value={awayTeamId || ''}
              onValueChange={(value) => setValue('away_team_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTeams ? "Loading teams..." : "Select opponent team"} />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.school_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.away_team_id && (
              <p className="text-sm text-red-600">{errors.away_team_id.message}</p>
            )}
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
            <Button type="submit" disabled={isLoading || loadingTeams}>
              {isLoading ? 'Scheduling...' : 'Schedule Match'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
