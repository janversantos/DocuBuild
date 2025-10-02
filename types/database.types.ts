// Database Type Definitions
export type UserRole = 'admin' | 'approver' | 'staff' | 'viewer'
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'draft'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  project_code?: string
  status: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Document {
  id: string
  title: string
  description?: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  version: number
  parent_document_id?: string
  project_id?: string
  category_id?: string
  status: DocumentStatus
  tags?: string[]
  uploaded_by?: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
  // Joined data
  project?: Project
  category?: Category
  uploader?: Profile
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  // Joined data
  user?: Profile
}

export interface ApprovalRequest {
  id: string
  document_id: string
  requested_by?: string
  approver_id?: string
  status: string
  comments?: string
  responded_at?: string
  created_at: string
  // Joined data
  document?: Document
  requester?: Profile
  approver?: Profile
}
