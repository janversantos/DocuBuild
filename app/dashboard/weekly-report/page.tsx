'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { Project, WeeklyProjectUpdate } from '@/types/database.types'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight, Edit, Save, X, Calendar, Download } from 'lucide-react'

interface ProjectWithUpdates extends Project {
  weekly_update?: WeeklyProjectUpdate
  site_engineer?: { full_name: string }
}

export default function WeeklyReportPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithUpdates[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    update_details: '',
    problems_concerns: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && profile) {
      // Only allow engineers, admins, and approvers
      if (!['engineer', 'admin', 'approver'].includes(profile.role)) {
        router.push('/dashboard')
        return
      }
      fetchWeeklyReport()
    }
  }, [user, profile, currentWeekStart])

  const fetchWeeklyReport = async () => {
    setLoadingData(true)
    try {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

      // Fetch all projects with site engineer info
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          site_engineer:profiles!site_engineer_id(full_name)
        `)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Fetch weekly updates for this week
      const { data: updatesData, error: updatesError } = await supabase
        .from('weekly_project_updates')
        .select('*')
        .eq('week_start_date', format(currentWeekStart, 'yyyy-MM-dd'))
        .eq('week_end_date', format(weekEnd, 'yyyy-MM-dd'))

      if (updatesError) throw updatesError

      // Merge projects with their weekly updates
      const projectsWithUpdates = (projectsData || []).map(project => {
        const update = updatesData?.find(u => u.project_id === project.id)
        return {
          ...project,
          weekly_update: update,
          site_engineer: Array.isArray(project.site_engineer) ? project.site_engineer[0] : project.site_engineer
        }
      })

      setProjects(projectsWithUpdates)
    } catch (error) {
      console.error('Error fetching weekly report:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  const handleThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  const startEdit = (project: ProjectWithUpdates) => {
    setEditingProjectId(project.id)
    setEditForm({
      update_details: project.weekly_update?.update_details || '',
      problems_concerns: project.weekly_update?.problems_concerns || ''
    })
  }

  const cancelEdit = () => {
    setEditingProjectId(null)
    setEditForm({ update_details: '', problems_concerns: '' })
  }

  const saveWeeklyUpdate = async (projectId: string) => {
    try {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
      const project = projects.find(p => p.id === projectId)

      if (project?.weekly_update) {
        // Update existing
        const { error } = await supabase
          .from('weekly_project_updates')
          .update({
            update_details: editForm.update_details,
            problems_concerns: editForm.problems_concerns,
            updated_by: user!.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', project.weekly_update.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('weekly_project_updates')
          .insert({
            project_id: projectId,
            week_start_date: format(currentWeekStart, 'yyyy-MM-dd'),
            week_end_date: format(weekEnd, 'yyyy-MM-dd'),
            update_details: editForm.update_details,
            problems_concerns: editForm.problems_concerns,
            updated_by: user!.id
          })

        if (error) throw error
      }

      // Refresh data
      await fetchWeeklyReport()
      setEditingProjectId(null)
      setEditForm({ update_details: '', problems_concerns: '' })
    } catch (error: any) {
      console.error('Error saving weekly update:', error)
      alert('Failed to save: ' + error.message)
    }
  }

  const getStatusColor = (percentage?: number) => {
    if (!percentage) return 'text-gray-400'
    if (percentage < 50) return 'text-red-600'
    if (percentage < 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.3cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          nav, .no-print {
            display: none !important;
          }
          .print-full-width {
            max-width: 100% !important;
            padding: 0.3cm !important;
            margin: 0 !important;
          }
          .print-header {
            margin-bottom: 0.3cm;
          }
          .print-header h1 {
            font-size: 16px;
            margin-bottom: 2px;
          }
          .print-header p {
            display: none;
          }
          .bg-white {
            box-shadow: none !important;
          }
          table {
            page-break-inside: auto;
            font-size: 7px !important;
            table-layout: fixed !important;
            width: 100%;
            border-collapse: collapse !important;
          }
          table th {
            padding: 3px 2px !important;
            font-size: 7px !important;
            white-space: nowrap;
          }
          table td {
            padding: 3px 2px !important;
            font-size: 7px !important;
            line-height: 1.2;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          .bg-green-700 {
            background-color: rgb(21 128 61) !important;
          }
          .week-display {
            font-size: 12px;
            margin-bottom: 0.2cm;
            text-align: center;
            font-weight: bold;
          }
          /* Compact column widths */
          th:nth-child(1), td:nth-child(1) { width: 5px !important; max-width: 5px !important; } /* No */
          th:nth-child(2), td:nth-child(2) { width: 70px !important; max-width: 70px !important; } /* Project */
          th:nth-child(3), td:nth-child(3) { width: 30px !important; max-width: 30px !important; } /* Code */
          th:nth-child(4), td:nth-child(4) { width: 25px !important; max-width: 25px !important; } /* Engineer */
          th:nth-child(5), td:nth-child(5) { width: 20px !important; max-width: 20px !important; } /* NTP */
          th:nth-child(6), td:nth-child(6) { width: 12px !important; max-width: 12px !important; } /* Days */
          th:nth-child(7), td:nth-child(7) { width: 20px !important; max-width: 20px !important; } /* Comp */
          th:nth-child(8), td:nth-child(8) { width: 25px !important; max-width: 25px !important; } /* Bid */
          th:nth-child(9), td:nth-child(9) { width: 55px !important; max-width: 55px !important; } /* Update */
          th:nth-child(10), td:nth-child(10) { width: 55px !important; max-width: 55px !important; } /* Problems */
          th:nth-child(11), td:nth-child(11) { width: 11px !important; max-width: 11px !important; } /* Status */
          th:nth-child(12), td:nth-child(12) { width: 11px !important; max-width: 11px !important; } /* Collected */
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 print-full-width">
        {/* Header */}
        <div className="mb-6 print-header">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Weekly Report</h1>
          <p className="mt-2 text-sm text-gray-600">
            Project monitoring summary and accomplishments
          </p>
        </div>

        {/* Week Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4 no-print">
              <button
                type="button"
                onClick={handlePreviousWeek}
                className="p-2 border border-gray-300 hover:bg-gray-100 rounded-md transition-colors"
                title="Previous week"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                <div className="text-center min-w-[180px] sm:min-w-[220px]">
                  <div className="text-base sm:text-lg font-semibold text-gray-900">
                    {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Week {format(currentWeekStart, 'w, yyyy')}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextWeek}
                className="p-2 border border-gray-300 hover:bg-gray-100 rounded-md transition-colors"
                title="Next week"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>

              <button
                type="button"
                onClick={handleThisWeek}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                This Week
              </button>
            </div>

            <div className="text-center min-w-[220px] week-display hidden print:block">
              <div className="font-semibold text-gray-900">
                Weekly Report: {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')} (Week {format(currentWeekStart, 'w, yyyy')})
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                title="Download as PDF"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <div className="text-sm text-gray-600 text-center sm:text-left">
                <span className="font-medium">{projects.length}</span> projects
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {loadingData ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Loading report...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No projects found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-700">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-8">
                      #
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[200px]">
                      Project
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Engineer
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      NTP
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Comp
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Bid Amt
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[250px]">
                      Updates
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[200px]">
                      Problems
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Stat%
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Coll%
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider no-print">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project, index) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="font-medium">{project.name}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                        {project.project_code || '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                        {project.site_engineer?.full_name || '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                        {project.ntp_date ? format(new Date(project.ntp_date), 'MMM d, yy') : '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                        {project.calendar_days || '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                        {project.contract_completion_date ? format(new Date(project.contract_completion_date), 'MMM d, yy') : '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                        {project.bid_amount ? `₱${project.bid_amount.toLocaleString()}` : '-'}
                      </td>

                      {/* Update Details - Editable */}
                      <td className="px-3 py-4 text-sm">
                        {editingProjectId === project.id ? (
                          <textarea
                            value={editForm.update_details}
                            onChange={(e) => setEditForm({ ...editForm, update_details: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                            placeholder="What was accomplished this week..."
                          />
                        ) : (
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {project.weekly_update?.update_details || (
                              <span className="text-gray-400 italic">No update</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Problems/Concerns - Editable */}
                      <td className="px-3 py-4 text-sm">
                        {editingProjectId === project.id ? (
                          <textarea
                            value={editForm.problems_concerns}
                            onChange={(e) => setEditForm({ ...editForm, problems_concerns: e.target.value })}
                            rows={3}
                            className="ww-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                            placeholder="Any issues or concerns..."
                          />
                        ) : (
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {project.weekly_update?.problems_concerns || (
                              <span className="text-gray-400 italic">None</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${getStatusColor(project.status_percentage)}`}>
                          {project.status_percentage ?? 0}%
                        </span>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${getStatusColor(project.cost_percentage)}`}>
                          {project.cost_percentage ?? 0}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-4 whitespace-nowrap text-sm no-print">
                        {editingProjectId === project.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => saveWeeklyUpdate(project.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(project)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit weekly update"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      </div>
    </>
  )
}
