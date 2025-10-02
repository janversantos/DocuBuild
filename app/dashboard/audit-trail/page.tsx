'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { FileText, Download, Trash2, CheckCircle, XCircle, Upload, Activity } from 'lucide-react'

interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details: any
  created_at: string
  user?: {
    full_name: string
    email: string
  }
}

export default function AuditTrailPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntityType, setFilterEntityType] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && profile) {
      // Only admins can access audit trail
      if (profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      fetchAuditLogs()
      fetchUsers()
    }
  }, [user, profile, router])

  const fetchAuditLogs = async () => {
    setLoadingLogs(true)
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500) // Last 500 entries

      if (error) throw error

      // Fetch user data
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(log => log.user_id))]
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        const enrichedData = data.map(log => ({
          ...log,
          user: usersData?.find(u => u.id === log.user_id),
        }))

        setAuditLogs(enrichedData)
      } else {
        setAuditLogs([])
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      setAuditLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name')
    setUsers(data || [])
  }

  const exportToCSV = () => {
    const csvData = filteredLogs.map(log => ({
      Date: format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      User: log.user?.full_name || 'Unknown',
      Email: log.user?.email || 'Unknown',
      Action: log.action,
      Entity_Type: log.entity_type,
      Entity_ID: log.entity_id,
      Details: JSON.stringify(log.details || {}),
    }))

    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload':
        return <Upload className="h-5 w-5 text-blue-500" />
      case 'download':
        return <Download className="h-5 w-5 text-green-500" />
      case 'delete':
        return <Trash2 className="h-5 w-5 text-red-500" />
      case 'approve':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'reject':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'request_approval':
        return <Activity className="h-5 w-5 text-yellow-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload':
        return 'bg-blue-100 text-blue-800'
      case 'download':
        return 'bg-green-100 text-green-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      case 'approve':
        return 'bg-green-100 text-green-800'
      case 'reject':
        return 'bg-red-100 text-red-800'
      case 'request_approval':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = !filterAction || log.action === filterAction
    const matchesEntityType = !filterEntityType || log.entity_type === filterEntityType
    const matchesUser = !filterUser || log.user_id === filterUser
    const matchesSearch = !searchQuery ||
      log.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase())

    return matchesAction && matchesEntityType && matchesUser && matchesSearch
  })

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  // Get unique actions and entity types for filters
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))]
  const uniqueEntityTypes = [...new Set(auditLogs.map(log => log.entity_type))]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
              <p className="mt-2 text-sm text-gray-600">
                Complete log of all system activities for compliance and reporting
              </p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {uniqueEntityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {(filterAction || filterEntityType || filterUser || searchQuery) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredLogs.length} of {auditLogs.length} logs
              </p>
              <button
                onClick={() => {
                  setFilterAction('')
                  setFilterEntityType('')
                  setFilterUser('')
                  setSearchQuery('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Activity Log ({filteredLogs.length})
            </h2>
          </div>

          {loadingLogs ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(log.created_at), 'MMM d, yyyy')}
                        <br />
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.created_at), 'h:mm a')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.user?.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.user?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.entity_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.details?.file_name && (
                          <div className="max-w-xs truncate">
                            File: {log.details.file_name}
                          </div>
                        )}
                        {log.details?.comments && (
                          <div className="max-w-xs truncate text-xs text-gray-400 mt-1">
                            "{log.details.comments}"
                          </div>
                        )}
                        {log.details?.project_name && (
                          <div className="max-w-xs truncate">
                            Project: {log.details.project_name}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
