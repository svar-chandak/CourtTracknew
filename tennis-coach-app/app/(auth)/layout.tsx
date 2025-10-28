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

  return <>{children}</>
}
