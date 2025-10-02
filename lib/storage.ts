// Supabase Storage Helper Functions
import { supabase } from './supabase'

export interface UploadFileParams {
  file: File
  userId: string
  projectId?: string
  categoryId?: string
  customTitle?: string
}

export interface UploadResult {
  success: boolean
  filePath?: string
  error?: string
}

/**
 * Upload file to Supabase Storage and create document record
 */
export async function uploadDocument({
  file,
  userId,
  projectId,
  categoryId,
  customTitle,
}: UploadFileParams): Promise<UploadResult> {
  try {
    // Generate unique file path: userId/timestamp_filename
    const timestamp = Date.now()
    const filePath = `${userId}/${timestamp}_${file.name}`

    // Use custom title if provided, otherwise use original file name
    const documentTitle = customTitle || file.name

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // Create document record in database
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: documentTitle,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        project_id: projectId,
        category_id: categoryId,
        uploaded_by: userId,
        status: 'draft',
      })
      .select()
      .single()

    if (docError) {
      console.error('Database error:', docError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('documents').remove([filePath])
      return { success: false, error: docError.message }
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'upload',
      entity_type: 'document',
      entity_id: docData.id,
      details: {
        file_name: file.name,
        file_size: file.size,
        project_id: projectId,
        category_id: categoryId,
      },
    })

    return { success: true, filePath }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Download file from Supabase Storage
 */
export async function downloadDocument(filePath: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (error) {
      console.error('Download error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

/**
 * Get public URL for document (temporary signed URL)
 */
export async function getDocumentUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
      console.error('URL generation error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}

/**
 * Delete document from storage and database
 */
export async function deleteDocument(
  documentId: string,
  filePath: string,
  userId: string
): Promise<boolean> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      return false
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return false
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'delete',
      entity_type: 'document',
      entity_id: documentId,
      details: {
        file_path: filePath,
      },
    })

    return true
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
