'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'
import { useStudentAuthStore } from '@/stores/student-auth-store'
import { 
  Users, Trophy, Calendar, BarChart3, Star, CheckCircle, 
  Clock, Zap, ArrowRight
} from 'lucide-react'

export default function HomePage() {
  const { coach } = useAuthStore()
  const { player } = useStudentAuthStore()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#05C274] rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CourtTrack</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="/guide" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Guide
              </Link>
              {coach ? (
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : player ? (
                <Link href="/student-dashboard">
                  <Button>Student Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gray-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#85D5F6] bg-opacity-20 text-[#094542] text-sm font-semibold">
                <Star className="h-4 w-4 mr-2 text-[#05C274]" />
                Trusted by 500+ Tennis Coaches
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                The Complete Tennis
                <span className="block text-[#05C274]">Team Management System</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Manage your tennis team with ease. Track matches, manage players, 
                coordinate tournaments, and monitor performance—all in one platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {coach ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="text-lg px-8 py-6 bg-[#05C274] hover:bg-[#094542] text-white">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : player ? (
                  <Link href="/student-dashboard">
                    <Button size="lg" className="text-lg px-8 py-6 bg-[#05C274] hover:bg-[#094542] text-white">
                      Student Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="text-lg px-8 py-6 bg-[#05C274] hover:bg-[#094542] text-white">
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-[#05C274] text-[#05C274] hover:bg-[#BCFB89] bg-opacity-10">
                        Login
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[#05C274] mr-2" />
                  Free to start
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[#05C274] mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[#05C274] mr-2" />
                  Easy setup
                </div>
              </div>
            </div>
            
            {/* Right Visual */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-[#85D5F6] bg-opacity-30 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white rounded-3xl shadow-lg p-8 border border-gray-200">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border border-gray-200 shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <Users className="h-10 w-10 text-[#05C274]" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">24</div>
                        <p className="text-sm text-gray-600">Active Players</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <Trophy className="h-10 w-10 text-[#05C274]" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">12</div>
                        <p className="text-sm text-gray-600">Matches This Season</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-[#05C274] rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">Team Performance</h3>
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Win Rate</span>
                          <span className="font-semibold">82%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full" style={{ width: '82%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Total Points</span>
                          <span className="font-semibold">1,284</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#05C274] mb-2">500+</div>
              <div className="text-gray-600">Active Coaches</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#05C274] mb-2">10,000+</div>
              <div className="text-gray-600">Matches Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#05C274] mb-2">2,500+</div>
              <div className="text-gray-600">Players Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#05C274] mb-2">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for tennis team management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Features */}
            {[
              {
                icon: Calendar,
                title: 'Match Management',
                description: 'Schedule matches, track scores, and manage team competitions with detailed statistics.',
              },
              {
                icon: Users,
                title: 'Team Management',
                description: 'Manage player rosters, track attendance, and create optimal lineups for matches.',
              },
              {
                icon: BarChart3,
                title: 'Performance Analytics',
                description: 'Monitor player performance and generate detailed analytics reports.',
              },
              {
                icon: Trophy,
                title: 'Tournament Management',
                description: 'Create and manage tournaments with automated bracket generation.',
              },
              {
                icon: Clock,
                title: 'Attendance Tracking',
                description: 'Track player attendance at practices and matches with detailed reports.',
              },
              {
                icon: Zap,
                title: 'Smart Lineups',
                description: 'AI-powered lineup suggestions based on player performance and strategy.',
              }
            ].map((feature, index) => (
              <Card key={index} className="border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="p-4 bg-[#85D5F6] bg-opacity-20 rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                    <feature.icon className="h-8 w-8 text-[#05C274]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#05C274] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Tennis Team Management?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of coaches who trust CourtTrack to manage their teams
          </p>
          {!coach && !player && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-white text-[#05C274] hover:bg-gray-100">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white bg-transparent text-white hover:bg-white hover:text-[#05C274] transition-all">
                  Login to Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-[#05C274] rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">CourtTrack</span>
              </div>
              <p className="text-gray-400 mb-4">
                The complete tennis team management solution for coaches and players.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">Quick Links</h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">Coach Login</Link>
                </li>
                <li>
                  <Link href="/student-login" className="hover:text-white transition-colors">Student Login</Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">Get Started</Link>
                </li>
                <li>
                  <Link href="/guide" className="hover:text-white transition-colors">Help & Guide</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">Features</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Team Management</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Match Tracking</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Tournament Management</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Performance Analytics</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2024 CourtTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}