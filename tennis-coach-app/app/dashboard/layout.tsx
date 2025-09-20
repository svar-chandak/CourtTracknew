'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default function DashboardLayout({
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
    if (!loading && !coach) {
      router.push('/login')
    }
  }, [coach, loading, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
