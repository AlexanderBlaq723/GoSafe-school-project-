import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const recipientType = searchParams.get('recipientType')

    if (!userId || !recipientType) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const notifications = await query(
      `SELECT * FROM notifications 
       WHERE (recipient_id = ? OR recipient_type = 'all') 
       AND recipient_type IN (?, 'all')
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId, recipientType]
    )

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, isRead } = body

    if (!notificationId) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 })
    }

    await query(
      "UPDATE notifications SET is_read = ? WHERE notification_id = ?",
      [isRead, notificationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notification update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}