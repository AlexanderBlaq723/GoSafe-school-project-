import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'drivers':
        const drivers = await query<any[]>(
          `SELECT driver_id as id, full_name, email, phone_number as phone, vehicle_number, license_number, 
                  0 as reported_count, false as is_flagged, created_at
           FROM drivers
           ORDER BY created_at DESC`
        )
        return NextResponse.json({ drivers })

      case 'emergency-services':
        const services = await query<any[]>(
          'SELECT * FROM emergency_services ORDER BY service_type, service_name'
        )
        return NextResponse.json({ services })

      case 'towing-services':
        const towingServices = await query<any[]>(
          'SELECT * FROM towing_services ORDER BY company_name'
        )
        return NextResponse.json({ towingServices })

      case 'pending-approvals':
        const pendingEmergency = await query<any[]>(
          'SELECT * FROM emergency_services WHERE is_approved = FALSE ORDER BY created_at DESC'
        )
        const pendingTowing = await query<any[]>(
          'SELECT * FROM towing_services WHERE is_approved = FALSE ORDER BY created_at DESC'
        )
        return NextResponse.json({ pendingEmergency, pendingTowing })

      case 'vehicle-requests':
        const requests = await query<any[]>(
          `SELECT vr.*, d.full_name, d.email, d.phone_number as phone
           FROM vehicle_change_requests vr
           JOIN drivers d ON vr.driver_id = d.driver_id
           ORDER BY vr.requested_at DESC`
        )
        return NextResponse.json({ requests })

      case 'flagged-drivers':
        const flaggedDrivers = await query<any[]>(
          `SELECT driver_id as id, full_name, email, phone_number as phone, vehicle_number, license_number,
           0 as reported_count, 0 as recent_reports, created_at
           FROM drivers
           ORDER BY created_at DESC`
        )
        return NextResponse.json({ flaggedDrivers })

      case 'emergency-services-pending':
        const pendingServices = await query<any[]>(
          'SELECT * FROM emergency_services WHERE is_approved = false ORDER BY created_at DESC'
        )
        return NextResponse.json({ services: pendingServices })

      case 'emergency-services-all':
        const allEmergency = await query<any[]>(
          'SELECT *, "emergency" as type FROM emergency_services ORDER BY created_at DESC'
        )
        const allTowing = await query<any[]>(
          'SELECT *, "towing" as type FROM towing_services ORDER BY created_at DESC'
        )
        return NextResponse.json({ services: [...allEmergency, ...allTowing] })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    switch (action) {
      case 'approve-vehicle-change':
        await query(
          `UPDATE vehicle_change_requests 
           SET status = 'approved', reviewed_at = NOW(), reviewed_by = ?, admin_notes = ?
           WHERE id = ?`,
          [data.adminId, data.notes || null, data.requestId]
        )

        const [request] = await query<any>(
          'SELECT driver_id, new_vehicle_number FROM vehicle_change_requests WHERE id = ?',
          [data.requestId]
        )
        
        if (request) {
          await query(
            'UPDATE users SET vehicle_number = ? WHERE id = ?',
            [request.new_vehicle_number, request.driver_id]
          )
        }

        return NextResponse.json({ success: true })

      case 'reject-vehicle-change':
        await query(
          `UPDATE vehicle_change_requests 
           SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ?, admin_notes = ?
           WHERE id = ?`,
          [data.adminId, data.notes || 'Request rejected', data.requestId]
        )
        return NextResponse.json({ success: true })

      case 'flag-driver':
        await query(
          'UPDATE drivers SET is_flagged = true WHERE driver_id = ?',
          [data.driverId]
        )
        return NextResponse.json({ success: true })

      case 'approve-emergency':
        await query(
          'UPDATE emergency_services SET is_approved = TRUE, approved_by = ?, approved_at = NOW() WHERE id = ?',
          [data.adminId, data.serviceId]
        )
        return NextResponse.json({ success: true })

      case 'approve-towing':
        await query(
          'UPDATE towing_services SET is_approved = TRUE, approved_by = ?, approved_at = NOW() WHERE service_id = ?',
          [data.adminId, data.serviceId]
        )
        return NextResponse.json({ success: true })

      case 'approve-emergency-service':
        await query(
          'UPDATE emergency_services SET is_approved = true, branch_number = ? WHERE service_id = ?',
          [data.serviceNumber, data.serviceId]
        )
        return NextResponse.json({ success: true })

      case 'reject-emergency-service':
        await query(
          'UPDATE emergency_services SET is_approved = false, approval_status = ? WHERE service_id = ?',
          ['rejected', data.serviceId]
        )
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}