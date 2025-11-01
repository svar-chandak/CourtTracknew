'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useStudentAuthStore } from '@/stores/student-auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const studentLoginSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  password: z.string().min(1, 'Password is required'),
})

type StudentLoginFormData = z.infer<typeof studentLoginSchema>

export default function StudentLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const signIn = useStudentAuthStore((state) => state.signIn)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentLoginFormData>({
    resolver: zodResolver(studentLoginSchema),
  })

  const onSubmit = async (data: StudentLoginFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await signIn(data.playerId, data.password)
      
      if (error) {
        toast.error(error)
      } else {
        // Store player ID for persistence
        localStorage.setItem('student_player_id', data.playerId)
        toast.success('Welcome back!')
        router.push('/student-dashboard')
      }
      } catch {
        toast.error('An unexpected error occurred')
      } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Student Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Player ID to view your match history
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your Player ID and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerId">Player ID</Label>
                <Input
                  id="playerId"
                  type="text"
                  placeholder="Enter your Player ID"
                  {...register('playerId')}
                />
                {errors.playerId && (
                  <p className="text-sm text-red-600">{errors.playerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Are you a coach?{' '}
                <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Coach Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

