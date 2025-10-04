'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { FileText, Folder, BarChart3, LogOut, CheckCircle, Activity, ClipboardList } from 'lucide-react'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder },
    ...(profile?.role === 'approver' || profile?.role === 'admin'
      ? [{ name: 'Approvals', href: '/dashboard/approvals', icon: CheckCircle }]
      : []),
    ...(['engineer', 'admin', 'approver'].includes(profile?.role || '')
      ? [{ name: 'Weekly Report', href: '/dashboard/weekly-report', icon: ClipboardList }]
      : []),
    ...(profile?.role === 'admin'
      ? [
          { name: 'Audit Trail', href: '/dashboard/audit-trail', icon: Activity },
          // Security page hidden from navbar but accessible via /dashboard/security
        ]
      : []),
  ]

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Nav Links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                DocuBuild
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-700 text-right">
              <div className="font-medium">{profile?.full_name}</div>
              <div className="text-xs text-gray-500">({profile?.role})</div>
            </div>
            <button
              onClick={async () => {
                try {
                  await signOut()
                } catch (error) {
                  console.error('Sign out error:', error)
                  // Force redirect anyway
                  window.location.href = '/login'
                }
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'border-blue-500 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
