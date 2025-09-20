'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export default function HomePage() {
  const router = useRouter()
  const { coach, loading, getCurrentCoach } = useAuthStore()

  useEffect(() => {
    getCurrentCoach()
  }, [getCurrentCoach])

  useEffect(() => {
    if (!loading) {
      if (coach) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [coach, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}