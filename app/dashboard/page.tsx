'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { FileText, Folder, Upload, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalProjects: 0,
    pendingApprovals: 0,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      // Count documents
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })

      // Count projects
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

      // Count pending approvals
      const { count: approvalCount } = await supabase
        .from('approval_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      setStats({
        totalDocuments: docCount || 0,
        totalProjects: projectCount || 0,
        pendingApprovals: approvalCount || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.full_name}!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Here's what's happening with your construction documents today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Documents
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalDocuments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Folder className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Projects
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalProjects}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Pending Approvals
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingApprovals}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/documents"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Upload className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Upload Documents</p>
                <p className="text-sm text-gray-500">
                  Add new files to your projects
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/projects"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <Folder className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Manage Projects</p>
                <p className="text-sm text-gray-500">
                  Create and organize projects
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Getting Started */}
        {stats.totalDocuments === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Get Started with DocuBuild
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              Start by uploading your first document or creating a project to
              organize your construction files.
            </p>
            <div className="flex space-x-4">
              <Link
                href="/dashboard/documents"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Upload Document
              </Link>
              <Link
                href="/dashboard/projects"
                className="px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-md border border-blue-600 hover:bg-blue-50"
              >
                Create Project
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
