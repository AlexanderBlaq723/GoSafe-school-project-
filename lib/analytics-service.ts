import { query } from "@/lib/db"

export class AnalyticsService {
  static async logUserActivity(userId: string, action: string, details?: any) {
    await query(
      `INSERT INTO logs_audit (id, user_id, action, details, timestamp) VALUES (UUID(), ?, ?, ?, NOW())`,
      [userId, action, JSON.stringify(details || {})]
    )
  }

  static async getIncidentStats() {
    const stats = await query(`
      SELECT 
        incident_type,
        COUNT(*) as count,
        AVG(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolution_rate
      FROM incidents 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY incident_type
    `)
    return stats
  }

  static async getSystemHealth() {
    const totalUsers = await query("SELECT COUNT(*) as count FROM passengers UNION ALL SELECT COUNT(*) FROM drivers UNION ALL SELECT COUNT(*) FROM administrators")
    const activeIncidents = await query("SELECT COUNT(*) as count FROM incidents WHERE status IN ('pending', 'investigating')")
    const resolvedToday = await query("SELECT COUNT(*) as count FROM incidents WHERE status = 'resolved' AND DATE(updated_at) = CURDATE()")
    
    return {
      totalUsers: totalUsers.reduce((sum: number, row: any) => sum + row.count, 0),
      activeIncidents: activeIncidents[0]?.count || 0,
      resolvedToday: resolvedToday[0]?.count || 0
    }
  }

  static async trackAPIUsage(endpoint: string, method: string, responseTime: number, statusCode: number) {
    await query(
      `INSERT INTO api_logs (id, endpoint, method, response_time, status_code, timestamp) VALUES (UUID(), ?, ?, ?, ?, NOW())`,
      [endpoint, method, responseTime, statusCode]
    )
  }
}