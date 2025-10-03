'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0)
  const { signIn } = useAuth()
  const router = useRouter()

  // Check if IP is blocked on page load
  useEffect(() => {
    checkRateLimit()
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setBlocked(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [blockTimeRemaining])

  const checkRateLimit = async () => {
    try {
      const { data: attempt } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('ip_address', 'browser-session') // Using session ID for client-side
        .single()

      if (attempt?.blocked_until) {
        const blockedUntil = new Date(attempt.blocked_until)
        const now = new Date()

        if (now < blockedUntil) {
          setBlocked(true)
          setBlockTimeRemaining(Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000))
        }
      }
    } catch (error) {
      // No existing record or error - allow login
    }
  }

  const recordFailedAttempt = async () => {
    try {
      const { data: existing } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('ip_address', 'browser-session')
        .single()

      const now = new Date()

      if (existing) {
        const newCount = (existing.attempt_count || 0) + 1

        if (newCount >= 5) {
          // Block for 15 minutes
          const blockUntil = new Date(now.getTime() + 15 * 60 * 1000)

          await supabase
            .from('login_attempts')
            .update({
              attempt_count: newCount,
              blocked_until: blockUntil.toISOString(),
              last_attempt: now.toISOString(),
            })
            .eq('ip_address', 'browser-session')

          setBlocked(true)
          setBlockTimeRemaining(15 * 60)
          setError('Too many failed attempts. Account locked for 15 minutes.')
        } else {
          await supabase
            .from('login_attempts')
            .update({
              attempt_count: newCount,
              last_attempt: now.toISOString(),
            })
            .eq('ip_address', 'browser-session')

          setError(`Invalid credentials. ${5 - newCount} attempts remaining.`)
        }
      } else {
        // Create new record
        await supabase.from('login_attempts').insert({
          ip_address: 'browser-session',
          attempt_count: 1,
          last_attempt: now.toISOString(),
        })
        setError('Invalid credentials. 4 attempts remaining.')
      }
    } catch (error) {
      console.error('Rate limit error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (blocked) {
      const minutes = Math.floor(blockTimeRemaining / 60)
      const seconds = blockTimeRemaining % 60
      setError(`Account locked. Try again in ${minutes}m ${seconds}s`)
      return
    }

    setLoading(true)

    try {
      await signIn(email, password)
      // Success - reset attempts
      await supabase
        .from('login_attempts')
        .delete()
        .eq('ip_address', 'browser-session')
      router.push('/dashboard')
    } catch (err: any) {
      // Failed login - record attempt
      await recordFailedAttempt()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            DocuBuild
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
