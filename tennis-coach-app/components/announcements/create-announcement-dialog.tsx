'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAnnouncementStore } from '@/stores/announcement-store'
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
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, MessageSquare, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  announcement_type: z.enum(['general', 'match_reminder', 'practice_change', 'emergency']),
  is_urgent: z.boolean(),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

interface CreateAnnouncementDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAnnouncementDialog({ teamId, open, onOpenChange }: CreateAnnouncementDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { createAnnouncement } = useAnnouncementStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      announcement_type: 'general',
      is_urgent: false,
    },
  })

  const announcementType = watch('announcement_type')
  const isUrgent = watch('is_urgent')

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'match_reminder':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'practice_change':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-green-500" />
    }
  }

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'border-red-200 bg-red-50'
      case 'match_reminder':
        return 'border-blue-200 bg-blue-50'
      case 'practice_change':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-green-200 bg-green-50'
    }
  }

  const onSubmit = async (data: AnnouncementFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await createAnnouncement({
        team_id: teamId,
        coach_id: '', // Will be filled by the backend
        ...data,
      })

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Announcement created and sent!')
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Team Announcement</DialogTitle>
          <DialogDescription>
            Send a message to all players on your team
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement_type">Announcement Type</Label>
              <Select
                value={announcementType}
                onValueChange={(value) => setValue('announcement_type', value as 'general' | 'match_reminder' | 'practice_change' | 'emergency')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select announcement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Announcement</SelectItem>
                  <SelectItem value="match_reminder">Match Reminder</SelectItem>
                  <SelectItem value="practice_change">Practice Change</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              {errors.announcement_type && (
                <p className="text-sm text-red-600">{errors.announcement_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter announcement title"
                maxLength={100}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                {...register('message')}
                placeholder="Enter your message to the team"
                rows={6}
                maxLength={1000}
              />
              {errors.message && (
                <p className="text-sm text-red-600">{errors.message.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_urgent"
                checked={isUrgent}
                onChange={(e) => setValue('is_urgent', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_urgent" className="text-sm font-medium">
                Mark as urgent (high priority)
              </Label>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <Card className={getAnnouncementColor(announcementType)}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {getAnnouncementIcon(announcementType)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">
                        {watch('title') || 'Announcement Title'}
                      </h4>
                      {isUrgent && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {watch('message') || 'Your message will appear here...'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date().toLocaleDateString()}</span>
                      <span className="capitalize">{announcementType.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              {isLoading ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
