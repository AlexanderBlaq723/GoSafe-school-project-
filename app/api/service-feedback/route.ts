import { NextRequest, NextResponse } from 'next/server'
import { queryDatabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')

    console.log('=== SERVICE FEEDBACK API DEBUG ===')
    console.log('Service ID received:', serviceId)

    if (!serviceId) {
      console.log('ERROR: No service ID provided')
      return NextResponse.json({ error: 'Service ID required' }, { status: 400 })
    }

    console.log('Executing database query for service:', serviceId)

    let assignments = await queryDatabase(
      'user_database',
      `SELECT sa.*, 
             COALESCE(r.description, 'Emergency Case') as description,
             COALESCE(r.location, 'Location TBD') as location, 
             COALESCE(r.incident_type, 'emergency') as incident_type,
             COALESCE(r.severity, 'medium') as severity,
             r.created_at as report_date,
             r.image_urls,
             r.video_urls
       FROM service_assignments sa
       LEFT JOIN reports r ON sa.report_id = r.id
       WHERE sa.service_id = ?
       ORDER BY sa.assigned_at DESC`,
      [serviceId]
    )

    console.log('Database query result:')
    console.log('- Assignments found:', assignments?.length || 0)
    console.log('- Raw assignments:', JSON.stringify(assignments, null, 2))

    return NextResponse.json({ 
      assignments,
      debug: {
        serviceId,
        count: assignments?.length || 0,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('=== API ERROR ===')
    console.error('Error details:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, status, feedback, resolution } = await request.json()

    console.log('POST request received:', { assignmentId, status, feedback, resolution })

    if (!assignmentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Updating assignment:', assignmentId, 'to status:', status)

    await queryDatabase(
      'user_database',
      `UPDATE service_assignments 
       SET status = ?, notes = ?, feedback = ?
       WHERE id = ?`,
      [status, resolution || null, feedback || null, assignmentId]
    )

    console.log('Assignment updated successfully')

    if (status === 'completed' || status === 'resolved') {
      console.log('Updating report status...')
      const assignment = await queryDatabase(
        'user_database',
        'SELECT report_id FROM service_assignments WHERE id = ?',
        [assignmentId]
      )
      
      console.log('Assignment data:', assignment)
      
      if (assignment && assignment.length > 0) {
        await queryDatabase(
          'user_database',
          'UPDATE reports SET status = ? WHERE id = ?',
          ['resolved', assignment[0].report_id]
        )
        console.log('Report status updated')
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback submission error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ error: 'Failed to submit feedback', details: error.message }, { status: 500 })
  }
}
