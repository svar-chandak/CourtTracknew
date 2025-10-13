'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Clock, Wrench } from 'lucide-react'

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Announcements</h1>
        <p className="text-gray-600 mt-1">
          Send messages and updates to your team
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <CardTitle className="text-2xl text-gray-700">Coming Soon</CardTitle>
          <CardDescription className="text-lg">
            The announcements feature is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>In Development</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <span>Coming Soon</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What to Expect</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Send announcements to your entire team</li>
              <li>• Mark messages as urgent for important updates</li>
              <li>• Track who has read your announcements</li>
              <li>• Schedule announcements for later delivery</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            This feature will be available in a future update. Thank you for your patience!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
