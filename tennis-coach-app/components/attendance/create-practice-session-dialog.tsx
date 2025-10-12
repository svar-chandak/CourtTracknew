'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAttendanceStore } from '@/stores/attendance-store'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const practiceSessionSchema = z.object({
  practice_date: z.string().min(1, 'Practice date is required'),
  practice_time: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
})

type PracticeSessionFormData = z.infer<typeof practiceSessionSchema>

interface CreatePracticeSessionDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePracticeSessionDialog({ teamId, open, onOpenChange }: CreatePracticeSessionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { createPracticeSession } = useAttendanceStore()
  const { coach } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PracticeSessionFormData>({
    resolver: zodResolver(practiceSessionSchema),
  })

  const onSubmit = async (data: PracticeSessionFormData) => {
    if (!coach?.id) {
      toast.error('Coach information not available')
      return
    }

    setIsLoading(true)
    
    try {
      // Clean up the data - convert empty strings to undefined for optional fields
      const cleanedData = {
        ...data,
        practice_time: data.practice_time && data.practice_time.trim() !== '' ? data.practice_time : undefined,
        location: data.location && data.location.trim() !== '' ? data.location : undefined,
        description: data.description && data.description.trim() !== '' ? data.description : undefined,
      }

      const { error } = await createPracticeSession({
        team_id: teamId,
        coach_id: coach.id,
        ...cleanedData,
      })

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Practice session created!')
      reset()
      onOpenChange(false)
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
          <DialogTitle>Schedule Practice Session</DialogTitle>
          <DialogDescription>
            Create a new practice session for attendance tracking
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="practice_date">Practice Date</Label>
            <Input
              id="practice_date"
              type="date"
              {...register('practice_date')}
            />
            {errors.practice_date && (
              <p className="text-sm text-red-600">{errors.practice_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="practice_time">Practice Time (Optional)</Label>
            <Input
              id="practice_time"
              type="time"
              {...register('practice_time')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., Main Courts, Gymnasium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Any additional details about this practice session"
              rows={3}
            />
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
              {isLoading ? 'Creating...' : 'Create Practice Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
