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

interface PendingFile {
  file: File
  customName: string
  id: string
}

interface UploadingFile {
  file: File
  customName: string
  progress: 'uploading' | 'success' | 'error'
  error?: string
}

export default function FileUpload({
  projectId,
  categoryId,
  onUploadComplete,
}: FileUploadProps) {
  const { user } = useAuth()
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Add files to pending state with default names (without extension)
    const newFiles = acceptedFiles.map((file) => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      return {
        file,
        customName: nameWithoutExt,
        id: `${Date.now()}-${Math.random()}`,
      }
    })
    setPendingFiles((prev) => [...prev, ...newFiles])
  }, [])

  const updateFileName = (id: string, newName: string) => {
    setPendingFiles((prev) =>
      prev.map((pf) => (pf.id === id ? { ...pf, customName: newName } : pf))
    )
  }

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((pf) => pf.id !== id))
  }

  const handleUploadAll = async () => {
    if (!user || pendingFiles.length === 0) return

    // Move pending files to uploading state
    const filesToUpload = pendingFiles.map((pf) => ({
      file: pf.file,
      customName: pf.customName,
      progress: 'uploading' as const,
    }))
    setUploadingFiles((prev) => [...prev, ...filesToUpload])
    setPendingFiles([])

    // Upload each file
    for (const pending of pendingFiles) {
      const result = await uploadDocument({
        file: pending.file,
        userId: user.id,
        projectId,
        categoryId,
        customTitle: pending.customName,
      })

      // Update file status
      setUploadingFiles((prev) =>
        prev.map((uf) =>
          uf.file === pending.file
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
      setUploadingFiles((prev) => prev.filter((uf) => uf.progress !== 'success'))
    }, 3000)
  }

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

  const removeUploadingFile = (file: File) => {
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

      {/* Pending Files - Ready to Upload */}
      {pendingFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Ready to upload ({pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''})
            </h3>
            <button
              onClick={handleUploadAll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Upload All
            </button>
          </div>

          <div className="space-y-2">
            {pendingFiles.map((pf) => (
              <div
                key={pf.id}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Document Name
                    </label>
                    <input
                      type="text"
                      value={pf.customName}
                      onChange={(e) => updateFileName(pf.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter document name..."
                    />
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>Original: {pf.file.name}</span>
                      <span>{(pf.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removePendingFile(pf.id)}
                    className="text-gray-400 hover:text-red-600 flex-shrink-0"
                    title="Remove"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    {uf.customName}
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
                      onClick={() => removeUploadingFile(uf.file)}
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
