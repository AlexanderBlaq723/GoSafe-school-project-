import { type NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({ region: process.env.AWS_REGION })

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 })
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    })
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Presign error:", error)
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 })
  }
}
