import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, handledBy } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    await query(`UPDATE reports SET status = ?, handled_by = ?, updated_at = NOW() WHERE id = ?`, [
      status,
      handledBy || null,
      params.id,
    ])

    const [report] = await query("SELECT * FROM reports WHERE id = ?", [params.id])
    return NextResponse.json({ report }, { status: 200 })
  } catch (error) {
    console.error("[v0] Update report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
