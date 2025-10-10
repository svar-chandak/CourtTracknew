'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'
import { useStudentAuthStore } from '@/stores/student-auth-store'
import { Users, Trophy, Calendar, Target, BookOpen } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { coach, loading: coachLoading } = useAuthStore()
  const { player, loading: playerLoading } = useStudentAuthStore()

  useEffect(() => {
    if (coach) {
      router.push('/dashboard')
    } else if (player) {
      router.push('/student-dashboard')
    }
  }, [coach, player, router])

  if (coachLoading || playerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CourtTrack Tennis Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete tennis team management system for coaches and players. 
            Track matches, manage lineups, and monitor player performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Coach Login */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Coach Portal</CardTitle>
                  <CardDescription>
                    Manage your team, schedule matches, and track performance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Team roster management</li>
                    <li>• Match scheduling and scoring</li>
                    <li>• Tournament management</li>
                    <li>• Attendance tracking</li>
                    <li>• Lineup creation</li>
                    <li>• Player performance analytics</li>
                  </ul>
                </div>
                <div className="flex space-x-2">
                  <Link href="/login" className="flex-1">
                    <Button className="w-full">Coach Login</Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button variant="outline" className="w-full">Register</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Login */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Student Portal</CardTitle>
                  <CardDescription>
                    View your match history, stats, and team information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Personal match history</li>
                    <li>• Win/loss statistics</li>
                    <li>• Team announcements</li>
                    <li>• Practice schedules</li>
                    <li>• Performance tracking</li>
                    <li>• Tournament brackets</li>
                  </ul>
                </div>
                <div className="flex space-x-2">
                  <Link href="/student-login" className="flex-1">
                    <Button className="w-full">Student Login</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Complete Tennis Management Solution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Match Management</h3>
              <p className="text-gray-600">
                Schedule matches, track scores, and manage team competitions with detailed statistics.
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Management</h3>
              <p className="text-gray-600">
                Manage player rosters, track attendance, and create optimal lineups for matches.
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Tracking</h3>
              <p className="text-gray-600">
                Monitor player performance, UTR ratings, and generate detailed analytics reports.
              </p>
            </div>
          </div>
        </div>

        {/* User Guide Link */}
        <div className="text-center mt-12">
          <Link href="/guide">
            <Button size="lg" variant="outline">
              <BookOpen className="h-5 w-5 mr-2" />
              User Guide
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}