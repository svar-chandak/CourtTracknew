'use client'

import { useState, useEffect } from 'react'
import { useAttendanceStore } from '@/stores/attendance-store'
import { useTeamStore } from '@/stores/team-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { Player, AttendanceStatus } from '@/lib/types'

interface RecordAttendanceDialogProps {
  teamId: string
  eventType: 'practice' | 'match'
  eventId: string
  eventDate: string
  eventTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordAttendanceDialog({ 
  teamId, 
  eventType, 
  eventId, 
  eventDate, 
  eventTitle, 
  open, 
  onOpenChange 
}: RecordAttendanceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  
  const { players, getPlayers } = useTeamStore()
  const { recordAttendance, updateAttendance, getAttendanceForEvent } = useAttendanceStore()

  useEffect(() => {
    if (teamId) {
      getPlayers(teamId)
    }
  }, [teamId, getPlayers])

  useEffect(() => {
    if (open && eventId) {
      loadExistingAttendance()
    }
  }, [open, eventId])

  const loadExistingAttendance = async () => {
    try {
      const existingAttendance = await getAttendanceForEvent(eventType, eventId)
      const records: Record<string, AttendanceStatus> = {}
      const notesData: Record<string, string> = {}
      
      existingAttendance.forEach(record => {
        records[record.player_id] = record.status
        if (record.notes) {
          notesData[record.player_id] = record.notes
        }
      })
      
      setAttendanceRecords(records)
      setNotes(notesData)
    } catch (error) {
      console.error('Failed to load existing attendance:', error)
    }
  }

  const handleStatusChange = (playerId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [playerId]: status
    }))
  }

  const handleNotesChange = (playerId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [playerId]: note
    }))
  }

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'excused':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const onSubmit = async () => {
    setIsLoading(true)
    
    try {
      for (const player of players) {
        const status = attendanceRecords[player.id]
        if (!status) continue

        const note = notes[player.id] || ''
        
        // Check if attendance already exists
        const existingAttendance = await getAttendanceForEvent(eventType, eventId)
        const existingRecord = existingAttendance.find(a => a.player_id === player.id)
        
        if (existingRecord) {
          // Update existing record
          await updateAttendance(existingRecord.id, status, note)
        } else {
          // Create new record
          await recordAttendance({
            team_id: teamId,
            player_id: player.id,
            event_type: eventType,
            event_id: eventId,
            event_date: eventDate,
            status,
            notes: note || undefined,
            recorded_by: '', // Will be filled by backend
          })
        }
      }

      toast.success('Attendance recorded successfully!')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to record attendance')
    } finally {
      setIsLoading(false)
    }
  }

  const attendanceSummary = {
    present: players.filter(p => attendanceRecords[p.id] === 'present').length,
    absent: players.filter(p => attendanceRecords[p.id] === 'absent').length,
    late: players.filter(p => attendanceRecords[p.id] === 'late').length,
    excused: players.filter(p => attendanceRecords[p.id] === 'excused').length,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Attendance</DialogTitle>
          <DialogDescription>
            Mark attendance for {eventTitle} on {new Date(eventDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{eventTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(eventDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{eventType === 'practice' ? 'Practice Session' : 'Match'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{attendanceSummary.present}</div>
                <div className="text-sm text-gray-600">Present</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{attendanceSummary.late}</div>
                <div className="text-sm text-gray-600">Late</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{attendanceSummary.excused}</div>
                <div className="text-sm text-gray-600">Excused</div>
              </CardContent>
            </Card>
          </div>

          {/* Player Attendance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Player Attendance</h3>
            <div className="space-y-3">
              {players.map((player) => {
                const currentStatus = attendanceRecords[player.id] || 'present'
                const currentNote = notes[player.id] || ''
                
                return (
                  <Card key={player.id} className="p-4">
                    <div className="flex items-center justify-between space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(currentStatus)}
                          <div>
                            <h4 className="font-medium">{player.name}</h4>
                            {player.grade && (
                              <p className="text-sm text-gray-600">Grade {player.grade}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Select
                          value={currentStatus}
                          onValueChange={(value) => handleStatusChange(player.id, value as AttendanceStatus)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Badge className={getStatusColor(currentStatus)}>
                          {currentStatus}
                        </Badge>
                      </div>
                    </div>
                    
                    {(currentStatus === 'absent' || currentStatus === 'late' || currentStatus === 'excused') && (
                      <div className="mt-3 pt-3 border-t">
                        <Label htmlFor={`notes-${player.id}`} className="text-sm">
                          Notes (optional)
                        </Label>
                        <Textarea
                          id={`notes-${player.id}`}
                          value={currentNote}
                          onChange={(e) => handleNotesChange(player.id, e.target.value)}
                          placeholder="Reason for absence, lateness, or excuse..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
