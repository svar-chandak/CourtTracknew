'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@/lib/validations'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, Circle, Mail, Lock, User, School } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const signIn = useAuthStore((state) => state.signIn)
  const signUp = useAuthStore((state) => state.signUp)

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerRegister,
    handleSubmit: handleSubmitRegister,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setErrorMessage('')
    
    try {
      const { error } = await signIn(data.email, data.password)
      
      if (error) {
        setErrorMessage(error)
      } else {
        toast.success('Welcome back!')
        router.push('/dashboard')
      }
    } catch {
      setErrorMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setErrorMessage('')
    
    try {
      const { error } = await signUp(
        data.email,
        data.password,
        data.full_name,
        data.school_name,
        data.phone
      )
      
      if (error) {
        setErrorMessage(error)
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.')
        setIsSignUp(false)
      }
    } catch {
      setErrorMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Floating Background Elements */}
      <motion.div
        className="absolute top-20 left-10 w-4 h-4 bg-green-400 rounded-full opacity-20"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-40 right-20 w-6 h-6 bg-green-400 rounded-full opacity-20"
        animate={{
          y: [0, 30, 0],
          x: [0, -15, 0],
          scale: [1, 0.8, 1]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div
        className="absolute bottom-40 left-20 w-3 h-3 bg-yellow-400 rounded-full opacity-20"
        animate={{
          y: [0, -25, 0],
          x: [0, 20, 0],
          scale: [1, 1.5, 1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      <motion.div
        className="absolute top-60 left-1/3 w-5 h-5 bg-green-300 rounded-full opacity-20"
        animate={{
          y: [0, 40, 0],
          x: [0, -10, 0],
          scale: [1, 0.7, 1]
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      <div className="relative w-full max-w-4xl h-[700px] bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white border-opacity-20">
        {/* Sign In Form - Right Side (default) / Left Side (when signing up) */}
        <div 
          className={`absolute top-0 w-1/2 h-full bg-white bg-opacity-20 backdrop-blur-sm p-12 flex flex-col justify-center transition-all duration-700 ease-in-out ${
            isSignUp ? 'left-0' : 'left-1/2'
          }`}
        >
          <div className="max-w-md mx-auto w-full">
            {/* Logo */}
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8, 
                type: "spring", 
                stiffness: 200 
              }}
            >
              <Circle className="h-16 w-16 text-green-400" />
            </motion.div>

            {isSignUp ? (
              // Sign Up Form
              <>
                <motion.h2 
                  className="text-3xl font-bold text-green-400 text-center mb-2"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Create Account
                </motion.h2>
                <motion.p 
                  className="text-center text-gray-300 mb-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Join CourtTrack today
                </motion.p>
                
                {errorMessage && (
                  <div className="mb-6 p-3 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
                    <p className="text-red-200 text-sm text-center">{errorMessage}</p>
                  </div>
                )}
                
                <motion.form 
                  onSubmit={handleSubmitRegister(onRegisterSubmit)} 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full px-4 py-3 pl-10 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-green-400 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-gray-300"
                      {...registerRegister('full_name')}
                      disabled={isLoading}
                    />
                    {registerErrors.full_name && (
                      <p className="text-sm text-red-400 mt-1">{registerErrors.full_name.message}</p>
                    )}
                  </div>

                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type="text"
                      placeholder="School Name"
                      className="w-full px-4 py-3 pl-10 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-green-400 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-gray-300"
                      {...registerRegister('school_name')}
                      disabled={isLoading}
                    />
                    {registerErrors.school_name && (
                      <p className="text-sm text-red-400 mt-1">{registerErrors.school_name.message}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-4 py-3 pl-10 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-green-400 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-gray-300"
                      {...registerRegister('email')}
                      disabled={isLoading}
                    />
                    {registerErrors.email && (
                      <p className="text-sm text-red-400 mt-1">{registerErrors.email.message}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (min. 6 characters)"
                      className="w-full px-4 py-3 pl-10 pr-10 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-green-400 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-gray-300"
                      {...registerRegister('password')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-300" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                    {registerErrors.password && (
                      <p className="text-sm text-red-400 mt-1">{registerErrors.password.message}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      className="w-full px-4 py-3 pl-10 pr-10 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-green-400 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-gray-300"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-300" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-400 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <p className="text-center text-sm text-gray-300">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-green-400 font-semibold hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </motion.form>
              </>
            ) : (
              // Sign In Form
              <>
                <h2 className="text-3xl font-bold text-green-400 text-center mb-2">Sign In</h2>
                <p className="text-center text-gray-300 mb-4">Welcome back to CourtTrack</p>
                
                {errorMessage && (
                  <div className="mb-6 p-3 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
                    <p className="text-red-200 text-sm text-center">{errorMessage}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 pl-10 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-green-400 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-gray-300"
                      {...registerLogin('email')}
                      disabled={isLoading}
                    />
                    {loginErrors.email && (
                      <p className="text-sm text-red-400 mt-1">{loginErrors.email.message}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pl-10 pr-10 border-2 border-white border-opacity-30 rounded-xl focus:outline-none focus:border-green-400 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-gray-300"
                      {...registerLogin('password')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-300" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                    {loginErrors.password && (
                      <p className="text-sm text-red-400 mt-1">{loginErrors.password.message}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <Link href="/forgot-password" className="text-sm text-green-400 hover:underline font-semibold">
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-400 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>

                  <p className="text-center text-sm text-gray-300">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-green-400 font-semibold hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Overlay Panel - Slides between left and right */}
        <div 
          className={`absolute top-0 w-1/2 h-full bg-gradient-to-br from-green-400 to-green-600 text-white p-12 flex flex-col justify-center items-center transition-all duration-700 ease-in-out ${
            isSignUp ? 'left-1/2' : 'left-0'
          }`}
        >
          <div className="text-center">
            {isSignUp ? (
              // Welcome Back Panel (shown when in sign up mode)
              <>
                <motion.h2 
                  className="text-4xl font-bold mb-4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Welcome<br />Back!
                </motion.h2>
                <motion.p 
                  className="text-green-100 mb-8"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Already have an account?<br />Sign in to access CourtTrack
                </motion.p>
                <motion.button
                  onClick={() => setIsSignUp(false)}
                  className="px-12 py-3 border-2 border-white text-white rounded-full font-bold hover:bg-white hover:text-green-600 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              </>
            ) : (
              // Hello Friend Panel (shown when in sign in mode)
              <>
                <motion.h2 
                  className="text-4xl font-bold mb-4"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Hello,<br />Coach!
                </motion.h2>
                <motion.p 
                  className="text-green-100 mb-8"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  New to CourtTrack?<br />Create an account and start managing your team
                </motion.p>
                <motion.button
                  onClick={() => setIsSignUp(true)}
                  className="px-12 py-3 border-2 border-white text-white rounded-full font-bold hover:bg-white hover:text-green-600 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Up
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Back to Home Button */}
        <Link
          href="/"
          className="absolute top-4 left-4 text-white hover:text-green-400 z-10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>

        {/* Student Login Link */}
        <Link
          href="/student-login"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm hover:text-green-400 z-10"
        >
          Student Login →
        </Link>
      </div>
    </div>
  )
}
