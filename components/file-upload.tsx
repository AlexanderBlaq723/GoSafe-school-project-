"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface FileUploadProps {
  onFilesUploaded: (files: any[]) => void
  accept?: string
  multiple?: boolean
}

interface PreviewFile {
  file: File
  previewUrl: string
  uploaded: boolean
  serverData?: any
}

export default function FileUpload({ onFilesUploaded, accept = "image/*,video/*", multiple = true }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])
  const objectUrlsRef = useRef<string[]>([])

  // Revoke all object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Generate local object URL previews immediately before upload
    const newPreviews: PreviewFile[] = Array.from(files).map(file => {
      const previewUrl = URL.createObjectURL(file)
      objectUrlsRef.current.push(previewUrl)
      return { file, previewUrl, uploaded: false }
    })
    setPreviewFiles(prev => [...prev, ...newPreviews])

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => formData.append('files', file))

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok && Array.isArray(data.files)) {
        // Merge server response back into preview entries
        setPreviewFiles(prev => {
          const updated = [...prev]
          data.files.forEach((serverFile: any, i: number) => {
            const idx = updated.findIndex(p => !p.uploaded && p.file.name === (serverFile.originalName ?? serverFile.filename))
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], uploaded: true, serverData: serverFile }
            }
          })
          return updated
        })
        // Pass server file objects (with url) up to parent
        onFilesUploaded(data.files)
      } else {
        alert(data.error ?? "Upload failed")
        // Remove the previews that failed
        setPreviewFiles(prev => prev.filter(p => p.uploaded))
      }
    } catch (error) {
      alert("Upload failed")
      setPreviewFiles(prev => prev.filter(p => p.uploaded))
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected if needed
      e.target.value = ""
    }
  }

  const removeFile = (index: number) => {
    setPreviewFiles(prev => {
      const entry = prev[index]
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fileUpload">Upload Images/Videos</Label>
        <Input
          id="fileUpload"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {uploading && <p className="text-sm text-gray-600">Uploading...</p>}

      {previewFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files:</Label>
          {previewFiles.map((entry, index) => (
            <div key={index} className="flex items-center gap-3 text-sm border rounded-lg p-2">
              {entry.file.type.startsWith('image/') && entry.previewUrl ? (
                <img
                  src={entry.previewUrl}
                  alt={entry.file.name}
                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 text-xs text-gray-500">
                  {entry.file.type.startsWith('video/') ? 'Video' : 'File'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{entry.file.name}</p>
                <p className="text-gray-500">{(entry.file.size / 1024).toFixed(1)} KB</p>
                {entry.uploaded
                  ? <span className="text-green-600 text-xs">✓ Uploaded</span>
                  : <span className="text-yellow-600 text-xs">Pending...</span>
                }
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 flex-shrink-0"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}