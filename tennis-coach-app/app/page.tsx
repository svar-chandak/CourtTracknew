'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'
import { useStudentAuthStore } from '@/stores/student-auth-store'
import { Users, Trophy, Calendar, Target, BookOpen, Star, CheckCircle, BarChart3, Clock, Award } from 'lucide-react'

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
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              Trusted by 500+ Tennis Coaches
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              CourtTrack
              <span className="block text-green-600">Tennis Management</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
              The complete tennis team management system for coaches and players. 
              Track matches, manage lineups, and monitor player performance with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/guide">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  <BookOpen className="h-5 w-5 mr-2" />
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Active Coaches</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">10,000+</div>
              <div className="text-gray-600">Matches Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">2,500+</div>
              <div className="text-gray-600">Players Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Tennis Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From scheduling matches to tracking player performance, CourtTrack provides all the tools you need.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Calendar className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Match Management</h3>
              <p className="text-gray-600">
                Schedule matches, track scores, and manage team competitions with detailed statistics and real-time updates.
              </p>
            </div>
            <div className="text-center group">
              <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Management</h3>
              <p className="text-gray-600">
                Manage player rosters, track attendance, and create optimal lineups for matches with intelligent suggestions.
              </p>
            </div>
            <div className="text-center group">
              <div className="p-4 bg-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <BarChart3 className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Performance Analytics</h3>
              <p className="text-gray-600">
                Monitor player performance, UTR ratings, and generate detailed analytics reports to track improvement.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-20 bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose CourtTrack?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-gray-600 text-sm">
                Live score updates and instant notifications keep everyone informed.
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tournament Management</h3>
              <p className="text-gray-600 text-sm">
                Create and manage tournaments with automated bracket generation.
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy to Use</h3>
              <p className="text-gray-600 text-sm">
                Intuitive interface designed for coaches and players of all tech levels.
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-orange-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Driven</h3>
              <p className="text-gray-600 text-sm">
                Make informed decisions with comprehensive statistics and insights.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Tennis Team Management?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of coaches who trust CourtTrack to manage their teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-green-600 hover:bg-gray-100">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/guide">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-green-600">
                <BookOpen className="h-5 w-5 mr-2" />
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">CourtTrack</h3>
            <p className="text-gray-400 mb-6">
              The complete tennis team management solution
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                Coach Login
              </Link>
              <Link href="/student-login" className="text-gray-400 hover:text-white transition-colors">
                Student Login
              </Link>
              <Link href="/register" className="text-gray-400 hover:text-white transition-colors">
                Register
              </Link>
              <Link href="/guide" className="text-gray-400 hover:text-white transition-colors">
                Help
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                © 2024 CourtTrack. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}