import { NextRequest, NextResponse } from 'next/server'
import { query, queryDatabase } from '@/lib/db'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import NotificationService from '@/lib/notification-service'

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function POST(request: NextRequest) {
  try {
    // Validate incoming body using Zod
    const ReportSchema = z.object({
      incident_type: z.string(),
      location: z.string(),
      description: z.string().optional(),
      severity: z.string().optional()
    })

    const BodySchema = z.object({
      reportId: z.string().optional(),
      serviceTypes: z.array(z.string()),
      latitude: z.number(),
      longitude: z.number(),
      assignedBy: z.string().optional(),
      report: ReportSchema.optional()
    })

    const rawBody = await request.json()
    const parsed = BodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.errors }, { status: 400 })
    }

    const { reportId, serviceTypes, latitude, longitude, assignedBy, report: incomingReport } = parsed.data

    console.log('Emergency service request (v2):', { reportId, serviceTypes, latitude, longitude })

    if ((!reportId && !incomingReport) || !serviceTypes || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const assignments = []

    for (const serviceType of serviceTypes) {
      try {
        let services: any[] = []
        
        if (serviceType === 'towing') {
          // Query towing_services table from user_database
          services = await queryDatabase<any[]>(
            'user_database',
            `SELECT service_id as id, company_name as service_name, service_type, contact_number as phone, email, location as address, 'towing' as service_type FROM towing_services 
             WHERE is_approved = TRUE AND availability_status = 'available' 
             ORDER BY service_id`,
            []
          )
          console.log('Towing services query result:', services)
        } else {
          // Query emergency_services table from user_database
          services = await queryDatabase<any[]>(
            'user_database',
            `SELECT service_id as id, service_name, service_type, contact_person, phone, email, address, latitude, longitude FROM emergency_services 
             WHERE service_type = ? AND is_approved = TRUE AND is_available = true 
             ORDER BY service_id`,
            [serviceType]
          )
        }

        console.log(`Found ${services.length} ${serviceType} services`)

        if (services.length === 0) {
          console.log(`No available ${serviceType} services found`)
          continue
        }

        // Calculate distances and find nearest
        let nearestService = null
        let minDistance = Infinity

        for (const service of services) {
          // Skip distance calculation for towing services if they don't have coordinates
          if (serviceType === 'towing' && (!service.latitude || !service.longitude)) {
            nearestService = service
            minDistance = 0
            break
          }
          
          const distance = calculateDistance(
            latitude, longitude,
            service.latitude, service.longitude
          )
          if (distance < minDistance) {
            minDistance = distance
            nearestService = service
          }
        }

        if (nearestService) {
          // Create assignment
          const assignmentId = uuidv4()
          await queryDatabase(
            'user_database',
            `INSERT INTO service_assignments 
             (id, report_id, service_id, assigned_by, assignment_type, status) 
             VALUES (?, ?, ?, ?, ?, 'assigned')`,
            [assignmentId, reportId, nearestService.id, assignedBy || null, assignedBy ? 'manual' : 'automatic']
          )

          console.log(`Created assignment ${assignmentId} for ${nearestService.service_name}`)

          // Get report details for notification. Prefer incoming report (from body) if provided,
          // otherwise fetch from DB and type it as `Report[]`.
          type Report = {
            incident_type: string
            location: string
            description?: string
            severity?: string
            [key: string]: any
          }

          let reportObj: Report | null = null
          if (incomingReport) {
            reportObj = incomingReport as Report
          } else if (reportId) {
            const reports = await queryDatabase<Report[]>(
              'incident_emergency',
              'SELECT * FROM reports WHERE id = ?',
              [reportId]
            )
            if (reports && reports.length > 0) {
              reportObj = reports[0]
            }
          }

          if (reportObj) {
            try {
              await NotificationService.notifyEmergencyService(
                nearestService.service_name,
                nearestService.phone,
                nearestService.email,
                reportObj.incident_type,
                reportObj.location,
                assignmentId,
                {
                  description: reportObj.description,
                  severity: reportObj.severity,
                  reportedBy: 'User Report'
                }
              )
            } catch (notifError) {
              console.error('Notification error:', notifError)
            }
          }

          assignments.push({
            assignmentId,
            serviceId: nearestService.id,
            serviceName: nearestService.service_name,
            serviceType: nearestService.service_type,
            distance: minDistance.toFixed(2) + ' km'
          })
        }
      } catch (serviceError) {
        console.error(`Error processing ${serviceType}:`, serviceError)
      }
    }

    if (assignments.length === 0) {
      return NextResponse.json({ error: 'No emergency services available' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      assignments,
      message: `${assignments.length} emergency service(s) assigned`
    })

  } catch (error) {
    console.error('Emergency assignment error:', error)
    return NextResponse.json({ error: 'Failed to assign emergency services' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const reportId = searchParams.get('reportId')

    if (serviceId) {
      // Get assignments for a specific service
      const assignments = await query<any[]>(
        `SELECT sa.*, r.incident_type, r.description, r.location, r.severity,
                COALESCE(es.service_name, ts.company_name) AS service_name,
                COALESCE(es.service_type, ts.service_type) AS service_type,
                COALESCE(es.phone, ts.contact_number) AS phone,
                COALESCE(es.email, ts.email) AS email
         FROM service_assignments sa
         JOIN reports r ON sa.report_id = r.id
         LEFT JOIN emergency_services es ON sa.service_id = es.id
         LEFT JOIN towing_services ts ON sa.service_id = ts.service_id
         WHERE sa.service_id = ?
         ORDER BY sa.assigned_at DESC`,
        [serviceId]
      )
      return NextResponse.json({ assignments })
    }

    if (reportId) {
      // Get assignments for a specific report
      const assignments = await query<any[]>(
        `SELECT sa.*, COALESCE(es.service_name, ts.company_name) AS service_name,
                COALESCE(es.service_type, ts.service_type) AS service_type,
                COALESCE(es.phone, ts.contact_number) AS phone,
                COALESCE(es.email, ts.email) AS email
         FROM service_assignments sa
         LEFT JOIN emergency_services es ON sa.service_id = es.id
         LEFT JOIN towing_services ts ON sa.service_id = ts.service_id
         WHERE sa.report_id = ?`,
        [reportId]
      )
      return NextResponse.json({ assignments })
    }

    // Get all assignments
    const assignments = await query<any[]>(
          `SELECT sa.*, r.incident_type, r.location, r.severity,
            COALESCE(es.service_name, ts.company_name) AS service_name,
            COALESCE(es.service_type, ts.service_type) AS service_type,
            COALESCE(es.phone, ts.contact_number) AS phone,
            COALESCE(es.email, ts.email) AS email
           FROM service_assignments sa
           JOIN reports r ON sa.report_id = r.id
           LEFT JOIN emergency_services es ON sa.service_id = es.id
           LEFT JOIN towing_services ts ON sa.service_id = ts.service_id
           ORDER BY sa.assigned_at DESC`
    )

    return NextResponse.json({ assignments })

  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { assignmentId, status, feedback, notes } = await request.json()

    if (!assignmentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const updateFields = ['status = ?']
    const updateValues = [status]

    if (feedback) {
      updateFields.push('feedback = ?')
      updateValues.push(feedback)
    }

    if (notes) {
      updateFields.push('notes = ?')
      updateValues.push(notes)
    }

    if (status === 'acknowledged') {
      updateFields.push('acknowledged_at = NOW()')
    } else if (status === 'completed') {
      updateFields.push('completed_at = NOW()')
    }

    updateValues.push(assignmentId)

    await query(
      `UPDATE service_assignments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    return NextResponse.json({ success: true, message: 'Assignment updated successfully' })

  } catch (error) {
    console.error('Update assignment error:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}