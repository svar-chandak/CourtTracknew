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
      grade: player.grade,
      email: player.email || '',
      phone: player.phone || '',
      position_preference: player.position_preference as '1S' | '2S' | '3S' | '4S' | '5S' | '6S' | '1D' | '2D' | '3D' | undefined,
      skill_level: player.skill_level as 'Beginner' | 'Intermediate' | 'Advanced' | 'Varsity' | undefined,
    },
  })

  const positionPreference = watch('position_preference')
  const skillLevel = watch('skill_level')

  // Reset form when player changes
  useEffect(() => {
    reset({
      name: player.name,
      grade: player.grade,
      email: player.email || '',
      phone: player.phone || '',
      position_preference: player.position_preference as '1S' | '2S' | '3S' | '4S' | '5S' | '6S' | '1D' | '2D' | '3D' | undefined,
      skill_level: player.skill_level as 'Beginner' | 'Intermediate' | 'Advanced' | 'Varsity' | undefined,
    })
  }, [player, reset])

  const onSubmit = async (data: PlayerFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await updatePlayer(player.id, {
        name: data.name,
        grade: data.grade,
        email: data.email || undefined,
        phone: data.phone || undefined,
        position_preference: data.position_preference || undefined,
        skill_level: data.skill_level || undefined,
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="player@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position_preference">Position Preference</Label>
            <Select
              value={positionPreference || ''}
              onValueChange={(value) => setValue('position_preference', value as '1S' | '2S' | '3S' | '4S' | '5S' | '6S' | '1D' | '2D' | '3D')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1S">1st Singles</SelectItem>
                <SelectItem value="2S">2nd Singles</SelectItem>
                <SelectItem value="3S">3rd Singles</SelectItem>
                <SelectItem value="4S">4th Singles</SelectItem>
                <SelectItem value="5S">5th Singles</SelectItem>
                <SelectItem value="6S">6th Singles</SelectItem>
                <SelectItem value="1D">1st Doubles</SelectItem>
                <SelectItem value="2D">2nd Doubles</SelectItem>
                <SelectItem value="3D">3rd Doubles</SelectItem>
              </SelectContent>
            </Select>
            {errors.position_preference && (
              <p className="text-sm text-red-600">{errors.position_preference.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="skill_level">Skill Level</Label>
            <Select
              value={skillLevel || ''}
              onValueChange={(value) => setValue('skill_level', value as 'Beginner' | 'Intermediate' | 'Advanced' | 'Varsity')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Varsity">Varsity</SelectItem>
              </SelectContent>
            </Select>
            {errors.skill_level && (
              <p className="text-sm text-red-600">{errors.skill_level.message}</p>
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
