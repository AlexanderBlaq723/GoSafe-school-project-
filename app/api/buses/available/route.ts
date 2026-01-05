import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const buses = await query(`
      SELECT id, bus_number, route, capacity, current_location 
      FROM buses 
      WHERE is_available = true
      ORDER BY bus_number
    `)

    return NextResponse.json({ buses }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get available buses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
