'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { Project } from '@/types/database.types'
import { Folder, Plus, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function ProjectsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [engineers, setEngineers] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    project_code: '',
    status: 'planning' as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
    site_engineer_id: '',
    ntp_date: '',
    calendar_days: '',
    contract_completion_date: '',
    bid_amount: '',
    status_percentage: '0',
    cost_percentage: '0',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchProjects()
      fetchEngineers()
    }
  }, [user])

  const fetchEngineers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['engineer', 'admin'])
        .order('full_name')

      if (error) throw error
      setEngineers(data || [])
    } catch (error) {
      console.error('Error fetching engineers:', error)
    }
  }

  const fetchProjects = async () => {
    setLoadingProjects(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const projectData = {
        name: newProject.name,
        description: newProject.description || null,
        project_code: newProject.project_code || null,
        status: newProject.status,
        site_engineer_id: newProject.site_engineer_id || null,
        ntp_date: newProject.ntp_date || null,
        calendar_days: newProject.calendar_days ? parseInt(newProject.calendar_days) : null,
        contract_completion_date: newProject.contract_completion_date || null,
        bid_amount: newProject.bid_amount ? parseFloat(newProject.bid_amount) : null,
        status_percentage: parseInt(newProject.status_percentage) || 0,
        cost_percentage: parseInt(newProject.cost_percentage) || 0,
        created_by: user!.id,
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) throw error

      // Log audit trail with details
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'create',
        entity_type: 'project',
        entity_id: data.id,
        details: {
          name: newProject.name,
          created_fields: projectData
        },
      })

      setProjects([data, ...projects])
      setShowCreateModal(false)
      setNewProject({
        name: '',
        description: '',
        project_code: '',
        status: 'planning',
        site_engineer_id: '',
        ntp_date: '',
        calendar_days: '',
        contract_completion_date: '',
        bid_amount: '',
        status_percentage: '0',
        cost_percentage: '0',
      })
    } catch (error: any) {
      console.error('Error creating project:', error)
      alert('Failed to create project: ' + error.message)
    }
  }

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Delete project "${project.name}"?`)) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) throw error

      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'delete',
        entity_type: 'project',
        entity_id: project.id,
        details: { name: project.name },
      })

      setProjects(projects.filter((p) => p.id !== project.id))
    } catch (error: any) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project: ' + error.message)
    }
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setShowEditModal(true)
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return

    try {
      // Find the original project to track changes
      const originalProject = projects.find(p => p.id === editingProject.id)

      const updateData = {
        name: editingProject.name,
        description: editingProject.description || null,
        project_code: editingProject.project_code || null,
        status: editingProject.status,
        site_engineer_id: editingProject.site_engineer_id || null,
        ntp_date: editingProject.ntp_date || null,
        calendar_days: editingProject.calendar_days || null,
        contract_completion_date: editingProject.contract_completion_date || null,
        bid_amount: editingProject.bid_amount || null,
        status_percentage: editingProject.status_percentage ?? 0,
        cost_percentage: editingProject.cost_percentage ?? 0,
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', editingProject.id)

      if (error) throw error

      // Track what changed for audit log
      const changes: any = {}
      if (originalProject) {
        Object.keys(updateData).forEach(key => {
          const k = key as keyof typeof updateData
          if (originalProject[k] !== updateData[k]) {
            changes[key] = {
              old: originalProject[k],
              new: updateData[k]
            }
          }
        })
      }

      // Log audit trail with detailed changes
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'update',
        entity_type: 'project',
        entity_id: editingProject.id,
        details: {
          name: editingProject.name,
          changes: changes
        },
      })

      setProjects(projects.map((p) => (p.id === editingProject.id ? editingProject : p)))
      setShowEditModal(false)
      setEditingProject(null)
    } catch (error: any) {
      console.error('Error updating project:', error)
      alert('Failed to update project: ' + error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-purple-100 text-purple-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_hold':
        return 'On Hold'
      case 'planning':
        return 'Planning'
      case 'active':
        return 'Active'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-2 text-sm text-gray-600">
              Organize your documents by construction projects
            </p>
          </div>
          {['admin', 'engineer', 'approver'].includes(profile.role) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </button>
          )}
        </div>

        {/* Projects Grid */}
        {loadingProjects ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first project
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/documents?project=${project.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <Folder className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.name}
                        </h3>
                        {project.project_code && (
                          <p className="text-xs text-gray-500">
                            {project.project_code}
                          </p>
                        )}
                      </div>
                    </div>
                    {['admin', 'engineer', 'approver'].includes(profile.role) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project)
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                    </span>
                    <span className={`px-2 py-1 rounded ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  {['admin', 'engineer', 'approver'].includes(profile.role) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(project)
                      }}
                      className="mt-3 w-full px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="h-3 w-3 inline mr-1" />
                      Edit Project
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Project
              </h3>
            </div>

            <form onSubmit={handleCreateProject} className="flex-1 overflow-y-auto">
              <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="col-span-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                    placeholder="e.g., Construction of RiverBank Protection"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    value={newProject.project_code}
                    onChange={(e) => setNewProject({ ...newProject, project_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                    placeholder="e.g., 25CC0092 / DALNGAN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Engineer / Contact Person
                  </label>
                  <select
                    value={newProject.site_engineer_id}
                    onChange={(e) => setNewProject({ ...newProject, site_engineer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  >
                    <option value="">Select engineer...</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>{eng.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                    placeholder="Brief description..."
                  />
                </div>

                {/* Timeline */}
                <div className="col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline & Dates</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NTP Date (Notice to Proceed)
                  </label>
                  <input
                    type="date"
                    value={newProject.ntp_date}
                    onChange={(e) => setNewProject({ ...newProject, ntp_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calendar Days
                  </label>
                  <input
                    type="number"
                    value={newProject.calendar_days}
                    onChange={(e) => setNewProject({ ...newProject, calendar_days: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                    placeholder="e.g., 210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Completion Date
                  </label>
                  <input
                    type="date"
                    value={newProject.contract_completion_date}
                    onChange={(e) => setNewProject({ ...newProject, contract_completion_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Financial */}
                <div className="col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bid Amount (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProject.bid_amount}
                    onChange={(e) => setNewProject({ ...newProject, bid_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                    placeholder="e.g., 78743878.98"
                  />
                </div>

                {/* Progress */}
                <div className="col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Progress Tracking</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status % (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newProject.status_percentage}
                    onChange={(e) => setNewProject({ ...newProject, status_percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost % (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newProject.cost_percentage}
                    onChange={(e) => setNewProject({ ...newProject, cost_percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>
              </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewProject({
                      name: '', description: '', project_code: '', status: 'planning',
                      site_engineer_id: '', ntp_date: '', calendar_days: '', contract_completion_date: '',
                      bid_amount: '', status_percentage: '0', cost_percentage: '0',
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleCreateProject(e as any)
                  }}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Project
              </h3>
            </div>

            <form onSubmit={handleUpdateProject} className="flex-1 overflow-y-auto">
              <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="col-span-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.name}
                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    value={editingProject.project_code || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, project_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Engineer / Contact Person
                  </label>
                  <select
                    value={editingProject.site_engineer_id || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, site_engineer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  >
                    <option value="">Select engineer...</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>{eng.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingProject.description || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                  />
                </div>

                {/* Timeline */}
                <div className="col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline & Dates</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NTP Date (Notice to Proceed)
                  </label>
                  <input
                    type="date"
                    value={editingProject.ntp_date || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, ntp_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calendar Days
                  </label>
                  <input
                    type="number"
                    value={editingProject.calendar_days || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, calendar_days: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Completion Date
                  </label>
                  <input
                    type="date"
                    value={editingProject.contract_completion_date || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, contract_completion_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingProject.status}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Financial */}
                <div className="col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bid Amount (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProject.bid_amount || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, bid_amount: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                {/* Progress */}
                <div className="col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Progress Tracking</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status % (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingProject.status_percentage ?? 0}
                    onChange={(e) => setEditingProject({ ...editingProject, status_percentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collected % (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingProject.cost_percentage ?? 0}
                    onChange={(e) => setEditingProject({ ...editingProject, cost_percentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-600"
                  />
                </div>
              </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingProject(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleUpdateProject(e as any)
                  }}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Update Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
