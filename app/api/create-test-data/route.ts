import { NextRequest, NextResponse } from 'next/server'
import { queryDatabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating complete workflow test data...')

    // Step 1: Create passenger reports
    const reports = [
      {
        id: 'report-001',
        passenger_id: 'passenger-123',
        incident_type: 'medical_emergency',
        description: 'Heart attack patient needs immediate assistance',
        location: 'Main Street Hospital',
        severity: 'high',
        status: 'pending'
      },
      {
        id: 'report-002', 
        passenger_id: 'passenger-456',
        incident_type: 'vehicle_breakdown',
        description: 'Car broke down on highway, need towing',
        location: 'Highway 101, Mile 45',
        severity: 'medium',
        status: 'pending'
      },
      {
        id: 'report-003',
        passenger_id: 'passenger-789', 
        incident_type: 'accident',
        description: 'Multi-car accident with injuries',
        location: 'Downtown Intersection',
        severity: 'high',
        status: 'pending'
      }
    ]

    console.log('Creating passenger reports...')
    for (const report of reports) {
      await queryDatabase(
        'incident_emergency',
        'INSERT INTO reports (id, passenger_id, incident_type, description, location, severity, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE description = VALUES(description)',
        [report.id, report.passenger_id, report.incident_type, report.description, report.location, report.severity, report.status]
      )
      console.log(`✓ Created report: ${report.id}`)
    }

    // Step 2: Admin forwards reports to services
    const assignments = [
      {
        id: 'assign-001',
        report_id: 'report-001',
        service_id: '9760407d-10ac-4de3-a53d-80170083eb1d', // Ambulance
        status: 'assigned'
      },
      {
        id: 'assign-002',
        report_id: 'report-002', 
        service_id: 'TO-460d75-001', // Towing
        status: 'assigned'
      },
      {
        id: 'assign-003',
        report_id: 'report-003',
        service_id: '9760407d-10ac-4de3-a53d-80170083eb1d', // Ambulance
        status: 'assigned'
      }
    ]

    console.log('Creating service assignments...')
    for (const assignment of assignments) {
      await queryDatabase(
        'user_database',
        'INSERT INTO service_assignments (id, report_id, service_id, status, assigned_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status)',
        [assignment.id, assignment.report_id, assignment.service_id, assignment.status]
      )
      console.log(`✓ Created assignment: ${assignment.id}`)
    }

    // Verify data
    const ambulanceAssignments = await queryDatabase(
      'user_database',
      `SELECT sa.*, 
             COALESCE(r.description, 'Emergency Case') as description,
             COALESCE(r.location, 'Location TBD') as location, 
             COALESCE(r.incident_type, 'emergency') as incident_type,
             COALESCE(r.severity, 'medium') as severity
       FROM service_assignments sa
       LEFT JOIN incident_emergency.reports r ON sa.report_id = r.id
       WHERE sa.service_id = ?`,
      ['9760407d-10ac-4de3-a53d-80170083eb1d']
    )

    const towingAssignments = await queryDatabase(
      'user_database',
      `SELECT sa.*, 
             COALESCE(r.description, 'Emergency Case') as description,
             COALESCE(r.location, 'Location TBD') as location, 
             COALESCE(r.incident_type, 'emergency') as incident_type,
             COALESCE(r.severity, 'medium') as severity
       FROM service_assignments sa
       LEFT JOIN incident_emergency.reports r ON sa.report_id = r.id
       WHERE sa.service_id = ?`,
      ['TO-460d75-001']
    )

    return NextResponse.json({
      success: true,
      message: 'Workflow test data created successfully',
      data: {
        ambulanceAssignments: ambulanceAssignments?.length || 0,
        towingAssignments: towingAssignments?.length || 0,
        reports: reports.length,
        assignments: assignments.length
      }
    })

  } catch (error) {
    console.error('Error creating test data:', error)
    return NextResponse.json({ 
      error: 'Failed to create test data', 
      details: error.message 
    }, { status: 500 })
  }
}