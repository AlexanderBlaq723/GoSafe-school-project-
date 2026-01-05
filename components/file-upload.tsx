"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FileUploadProps {
  onFilesUploaded: (files: any[]) => void
  accept?: string
  multiple?: boolean
}

export default function FileUpload({ onFilesUploaded, accept = "image/*,video/*", multiple = true }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      const data = await response.json()
      
      if (response.ok) {
        setUploadedFiles(prev => [...prev, ...data.files])
        onFilesUploaded(data.files)
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert("Upload failed")
    } finally {
      setUploading(false)
    }
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
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </div>
      
      {uploading && <p className="text-sm text-gray-600">Uploading...</p>}
      
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Files:</Label>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <span className="text-green-600">✓</span>
              <span>{file.originalName}</span>
              {file.type.startsWith('image/') && (
                <img src={file.url} alt="Preview" className="w-16 h-16 object-cover rounded" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}