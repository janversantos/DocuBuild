'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { CheckCircle, XCircle, FileText, Clock } from 'lucide-react'

interface ApprovalRequest {
  id: string
  document_id: string
  requested_by: string
  approver_id: string
  status: string
  comments: string | null
  responded_at: string | null
  created_at: string
  document?: any
  requester?: any
}

export default function ApprovalsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseAction, setResponseAction] = useState<'approved' | 'rejected'>('approved')
  const [responseComments, setResponseComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && profile) {
      // Only approvers and admins can access this page
      if (profile.role !== 'approver' && profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      fetchApprovalRequests()
    }
  }, [user, profile, router])

  const fetchApprovalRequests = async () => {
    setLoadingRequests(true)
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('approver_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch related data
      if (data && data.length > 0) {
        const documentIds = [...new Set(data.map(r => r.document_id))]
        const requesterIds = [...new Set(data.map(r => r.requested_by))]

        const [documentsData, requestersData] = await Promise.all([
          supabase.from('documents').select('*').in('id', documentIds),
          supabase.from('profiles').select('id, full_name, email').in('id', requesterIds),
        ])

        const enrichedData = data.map(request => ({
          ...request,
          document: documentsData.data?.find(d => d.id === request.document_id),
          requester: requestersData.data?.find(r => r.id === request.requested_by),
        }))

        setApprovalRequests(enrichedData)
      } else {
        setApprovalRequests([])
      }
    } catch (error) {
      console.error('Error fetching approval requests:', error)
      setApprovalRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  const openResponseModal = (request: ApprovalRequest, action: 'approved' | 'rejected') => {
    setSelectedRequest(request)
    setResponseAction(action)
    setResponseComments('')
    setShowResponseModal(true)
  }

  const handleRespond = async () => {
    if (!selectedRequest) return

    setSubmitting(true)
    try {
      // Update approval request
      const { error: updateError } = await supabase
        .from('approval_requests')
        .update({
          status: responseAction,
          comments: responseComments || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id)

      if (updateError) throw updateError

      // Update document status
      const { error: docError } = await supabase
        .from('documents')
        .update({ status: responseAction })
        .eq('id', selectedRequest.document_id)

      if (docError) throw docError

      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: responseAction === 'approved' ? 'approve' : 'reject',
        entity_type: 'document',
        entity_id: selectedRequest.document_id,
        details: {
          file_name: selectedRequest.document?.file_name,
          comments: responseComments
        },
      })

      alert(`Document ${responseAction} successfully!`)
      setShowResponseModal(false)
      fetchApprovalRequests()
    } catch (error) {
      console.error('Error responding to approval:', error)
      alert('Failed to process approval')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingRequests = approvalRequests.filter(r => r.status === 'pending')
  const completedRequests = approvalRequests.filter(r => r.status !== 'pending')

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Approvals</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review and approve documents requiring your attention
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Approvals ({pendingRequests.length})
            </h2>
          </div>

          {loadingRequests ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading approval requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No pending approvals</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <FileText className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {request.document?.title || request.document?.file_name || 'Unknown Document'}
                        </h3>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                          <div>
                            Requested by: <span className="font-medium">{request.requester?.full_name}</span>
                          </div>
                          <div>
                            Requested: {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                          </div>
                          {request.comments && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700 break-words">
                              <span className="font-medium">Request notes:</span> {request.comments}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:ml-4">
                      <button
                        onClick={() => openResponseModal(request, 'approved')}
                        className="flex-1 sm:flex-none px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => openResponseModal(request, 'rejected')}
                        className="flex-1 sm:flex-none px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center justify-center space-x-1"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Approvals */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Completed ({completedRequests.length})
            </h2>
          </div>

          {completedRequests.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No completed approvals</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {completedRequests.map((request) => (
                <div
                  key={request.id}
                  className="px-4 sm:px-6 py-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <FileText className="h-6 w-6 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {request.document?.title || request.document?.file_name || 'Unknown Document'}
                        </h3>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                          <div>
                            Requested by: <span className="font-medium">{request.requester?.full_name}</span>
                          </div>
                          <div>
                            Responded: {request.responded_at ? format(new Date(request.responded_at), 'MMM d, yyyy h:mm a') : 'N/A'}
                          </div>
                          {request.comments && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700 break-words">
                              <span className="font-medium">Response notes:</span> {request.comments}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap self-start ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Response Modal */}
        {showResponseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {responseAction === 'approved' ? 'Approve' : 'Reject'} Document
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Document: <span className="font-medium text-gray-900">{selectedRequest?.document?.file_name}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Requested by: <span className="font-medium text-gray-900">{selectedRequest?.requester?.full_name}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={responseComments}
                    onChange={(e) => setResponseComments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Add notes about this ${responseAction}...`}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRespond}
                  disabled={submitting}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    responseAction === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Processing...' : `Confirm ${responseAction === 'approved' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
