'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadDocument } from '@/lib/storage'
import { useAuth } from '@/context/AuthContext'

interface FileUploadProps {
  projectId?: string
  categoryId?: string
  onUploadComplete?: () => void
}

interface UploadingFile {
  file: File
  progress: 'uploading' | 'success' | 'error'
  error?: string
}

export default function FileUpload({
  projectId,
  categoryId,
  onUploadComplete,
}: FileUploadProps) {
  const { user } = useAuth()
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) return

      // Add files to uploading state
      const newFiles = acceptedFiles.map((file) => ({
        file,
        progress: 'uploading' as const,
      }))
      setUploadingFiles((prev) => [...prev, ...newFiles])

      // Upload each file
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        const result = await uploadDocument({
          file,
          userId: user.id,
          projectId,
          categoryId,
        })

        // Update file status
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === file
              ? {
                  ...uf,
                  progress: result.success ? 'success' : 'error',
                  error: result.error,
                }
              : uf
          )
        )
      }

      // Call callback after all uploads complete
      if (onUploadComplete) {
        onUploadComplete()
      }

      // Clear successful uploads after 3 seconds
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((uf) => uf.progress !== 'success')
        )
      }, 3000)
    },
    [user, projectId, categoryId, onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const removeFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== file))
  }

  return (
    <div className="w-full">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg text-blue-600">Drop files here...</p>
        ) : (
          <>
            <p className="text-lg text-gray-700 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports: PDF, Word, Excel, Images (Max 50MB)
            </p>
          </>
        )}
      </div>

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((uf, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                <FileText className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uf.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uf.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {uf.progress === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-xs text-gray-500">Uploading...</span>
                  </div>
                )}

                {uf.progress === 'success' && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-xs text-green-600">Uploaded</span>
                  </div>
                )}

                {uf.progress === 'error' && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-xs text-red-600">
                      {uf.error || 'Failed'}
                    </span>
                    <button
                      onClick={() => removeFile(uf.file)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
