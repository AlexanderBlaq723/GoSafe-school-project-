import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const services = await query(`
      SELECT id, name, type, phone, email, is_available 
      FROM emergency_services 
      WHERE is_available = true
      ORDER BY type, name
    `)

    return NextResponse.json({ services }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get emergency services error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
