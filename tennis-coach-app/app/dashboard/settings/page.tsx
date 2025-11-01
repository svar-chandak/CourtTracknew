'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validations'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useTeamStore } from '@/stores/team-store'
import { useAttendanceStore } from '@/stores/attendance-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, User, School, Phone, Download, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { coach, updateProfile, signOut } = useAuthStore()
  const router = useRouter()
  const { currentTeam, players, getPlayers } = useTeamStore()
  const { attendance, practiceSessions, getAttendance, getPracticeSessions } = useAttendanceStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: coach?.full_name || '',
      school_name: coach?.school_name || '',
      phone: coach?.phone || '',
    },
  })

  useEffect(() => {
    if (coach) {
      reset({
        full_name: coach.full_name,
        school_name: coach.school_name,
        phone: coach.phone || '',
      })
    }
  }, [coach, reset])

  const onSubmit = async (data: ProfileUpdateFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await updateProfile(data)
      
      if (error) {
        toast.error(error)
      } else {
        toast.success('Profile updated successfully!')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    if (!coach || !currentTeam) {
      toast.error('Team information not available')
      return
    }

    setIsExporting(true)
    
    try {
      // Fetch all data
      await getPlayers(currentTeam.id)
      await getAttendance(currentTeam.id)
      await getPracticeSessions(currentTeam.id)

      // Prepare export data
      const exportData = {
        exportDate: new Date().toISOString(),
        coach: {
          id: coach.id,
          full_name: coach.full_name,
          email: coach.email,
          school_name: coach.school_name,
          team_code: coach.team_code,
          phone: coach.phone,
        },
        team: {
          id: currentTeam.id,
          team_code: currentTeam.team_code,
          school_name: currentTeam.school_name,
          team_level: currentTeam.team_level,
          gender: currentTeam.gender,
          season_record_wins: currentTeam.season_record_wins,
          season_record_losses: currentTeam.season_record_losses,
        },
        players: players.map(player => ({
          id: player.id,
          name: player.name,
          email: player.email,
          grade: player.grade,
          phone: player.phone,
          position_preference: player.position_preference,
          skill_level: player.skill_level,
          gender: player.gender,
          team_level: player.team_level,
          utr_rating: player.utr_rating,
        })),
        attendance: attendance.map(record => ({
          id: record.id,
          player_id: record.player_id,
          event_type: record.event_type,
          event_id: record.event_id,
          event_date: record.event_date,
          status: record.status,
          notes: record.notes,
          recorded_by: record.recorded_by,
          created_at: record.created_at,
        })),
        practiceSessions: practiceSessions.map(session => ({
          id: session.id,
          practice_date: session.practice_date,
          practice_time: session.practice_time,
          location: session.location,
          description: session.description,
          coach_id: session.coach_id,
          created_at: session.created_at,
        })),
      }

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `courttrack-export-${coach.team_code}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleLogOut = async () => {
    try {
      await signOut()
      router.push('/login')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to log out')
    }
  }

  if (!coach) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and team information
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="Enter your full name"
                {...register('full_name')}
              />
              {errors.full_name && (
                <p className="text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_name">School Name</Label>
              <Input
                id="school_name"
                placeholder="Enter your school name"
                {...register('school_name')}
              />
              {errors.school_name && (
                <p className="text-sm text-red-600">{errors.school_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={coach.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Team Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <School className="h-5 w-5 mr-2" />
            Team Information
          </CardTitle>
          <CardDescription>
            Your team details and sharing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Team Code</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={coach.team_code}
                disabled
                className="bg-gray-50 font-mono"
              />
              <Button variant="outline" size="sm">
                Copy
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Share this code with other coaches to invite them to tournaments
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Team Code Usage</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Other coaches can use this code to join tournaments</li>
              <li>• You can share this code to invite teams to your tournaments</li>
              <li>• Keep this code private if you don&apos;t want unsolicited invitations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Account Actions
          </CardTitle>
          <CardDescription>
            Manage your account and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-gray-600">Download your team and match data</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Log Out</h4>
              <p className="text-sm text-gray-600">Sign out of your account</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
