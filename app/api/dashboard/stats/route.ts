import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const role = searchParams.get("role")

    if (role === "admin") {
      // Admin stats
      const [totalReports] = await query("SELECT COUNT(*) as count FROM reports")
      const [totalUsers] = await query("SELECT COUNT(*) as count FROM users WHERE role != 'admin'")
      const [pendingReports] = await query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'")
      const [resolvedToday] = await query(
        "SELECT COUNT(*) as count FROM reports WHERE status = 'resolved' AND DATE(updated_at) = CURDATE()",
      )

      return NextResponse.json({
        totalReports: (totalReports as any).count,
        totalUsers: (totalUsers as any).count,
        pendingReports: (pendingReports as any).count,
        resolvedToday: (resolvedToday as any).count,
      })
    } else {
      // User stats
      const [totalReports] = await query("SELECT COUNT(*) as count FROM reports WHERE user_id = ?", [userId])
      const [pendingReports] = await query(
        "SELECT COUNT(*) as count FROM reports WHERE user_id = ? AND status = 'pending'",
        [userId],
      )
      const [reviewedReports] = await query(
        "SELECT COUNT(*) as count FROM reports WHERE user_id = ? AND status = 'in_progress'",
        [userId],
      )
      const [handledReports] = await query(
        "SELECT COUNT(*) as count FROM reports WHERE user_id = ? AND status = 'resolved'",
        [userId],
      )

      return NextResponse.json({
        totalReports: (totalReports as any).count,
        pendingReports: (pendingReports as any).count,
        reviewedReports: (reviewedReports as any).count,
        handledReports: (handledReports as any).count,
      })
    }
  } catch (error) {
    console.error("[v0] Get stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
