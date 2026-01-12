import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body
    if (!token || !newPassword) return NextResponse.json({ error: "Token and new password required" }, { status: 400 })

    if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })

    const rows = await query("SELECT * FROM password_resets WHERE token = ?", [token])
    if (rows.length === 0) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })

    const reset = rows[0]
    const expiresAt = new Date(reset.expires_at)
    if (expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    const identifier = reset.identifier

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 12)

    // Try updating in each table where identifier may exist
    await query("UPDATE passengers SET password_hash = ? WHERE email = ? OR phone_number = ? OR special_id = ?", [hashed, identifier, identifier, identifier])
    await query("UPDATE drivers SET password_hash = ? WHERE email = ? OR phone_number = ? OR special_id = ?", [hashed, identifier, identifier, identifier])
    await query("UPDATE administrators SET password_hash = ? WHERE email = ? OR special_id = ?", [hashed, identifier, identifier])
    await query("UPDATE emergency_services SET password_hash = ? WHERE email = ? OR special_id = ?", [hashed, identifier, identifier])
    await query("UPDATE towing_services SET password_hash = ? WHERE email = ? OR special_id = ?", [hashed, identifier, identifier])

    // Clean up token
    await query("DELETE FROM password_resets WHERE token = ?", [token])

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Confirm reset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
