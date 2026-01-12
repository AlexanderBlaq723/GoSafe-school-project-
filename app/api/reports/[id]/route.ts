import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const reports = await query("SELECT * FROM reports WHERE id = ?", [id])
    
    if (!reports || reports.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }
    
    return NextResponse.json({ report: reports[0] }, { status: 200 })
  } catch (error) {
    console.error("Get report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { status, response } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    await query(
      `UPDATE reports SET status = ?, admin_response = ?, updated_at = NOW() WHERE id = ?`, 
      [status, response || null, id]
    )

    const reports = await query("SELECT * FROM reports WHERE id = ?", [id])
    return NextResponse.json({ report: reports[0] }, { status: 200 })
  } catch (error) {
    console.error("Update report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
