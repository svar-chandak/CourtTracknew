'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTeamMatchStore } from '@/stores/team-match-store'
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
import type { CreateTeamMatchData } from '@/lib/team-match-types'

const createTeamMatchSchema = z.object({
  away_team_code: z.string().min(1, 'Opponent team code is required'),
  team_level: z.enum(['varsity', 'jv', 'freshman']),
  match_date: z.string().min(1, 'Match date is required'),
  match_time: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type CreateTeamMatchFormData = z.infer<typeof createTeamMatchSchema>

interface CreateTeamMatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMatchCreated: () => void
}

export function CreateTeamMatchDialog({ open, onOpenChange, onMatchCreated }: CreateTeamMatchDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [foundTeam, setFoundTeam] = useState<any>(null)
  const { createTeamMatch, findTeamByCode } = useTeamMatchStore()
  const { currentTeam } = useTeamStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateTeamMatchFormData>({
    resolver: zodResolver(createTeamMatchSchema),
    defaultValues: {
      team_level: 'varsity',
      match_date: new Date().toISOString().split('T')[0]
    }
  })

  const teamLevel = watch('team_level')

  const onSubmit = async (data: CreateTeamMatchFormData) => {
    if (!currentTeam) {
      toast.error('Team information not available')
      return
    }

    setIsLoading(true)
    
    try {
      // First, find the team by team code
      const { team, error: findError } = await findTeamByCode(data.away_team_code)
      
      if (findError || !team) {
        toast.error(findError || 'Team not found with that code')
        return
      }

      const matchData: CreateTeamMatchData = {
        away_team_id: team.id,
        team_level: data.team_level,
        match_date: data.match_date,
        match_time: data.match_time && data.match_time.trim() !== '' ? data.match_time : undefined,
        location: data.location && data.location.trim() !== '' ? data.location : undefined,
        notes: data.notes && data.notes.trim() !== '' ? data.notes : undefined,
      }

      const { error } = await createTeamMatch(matchData)

      if (error) {
        toast.error(error)
        return
      }

      toast.success(`Team match scheduled successfully against ${team.school_name}!`)
      reset()
      setFoundTeam(null)
      onMatchCreated()
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeamCodeChange = async (teamCode: string) => {
    if (teamCode && teamCode.trim().length >= 3) {
      const { team, error } = await findTeamByCode(teamCode.trim())
      if (team && !error) {
        setFoundTeam(team)
      } else {
        setFoundTeam(null)
      }
    } else {
      setFoundTeam(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Team Match</DialogTitle>
          <DialogDescription>
            Schedule a {currentTeam?.school_name} team match against another school
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team_level">Team Level</Label>
            <Select value={teamLevel} onValueChange={(value) => setValue('team_level', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select team level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="varsity">Varsity</SelectItem>
                <SelectItem value="jv">JV</SelectItem>
                <SelectItem value="freshman">Freshman</SelectItem>
              </SelectContent>
            </Select>
            {errors.team_level && (
              <p className="text-sm text-red-600">{errors.team_level.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="away_team_code">Opponent Team Code</Label>
            <Input
              id="away_team_code"
              placeholder="Enter opponent's team code (e.g., ABC123)"
              {...register('away_team_code')}
              onChange={(e) => {
                register('away_team_code').onChange(e)
                handleTeamCodeChange(e.target.value)
              }}
            />
            {errors.away_team_code && (
              <p className="text-sm text-red-600">{errors.away_team_code.message}</p>
            )}
            {foundTeam && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ Found: {foundTeam.school_name} ({foundTeam.team_level.toUpperCase()})
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Ask the opponent coach for their team code
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="match_date">Match Date</Label>
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
              <Label htmlFor="match_time">Match Time (Optional)</Label>
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
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Home Court, Away Court"
              {...register('location')}
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about the match..."
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Scheduling...' : 'Schedule Match'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
