'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tournamentSchema, type TournamentFormData } from '@/lib/validations'
import { useTournamentStore } from '@/stores/tournament-store'
import { useAuthStore } from '@/stores/auth-store'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface CreateTournamentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTournamentDialog({ open, onOpenChange }: CreateTournamentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { coach } = useAuthStore()
  const createTournament = useTournamentStore((state) => state.createTournament)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
  })

  const tournamentType = watch('tournament_type')

  const onSubmit = async (data: TournamentFormData) => {
    if (!coach) {
      toast.error('Please log in to create a tournament')
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await createTournament({
        name: data.name,
        creator_id: coach.id,
        tournament_type: data.tournament_type,
        max_teams: data.max_teams,
        start_date: data.start_date || undefined,
        location: data.location || undefined,
        description: data.description || undefined,
        status: 'open',
      })
      
      if (error) {
        toast.error(error)
      } else {
        toast.success('Tournament created successfully!')
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            Set up a new tournament for teams to join and compete.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name *</Label>
            <Input
              id="name"
              placeholder="Enter tournament name"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tournament_type">Tournament Type *</Label>
            <Select
              value={tournamentType || ''}
                onValueChange={(value) => setValue('tournament_type', value as 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss' | 'dual_match')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tournament type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination">Single Elimination</SelectItem>
                <SelectItem value="double_elimination">Double Elimination</SelectItem>
                <SelectItem value="round_robin">Round Robin</SelectItem>
                <SelectItem value="swiss">Swiss System</SelectItem>
                <SelectItem value="dual_match">Dual Match</SelectItem>
              </SelectContent>
            </Select>
            {errors.tournament_type && (
              <p className="text-sm text-red-600">{errors.tournament_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_teams">Maximum Teams *</Label>
            <Select
              value={watch('max_teams')?.toString() || ''}
              onValueChange={(value) => setValue('max_teams', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select max teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 teams</SelectItem>
                <SelectItem value="6">6 teams</SelectItem>
                <SelectItem value="8">8 teams</SelectItem>
                <SelectItem value="10">10 teams</SelectItem>
                <SelectItem value="12">12 teams</SelectItem>
                <SelectItem value="16">16 teams</SelectItem>
                <SelectItem value="32">32 teams</SelectItem>
              </SelectContent>
            </Select>
            {errors.max_teams && (
              <p className="text-sm text-red-600">{errors.max_teams.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date')}
            />
            {errors.start_date && (
              <p className="text-sm text-red-600">{errors.start_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Enter tournament location"
              {...register('location')}
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter tournament description (optional)"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Tournament Types:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Single Elimination:</strong> Teams are eliminated after one loss</li>
              <li><strong>Round Robin:</strong> Every team plays every other team once</li>
              <li><strong>Dual Match:</strong> Traditional team vs team format</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Tournament'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
