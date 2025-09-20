'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { coach, loading, getCurrentCoach } = useAuthStore()

  useEffect(() => {
    getCurrentCoach()
  }, [getCurrentCoach])

  useEffect(() => {
    if (!loading && coach) {
      router.push('/dashboard')
    }
  }, [coach, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            CourtTrack
          </h1>
          <p className="text-gray-600">
            Manage your tennis team and tournaments
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
