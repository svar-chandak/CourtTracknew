'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Trophy, 
  Calendar, 
  Target, 
  Settings, 
  UserPlus, 
  BarChart3,
  Move,
  MousePointer,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function UserGuide() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CourtTrack User Guide
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete guide to using the tennis team management system. Learn how to manage your team, 
            schedule matches, track performance, and more.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Get up and running in 5 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                  <h3 className="font-medium">Register as Coach</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Create your coach account with school information. You&apos;ll get a unique team code.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</div>
                  <h3 className="font-medium">Add Players</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Add your team players with their information. Each gets a unique Player ID for student login.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">3</div>
                  <h3 className="font-medium">Schedule Matches</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Create matches against other teams and track results with detailed scoring.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Coach Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-green-600" />
                Coach Portal Features
              </CardTitle>
              <CardDescription>
                Everything coaches need to manage their tennis team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Team Management
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Add players with auto-generated Player IDs</li>
                  <li>• Organize by team level (Varsity, JV, Freshman)</li>
                  <li>• Track UTR ratings and position preferences</li>
                  <li>• Mass add players from CSV or manual entry</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Match Management
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Schedule matches against other teams</li>
                  <li>• Enter detailed scores by division</li>
                  <li>• Track win/loss records automatically</li>
                  <li>• View match history and statistics</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Lineup Creation
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Drag and drop players to positions</li>
                  <li>• Visual lineup builder with 9 positions</li>
                  <li>• Singles (1-6) and Doubles (1-3) support</li>
                  <li>• Real-time lineup validation</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Tournament Management
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Create and manage tournaments</li>
                  <li>• Interactive bracket system</li>
                  <li>• Live score input and tracking</li>
                  <li>• Tournament codes for easy joining</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Student Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-blue-600" />
                Student Portal Features
              </CardTitle>
              <CardDescription>
                What students can access with their Player ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Personal Dashboard
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• View personal match history</li>
                  <li>• Track win/loss statistics</li>
                  <li>• See performance over time</li>
                  <li>• Access team information</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance Tracking
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Individual match results by division</li>
                  <li>• Win rate calculations</li>
                  <li>• UTR rating tracking</li>
                  <li>• Position-specific performance</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Match Details
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Detailed match information</li>
                  <li>• Opponent information</li>
                  <li>• Set-by-set score breakdown</li>
                  <li>• Match location and date</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Instructions */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Detailed Instructions</h2>

          {/* Team Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-green-600" />
                Team Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Adding Players</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <strong>Team</strong> page in the dashboard</li>
                    <li>Click <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Add Player</Badge></li>
                    <li>Fill in player information:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li><strong>Name:</strong> Player&apos;s full name</li>
                        <li><strong>Gender:</strong> Male or Female</li>
                        <li><strong>Grade:</strong> 9-12 (optional)</li>
                        <li><strong>Position Preference:</strong> Singles/Doubles preference</li>
                        <li><strong>Team Level:</strong> Varsity, JV, or Freshman</li>
                        <li><strong>UTR Rating:</strong> Universal Tennis Rating (1-16)</li>
                      </ul>
                    </li>
                    <li>Click <Badge className="mx-1">Add Player</Badge> to save</li>
                    <li>Player will receive a unique <strong>Player ID</strong> for student login</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-lg">Mass Adding Players</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click <Badge variant="outline" className="mx-1"><Users className="h-3 w-3 mr-1" />Mass Add</Badge></li>
                    <li>Enter multiple players in the text area, one per line</li>
                    <li>Format: <code className="bg-gray-200 px-1 rounded">Name, Gender, Grade, UTR</code></li>
                    <li>Example: <code className="bg-gray-200 px-1 rounded">John Smith, Male, 11, 8.5</code></li>
                    <li>Click <Badge className="mx-1">Add All Players</Badge></li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-green-600" />
                Match Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Scheduling a Match</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <strong>Matches</strong> page</li>
                    <li>Click <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Schedule Match</Badge></li>
                    <li>Fill in match details:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li><strong>Home Team:</strong> Your team or opponent</li>
                        <li><strong>Away Team:</strong> The other team</li>
                        <li><strong>Match Date:</strong> When the match will be played</li>
                        <li><strong>Match Time:</strong> Start time (optional)</li>
                        <li><strong>Location:</strong> Where the match will be played</li>
                        <li><strong>Match Type:</strong> Team match or individual</li>
                      </ul>
                    </li>
                    <li>Click <Badge className="mx-1">Schedule Match</Badge></li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-lg">Entering Match Scores</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click <Badge variant="outline" className="mx-1"><Eye className="h-3 w-3 mr-1" />View Details</Badge> on any match</li>
                    <li>Click <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Add Score</Badge> or <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Enter First Score</Badge></li>
                    <li>Select the position (1st Singles, 2nd Doubles, etc.)</li>
                    <li>Choose players for each team</li>
                    <li>Enter set scores (e.g., 6-4, 6-2)</li>
                    <li>Select the winner</li>
                    <li>Click <Badge className="mx-1">Enter Score</Badge></li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lineup Creation */}
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Move className="h-6 w-6 text-green-600" />
              Creating Lineups
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Drag and Drop Lineup Builder</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <strong>Lineups</strong> page</li>
                    <li>Click <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Create Lineup</Badge></li>
                    <li>Use the visual lineup builder:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li><strong>Drag and Drop:</strong> Drag players from available list to positions</li>
                        <li><strong>Click to Select:</strong> Click players to add/remove from positions</li>
                        <li><strong>Singles Positions:</strong> 1st-6th Singles (1 player each)</li>
                        <li><strong>Doubles Positions:</strong> 1st-3rd Doubles (2 players each)</li>
                      </ul>
                    </li>
                    <li>Review the lineup summary</li>
                    <li>Click <Badge className="mx-1">Create Lineup</Badge></li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-lg">Lineup Tips</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Players can only be in one position at a time</li>
                    <li>Singles positions require exactly 1 player</li>
                    <li>Doubles positions require exactly 2 players</li>
                    <li>Use the lineup summary to verify your selections</li>
                    <li>Consider player strengths and preferences when assigning positions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Login */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-blue-600" />
                Student Login and Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg">How Students Login</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Students go to the main page and click <Badge className="mx-1">Student Login</Badge></li>
                    <li>Enter their <strong>Player ID</strong> (provided by coach)</li>
                    <li>Enter their password (set by coach or default)</li>
                    <li>Click <Badge className="mx-1">Sign In</Badge></li>
                    <li>Access their personal dashboard with match history</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-lg">Student Dashboard Features</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Personal Stats:</strong> Total matches, wins, losses, win rate</li>
                    <li><strong>Match History:</strong> All completed matches with detailed results</li>
                    <li><strong>Player Info:</strong> Personal information and team details</li>
                    <li><strong>Performance Tracking:</strong> See improvement over time</li>
                    <li><strong>Division Results:</strong> Results by singles/doubles position</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Troubleshooting */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-orange-600" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Common Issues</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Can&apos;t drag players:</strong> Make sure to click and hold for a moment</li>
                  <li>• <strong>Player not showing:</strong> Check if player is already assigned to another position</li>
                  <li>• <strong>Login issues:</strong> Verify Player ID and password are correct</li>
                  <li>• <strong>Match not saving:</strong> Ensure all required fields are filled</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Getting Help</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check this guide for detailed instructions</li>
                  <li>• Contact your coach for Player ID issues</li>
                  <li>• Refresh the page if something isn&apos;t working</li>
                  <li>• Make sure you have a stable internet connection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to App */}
        <div className="text-center mt-12">
          <Link href="/">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <Trophy className="h-5 w-5 mr-2" />
              Back to CourtTrack
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
