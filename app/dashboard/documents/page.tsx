'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import FileUpload from '@/components/FileUpload'
import { supabase } from '@/lib/supabase'
import { Document, Category, Project } from '@/types/database.types'
import { formatFileSize, getDocumentUrl, deleteDocument } from '@/lib/storage'
import { format } from 'date-fns'
import { Download, Trash2, FileText, Search, CheckCircle } from 'lucide-react'

export default function DocumentsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [approvers, setApprovers] = useState<any[]>([])
  const [selectedApproverId, setSelectedApproverId] = useState('')
  const [approvalComments, setApprovalComments] = useState('')
  const [submittingApproval, setSubmittingApproval] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDocuments()
      fetchCategories()
      fetchProjects()
    }
  }, [user])

  const fetchDocuments = async () => {
    setLoadingDocs(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Fetch related data separately to avoid join issues
      if (data && data.length > 0) {
        const categoryIds = [...new Set(data.map(d => d.category_id).filter(Boolean))]
        const projectIds = [...new Set(data.map(d => d.project_id).filter(Boolean))]
        const uploaderIds = [...new Set(data.map(d => d.uploaded_by).filter(Boolean))]

        const [categoriesData, projectsData, uploadersData] = await Promise.all([
          categoryIds.length > 0
            ? supabase.from('categories').select('*').in('id', categoryIds)
            : { data: [] },
          projectIds.length > 0
            ? supabase.from('projects').select('*').in('id', projectIds)
            : { data: [] },
          uploaderIds.length > 0
            ? supabase.from('profiles').select('id, full_name').in('id', uploaderIds)
            : { data: [] },
        ])

        // Map related data back to documents
        const enrichedData = data.map(doc => ({
          ...doc,
          category: categoriesData.data?.find(c => c.id === doc.category_id),
          project: projectsData.data?.find(p => p.id === doc.project_id),
          uploader: uploadersData.data?.find(u => u.id === doc.uploaded_by),
        }))

        setDocuments(enrichedData)
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setLoadingDocs(false)
    }
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    setCategories(data || [])
  }

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('name')
    setProjects(data || [])
  }

  const handleDownload = async (doc: Document) => {
    try {
      const url = await getDocumentUrl(doc.file_path)
      if (url) {
        // Create temporary link and trigger download
        const link = document.createElement('a')
        link.href = url
        link.download = doc.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Log audit trail
        await supabase.from('audit_logs').insert({
          user_id: user?.id,
          action: 'download',
          entity_type: 'document',
          entity_id: doc.id,
          details: { file_name: doc.file_name },
        })
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return

    const success = await deleteDocument(doc.id, doc.file_path, user!.id)
    if (success) {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } else {
      alert('Failed to delete document')
    }
  }

  const fetchApprovers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['approver', 'admin'])
      .order('full_name')
    setApprovers(data || [])
  }

  const openApprovalModal = (doc: Document) => {
    setSelectedDocument(doc)
    setShowApprovalModal(true)
    setSelectedApproverId('')
    setApprovalComments('')
    fetchApprovers()
  }

  const handleRequestApproval = async () => {
    if (!selectedDocument || !selectedApproverId) {
      alert('Please select an approver')
      return
    }

    setSubmittingApproval(true)
    try {
      // Create approval request
      const { error: requestError } = await supabase.from('approval_requests').insert({
        document_id: selectedDocument.id,
        requested_by: user!.id,
        approver_id: selectedApproverId,
        status: 'pending',
        comments: approvalComments || null,
      })

      if (requestError) throw requestError

      // Update document status to pending
      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'pending' })
        .eq('id', selectedDocument.id)

      if (updateError) throw updateError

      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'request_approval',
        entity_type: 'document',
        entity_id: selectedDocument.id,
        details: {
          file_name: selectedDocument.file_name,
          approver_id: selectedApproverId
        },
      })

      alert('Approval request sent successfully!')
      setShowApprovalModal(false)
      fetchDocuments()
    } catch (error) {
      console.error('Error requesting approval:', error)
      alert('Failed to request approval')
    } finally {
      setSubmittingApproval(false)
    }
  }

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.file_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesCategory =
      !selectedCategory || doc.category_id === selectedCategory
    const matchesProject = !selectedProject || doc.project_id === selectedProject

    return matchesSearch && matchesCategory && matchesProject
  })

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload and manage your construction documents
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Upload Documents
            </h2>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showUpload ? 'Hide' : 'Show'} Upload
            </button>
          </div>

          {showUpload && (
            <div className="space-y-4">
              {/* Project and Category Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project (Optional)
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">No Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload Component */}
              <FileUpload
                projectId={selectedProject || undefined}
                categoryId={selectedCategory || undefined}
                onUploadComplete={fetchDocuments}
              />
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Documents ({filteredDocuments.length})
            </h2>
          </div>

          {loadingDocs ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No documents found</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Upload your first document
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <FileText className="h-6 w-6 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {doc.file_name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {doc.file_size && (
                            <span>
                              {formatFileSize(doc.file_size)}
                            </span>
                          )}
                          {doc.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                              {doc.category.name}
                            </span>
                          )}
                          {doc.project && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded whitespace-nowrap">
                              {doc.project.name}
                            </span>
                          )}
                          {doc.status && (
                            <span
                              className={`px-2 py-1 rounded whitespace-nowrap ${
                                doc.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : doc.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : doc.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {doc.status}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Uploaded {format(new Date(doc.created_at), 'MMM d, yyyy')}
                          {doc.uploader && <> by {doc.uploader.full_name}</>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:ml-4">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      {doc.status === 'draft' && (profile.role === 'staff' || profile.role === 'admin') && (
                        <button
                          onClick={() => openApprovalModal(doc)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Request Approval"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      {(profile.role === 'admin' ||
                        doc.uploaded_by === user.id) && (
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approval Request Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Request Document Approval
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Document: <span className="font-medium text-gray-900">{selectedDocument?.file_name}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Approver *
                  </label>
                  <select
                    value={selectedApproverId}
                    onChange={(e) => setSelectedApproverId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose an approver...</option>
                    {approvers.map((approver) => (
                      <option key={approver.id} value={approver.id}>
                        {approver.full_name} ({approver.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes for the approver..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={submittingApproval}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestApproval}
                  disabled={submittingApproval || !selectedApproverId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingApproval ? 'Submitting...' : 'Request Approval'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
