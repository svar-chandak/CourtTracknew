'use client'

import { useState } from 'react'
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

interface AddPlayerDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPlayerDialog({ teamId, open, onOpenChange }: AddPlayerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const addPlayer = useTeamStore((state) => state.addPlayer)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
  })

  const positionPreference = watch('position_preference')
  const skillLevel = watch('skill_level')

  const onSubmit = async (data: PlayerFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await addPlayer({
        team_id: teamId,
        name: data.name,
        gender: data.gender,
        grade: data.grade,
        email: data.email || undefined,
        phone: data.phone || undefined,
        position_preference: data.position_preference || undefined,
        skill_level: data.skill_level || undefined,
      })
      
      if (error) {
        toast.error(error)
      } else {
        toast.success('Player added successfully!')
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Add a new player to your team roster.
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
              onValueChange={(value) => setValue('position_preference', value as 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred division" />
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
              {isLoading ? 'Adding...' : 'Add Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
