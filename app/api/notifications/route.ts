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

    // Admins are not stored with recipient_type='admin' in the notifications table.
    // For admins, fetch by recipient_id only (plus broadcast 'all' rows).
    // For other roles, also filter by recipient_type to avoid cross-role leakage.
    const notifications = recipientType === 'admin'
      ? await query(
          `SELECT * FROM notifications
           WHERE recipient_id = ? OR recipient_type = 'all'
           ORDER BY created_at DESC
           LIMIT 50`,
          [userId]
        )
      : await query(
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 })
    }

    // Soft-delete or hard-delete depending on schema. We'll remove the row.
    await query(
      "DELETE FROM notifications WHERE notification_id = ?",
      [notificationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notification delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}