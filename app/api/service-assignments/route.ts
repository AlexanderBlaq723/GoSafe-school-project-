import { NextRequest, NextResponse } from 'next/server'
import { queryDatabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
    }

    const assignments = await queryDatabase(
      'user_database',
      `SELECT sa.*, 
              es.service_name,
              es.service_type
       FROM service_assignments sa
       LEFT JOIN emergency_services es ON sa.service_id = es.id
       WHERE sa.report_id = ?
       ORDER BY sa.assigned_at DESC`,
      [reportId]
    )

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Failed to fetch service assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
