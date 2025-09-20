'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { playerSchema, type PlayerFormData } from '@/lib/validations'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Player } from '@/lib/types'

interface EditPlayerDialogProps {
  player: Player
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPlayerDialog({ player, open, onOpenChange }: EditPlayerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const updatePlayer = useTeamStore((state) => state.updatePlayer)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player.name,
      gender: player.gender,
      grade: player.grade,
      position_preference: player.position_preference as 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles' | undefined,
      team_level: player.team_level as 'varsity' | 'jv' | 'freshman' | undefined,
      utr_rating: player.utr_rating,
    },
  })

  const positionPreference = watch('position_preference')

  // Reset form when player changes
  useEffect(() => {
    reset({
      name: player.name,
      gender: player.gender,
      grade: player.grade,
      position_preference: player.position_preference as 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles' | undefined,
      team_level: player.team_level as 'varsity' | 'jv' | 'freshman' | undefined,
      utr_rating: player.utr_rating,
    })
  }, [player, reset])

  const onSubmit = async (data: PlayerFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await updatePlayer(player.id, {
        name: data.name,
        gender: data.gender,
        grade: data.grade,
        position_preference: data.position_preference || undefined,
        team_level: data.team_level || undefined,
        utr_rating: data.utr_rating || undefined,
      })
      
      if (error) {
        toast.error(error)
      } else {
        toast.success('Player updated successfully!')
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogDescription>
            Update player information and details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Player Name *</Label>
            <Input
              id="name"
              placeholder="Enter player's full name"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={watch('gender') || ''}
              onValueChange={(value) => setValue('gender', value as 'male' | 'female')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-red-600">{errors.gender.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Select
              value={watch('grade')?.toString() || ''}
              onValueChange={(value) => setValue('grade', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9">Grade 9</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
            {errors.grade && (
              <p className="text-sm text-red-600">{errors.grade.message}</p>
            )}
          </div>


          <div className="space-y-2">
            <Label htmlFor="position_preference">Position Preference</Label>
            <Select
              value={positionPreference || ''}
              onValueChange={(value) => setValue('position_preference', value as 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boys_singles">Boys Singles</SelectItem>
                <SelectItem value="girls_singles">Girls Singles</SelectItem>
                <SelectItem value="boys_doubles">Boys Doubles</SelectItem>
                <SelectItem value="girls_doubles">Girls Doubles</SelectItem>
                <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
              </SelectContent>
            </Select>
            {errors.position_preference && (
              <p className="text-sm text-red-600">{errors.position_preference.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_level">Team Level</Label>
            <Select
              value={watch('team_level') || ''}
              onValueChange={(value) => setValue('team_level', value as 'varsity' | 'jv' | 'freshman')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="varsity">Varsity</SelectItem>
                <SelectItem value="jv">Junior Varsity</SelectItem>
                <SelectItem value="freshman">Freshman</SelectItem>
              </SelectContent>
            </Select>
            {errors.team_level && (
              <p className="text-sm text-red-600">{errors.team_level.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="utr_rating">UTR Rating (Optional)</Label>
            <Input
              id="utr_rating"
              type="number"
              min="1"
              max="16"
              step="0.1"
              placeholder="e.g., 8.5"
              {...register('utr_rating', { valueAsNumber: true })}
            />
            <p className="text-xs text-gray-500">
              Universal Tennis Rating (1-16 scale). Leave blank if unknown.
            </p>
            {errors.utr_rating && (
              <p className="text-sm text-red-600">{errors.utr_rating.message}</p>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
