import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType') || 'all'
    const period = searchParams.get('period') || 'month'
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate period and reportType against known safe values before using in SQL structure
    const allowedPeriods = ['week', 'month', 'year', 'custom']
    const safePeriod = allowedPeriods.includes(period) ? period : 'month'
    const safeYear = /^\d{4}$/.test(year) ? year : new Date().getFullYear().toString()

    let dateFilter = ''
    let groupBy = ''
    let dateParams: any[] = []

    if (safePeriod === 'custom' && startDate && endDate) {
      dateFilter = 'AND created_at BETWEEN ? AND ?'
      dateParams = [startDate, endDate]
      groupBy = 'DATE(created_at)'
    } else {
      switch (safePeriod) {
        case 'week':
          dateFilter = 'AND YEAR(created_at) = ? AND WEEK(created_at) = WEEK(NOW())'
          dateParams = [safeYear]
          groupBy = 'DATE(created_at)'
          break
        case 'month':
          dateFilter = 'AND YEAR(created_at) = ? AND MONTH(created_at) = MONTH(NOW())'
          dateParams = [safeYear]
          groupBy = 'DATE(created_at)'
          break
        case 'year':
          dateFilter = 'AND YEAR(created_at) = ?'
          dateParams = [safeYear]
          groupBy = 'MONTH(created_at)'
          break
      }
    }

    const typeFilter = reportType !== 'all' ? 'AND incident_type = ?' : ''
    const typeParams = reportType !== 'all' ? [reportType] : []

    const periodSelect = safePeriod === 'year' ? 'MONTH(created_at)' : 'DATE(created_at)'

    const analytics = await query(
      `SELECT 
        ${periodSelect} as period,
        COUNT(*) as count,
        incident_type,
        status
       FROM reports
       WHERE 1=1 ${dateFilter} ${typeFilter}
       GROUP BY ${groupBy}, incident_type, status
       ORDER BY period ASC`,
      [...dateParams, ...typeParams]
    )

    const summary = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_resolution_hours
       FROM reports
       WHERE 1=1 ${dateFilter} ${typeFilter}`,
      [...dateParams, ...typeParams]
    )

    return NextResponse.json({ analytics, summary: summary[0] })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
