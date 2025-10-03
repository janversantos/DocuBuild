'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Shield, Unlock, RefreshCw, AlertTriangle } from 'lucide-react'

interface LoginAttempt {
  id: string
  ip_address: string
  attempt_count: number
  blocked_until: string | null
  last_attempt: string
  created_at: string
}

export default function SecurityPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [attempts, setAttempts] = useState<LoginAttempt[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [unblocking, setUnblocking] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchLoginAttempts()
    }
  }, [user, profile])

  const fetchLoginAttempts = async () => {
    setLoadingData(true)
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('last_attempt', { ascending: false })
        .limit(100)

      if (error) throw error
      setAttempts(data || [])
    } catch (error) {
      console.error('Error fetching login attempts:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const unblockIP = async (id: string, ip: string) => {
    setUnblocking(id)
    try {
      const { error } = await supabase
        .from('login_attempts')
        .update({
          blocked_until: null,
          attempt_count: 0,
        })
        .eq('id', id)

      if (error) throw error

      alert(`IP ${ip} has been unblocked`)
      fetchLoginAttempts()
    } catch (error) {
      console.error('Error unblocking IP:', error)
      alert('Failed to unblock IP')
    } finally {
      setUnblocking(null)
    }
  }

  const isBlocked = (blockedUntil: string | null): boolean => {
    if (!blockedUntil) return false
    return new Date(blockedUntil) > new Date()
  }

  const getTimeRemaining = (blockedUntil: string): string => {
    const now = new Date()
    const blockEnd = new Date(blockedUntil)
    const diffMs = blockEnd.getTime() - now.getTime()

    if (diffMs <= 0) return 'Expired'

    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)

    return `${minutes}m ${seconds}s`
  }

  if (loading || !user) {
    return <div>Loading...</div>
  }

  if (profile?.role !== 'admin') {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Access Denied: Admin only</p>
          </div>
        </div>
      </div>
    )
  }

  const blockedIPs = attempts.filter((a) => isBlocked(a.blocked_until))
  const recentAttempts = attempts.filter((a) => !isBlocked(a.blocked_until))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Security Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Monitor and manage login attempts
                </p>
              </div>
            </div>
            <button
              onClick={fetchLoginAttempts}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm text-gray-500">Total Attempts</div>
              <div className="text-2xl font-bold text-gray-900">
                {attempts.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm text-gray-500">Blocked IPs</div>
              <div className="text-2xl font-bold text-red-600">
                {blockedIPs.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm text-gray-500">Recent Attempts</div>
              <div className="text-2xl font-bold text-yellow-600">
                {recentAttempts.length}
              </div>
            </div>
          </div>

          {/* Blocked IPs Section */}
          {blockedIPs.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Blocked IPs ({blockedIPs.length})
                </h2>
              </div>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Attempts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Time Remaining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Last Attempt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blockedIPs.map((attempt) => (
                      <tr key={attempt.id} className="bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {attempt.ip_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            {attempt.attempt_count} attempts
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {attempt.blocked_until &&
                            getTimeRemaining(attempt.blocked_until)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(
                            new Date(attempt.last_attempt),
                            'MMM dd, yyyy HH:mm:ss'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() =>
                              unblockIP(attempt.id, attempt.ip_address)
                            }
                            disabled={unblocking === attempt.id}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            <Unlock className="h-4 w-4" />
                            <span>
                              {unblocking === attempt.id
                                ? 'Unblocking...'
                                : 'Unblock'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Attempts Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Recent Login Attempts
            </h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {loadingData ? (
                <div className="p-8 text-center text-gray-500">
                  Loading...
                </div>
              ) : recentAttempts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No recent login attempts
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Attempts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Last Attempt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        First Seen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAttempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {attempt.ip_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span
                            className={`px-2 py-1 rounded-full ${
                              attempt.attempt_count >= 3
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {attempt.attempt_count} attempt
                            {attempt.attempt_count > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(
                            new Date(attempt.last_attempt),
                            'MMM dd, yyyy HH:mm:ss'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(
                            new Date(attempt.created_at),
                            'MMM dd, yyyy HH:mm:ss'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
