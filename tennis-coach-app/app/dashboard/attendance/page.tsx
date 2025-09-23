'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTeamStore } from '@/stores/team-store'
import { useAttendanceStore } from '@/stores/attendance-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreatePracticeSessionDialog } from '@/components/attendance/create-practice-session-dialog'
import { RecordAttendanceDialog } from '@/components/attendance/record-attendance-dialog'
import { Calendar, Plus, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import type { Attendance } from '@/lib/types'

export default function AttendancePage() {
  const { coach } = useAuthStore()
  const { currentTeam, getCurrentTeam } = useTeamStore()
  const { 
    attendance, 
    practiceSessions, 
    loading, 
    getAttendance, 
    getPracticeSessions 
  } = useAttendanceStore()
  
  const [showCreatePracticeDialog, setShowCreatePracticeDialog] = useState(false)
  const [showRecordAttendanceDialog, setShowRecordAttendanceDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<{
    type: 'practice' | 'match'
    id: string
    date: string
    title: string
  } | null>(null)

  useEffect(() => {
    if (coach?.id) {
      getCurrentTeam(coach.id)
    }
  }, [coach, getCurrentTeam])

  useEffect(() => {
    if (currentTeam) {
      getAttendance(currentTeam.id)
      getPracticeSessions(currentTeam.id)
    }
  }, [currentTeam, getAttendance, getPracticeSessions])

  const handleRecordAttendance = (eventType: 'practice' | 'match', eventId: string, eventDate: string, eventTitle: string) => {
    setSelectedEvent({
      type: eventType,
      id: eventId,
      date: eventDate,
      title: eventTitle
    })
    setShowRecordAttendanceDialog(true)
  }

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'late':
        return 'bg-yellow-100 text-yellow-800'
      case 'excused':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate attendance stats
  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
  }

  // Group attendance by event
  interface AttendanceGroup {
    event_type: 'practice' | 'match'
    event_id: string | undefined
    event_date: string
    records: Attendance[]
  }

  const attendanceByEvent = attendance.reduce((acc, record) => {
    const key = `${record.event_type}-${record.event_id || 'no-id'}`
    if (!acc[key]) {
      acc[key] = {
        event_type: record.event_type,
        event_id: record.event_id,
        event_date: record.event_date,
        records: []
      }
    }
    acc[key].records.push(record)
    return acc
  }, {} as Record<string, AttendanceGroup>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
          <p className="text-gray-600 mt-1">
            Track player attendance for practices and matches
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowCreatePracticeDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Practice
          </Button>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excused</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{attendanceStats.excused}</div>
          </CardContent>
        </Card>
      </div>

      {/* Practice Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Practice Sessions</CardTitle>
            <CardDescription>
              Schedule and track attendance for practice sessions
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreatePracticeDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Practice
          </Button>
        </CardHeader>
        <CardContent>
          {practiceSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No practice sessions yet</h3>
              <p className="text-gray-600 mb-4">Schedule your first practice session to start tracking attendance</p>
              <Button onClick={() => setShowCreatePracticeDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Practice Session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {practiceSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-medium text-lg">Practice Session</h3>
                        <Badge variant="outline">
                          {session.practice_date}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        {session.practice_time && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{session.practice_time}</span>
                          </div>
                        )}
                        {session.location && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{session.location}</span>
                          </div>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-sm text-gray-600 mt-2">{session.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRecordAttendance('practice', session.id, session.practice_date, 'Practice Session')}
                      >
                        Record Attendance
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>
            Latest attendance entries across all events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records yet</h3>
              <p className="text-gray-600">Start recording attendance for practices and matches</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(attendanceByEvent).slice(0, 10).map((eventGroup, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">
                        {eventGroup.event_type === 'practice' ? 'Practice Session' : 'Match'} - {new Date(eventGroup.event_date).toLocaleDateString()}
                      </h4>
                    </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRecordAttendance(
                          eventGroup.event_type, 
                          eventGroup.event_id || '', 
                          eventGroup.event_date,
                          eventGroup.event_type === 'practice' ? 'Practice Session' : 'Match'
                        )}
                      >
                      Record Attendance
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {eventGroup.records.map((record) => (
                      <div key={record.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        {getStatusIcon(record.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{record.player?.name}</p>
                          <Badge className={`${getStatusColor(record.status)} text-xs`}>
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {currentTeam && (
        <>
          <CreatePracticeSessionDialog
            teamId={currentTeam.id}
            open={showCreatePracticeDialog}
            onOpenChange={setShowCreatePracticeDialog}
          />
          
          {selectedEvent && (
            <RecordAttendanceDialog
              teamId={currentTeam.id}
              eventType={selectedEvent.type}
              eventId={selectedEvent.id}
              eventDate={selectedEvent.date}
              eventTitle={selectedEvent.title}
              open={showRecordAttendanceDialog}
              onOpenChange={setShowRecordAttendanceDialog}
            />
          )}
        </>
      )}
    </div>
  )
}
