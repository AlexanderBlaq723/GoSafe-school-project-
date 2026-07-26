import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const role = searchParams.get("role")

    if (role === "admin") {
      // Admin stats — count across passengers + drivers (no unified `users` table)
      const [totalReports] = await query("SELECT COUNT(*) as count FROM reports")
      const [pendingReports] = await query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'")
      const [resolvedToday] = await query(
        "SELECT COUNT(*) as count FROM reports WHERE status = 'resolved' AND DATE(updated_at) = CURDATE()"
      )
      const passengerCount = await query("SELECT COUNT(*) as count FROM passengers").catch(() => [{ count: 0 }])
      const driverCount = await query("SELECT COUNT(*) as count FROM drivers").catch(() => [{ count: 0 }])
      const totalUsers = Number((passengerCount[0] as any).count ?? 0) + Number((driverCount[0] as any).count ?? 0)

      return NextResponse.json({
        totalReports: Number((totalReports as any).count ?? 0),
        totalUsers,
        pendingReports: Number((pendingReports as any).count ?? 0),
        resolvedToday: Number((resolvedToday as any).count ?? 0),
      })
    } else {
      // User stats — guard against missing userId
      if (!userId) {
        return NextResponse.json({ totalReports: 0, pendingReports: 0, reviewedReports: 0, handledReports: 0 })
      }

      const [totalReports] = await query(
        "SELECT COUNT(*) as count FROM reports WHERE user_id = ?", [userId]
      )
      const [pendingReports] = await query(
        "SELECT COUNT(*) as count FROM reports WHERE user_id = ? AND status = 'pending'", [userId]
      )
      const [reviewedReports] = await query(
        "SELECT COUNT(*) as count FROM reports WHERE user_id = ? AND status = 'in_progress'", [userId]
      )
      const [handledReports] = await query(
        "SELECT COUNT(*) as count FROM reports WHERE user_id = ? AND status = 'resolved'", [userId]
      )

      return NextResponse.json({
        totalReports:   Number((totalReports as any).count   ?? 0),
        pendingReports: Number((pendingReports as any).count ?? 0),
        reviewedReports: Number((reviewedReports as any).count ?? 0),
        handledReports: Number((handledReports as any).count ?? 0),
      })
    }
  } catch (error) {
    console.error("[v0] Get stats error:", error)
    // Return safe zeros instead of 500 so the dashboard doesn't crash
    return NextResponse.json({ totalReports: 0, pendingReports: 0, reviewedReports: 0, handledReports: 0, resolvedToday: 0, totalUsers: 0 })
  }
}
