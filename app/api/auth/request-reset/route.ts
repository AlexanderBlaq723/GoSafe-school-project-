import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { NotificationService } from "@/lib/notification-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier } = body
    if (!identifier) return NextResponse.json({ error: "Identifier is required" }, { status: 400 })

    // Try to find the identifier in all user tables
    const userChecks = [
      await query("SELECT passenger_id as id, email, phone_number as phone, special_id, 'passenger' as role FROM passengers WHERE email = ? OR phone_number = ? OR special_id = ?", [identifier, identifier, identifier]),
      await query("SELECT driver_id as id, email, phone_number as phone, special_id, 'driver' as role FROM drivers WHERE email = ? OR phone_number = ? OR special_id = ?", [identifier, identifier, identifier]),
      await query("SELECT admin_id as id, email, NULL as phone, special_id, 'admin' as role FROM administrators WHERE email = ? OR special_id = ?", [identifier, identifier]),
      await query("SELECT service_id as id, email, phone, special_id, 'emergency_service' as role FROM emergency_services WHERE email = ? OR special_id = ?", [identifier, identifier]),
      await query("SELECT service_id as id, email, contact_number as phone, special_id, 'towing_service' as role FROM towing_services WHERE email = ? OR special_id = ?", [identifier, identifier])
    ]

    const found = userChecks.flat().find(Boolean)
    if (!found) return NextResponse.json({ error: "No user found for that identifier" }, { status: 404 })

    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await query(
      "INSERT INTO password_resets (id, identifier, token, expires_at) VALUES (?, ?, ?, ?)",
      [uuidv4(), identifier, token, expiresAt]
    )

    // Send token via email or SMS when possible
    try {
      if (found.email) {
        await NotificationService.sendEmail(found.email, 'GoSafe password reset', `Your password reset code: ${token}`)
      }
      if (found.phone) {
        await NotificationService.sendSMS(found.phone, `GoSafe reset code: ${token}`)
      }
    } catch (notifyErr) {
      console.error('Notification send failed:', notifyErr)
    }

    // In development/debug mode, return token. In production do NOT return the token.
    const debugReturn = process.env.RETURN_RESET_TOKEN === 'true'
    if (debugReturn) {
      return NextResponse.json({ message: "Password reset token generated", token }, { status: 200 })
    }

    return NextResponse.json({ message: "Password reset requested. Check your email or SMS for the token." }, { status: 200 })
  } catch (error) {
    console.error("Request reset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
