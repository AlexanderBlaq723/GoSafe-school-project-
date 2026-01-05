import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const files: File[] = data.getAll('files') as unknown as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate unique filename
      const fileExtension = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      
      // Save to public/uploads directory
      const path = join(process.cwd(), 'public', 'uploads', fileName)
      await writeFile(path, buffer)

      uploadedFiles.push({
        filename: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: `/uploads/${fileName}`
      })
    }

    return NextResponse.json({ 
      message: "Files uploaded successfully",
      files: uploadedFiles 
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}