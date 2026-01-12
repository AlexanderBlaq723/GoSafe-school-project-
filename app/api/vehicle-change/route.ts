import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { driverId, newVehicleNumber, reason, proofDocumentUrl } = await request.json()

    if (!driverId || !newVehicleNumber || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const driver = await query<Array<{ vehicle_number: string }>>(
      'SELECT vehicle_number FROM users WHERE id = ?',
      [driverId]
    )

    const requestId = uuidv4()
    await query(
      `INSERT INTO vehicle_change_requests 
       (id, driver_id, old_vehicle_number, new_vehicle_number, reason, proof_document_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [requestId, driverId, driver[0]?.vehicle_number || null, newVehicleNumber, reason, proofDocumentUrl || null]
    )

    return NextResponse.json({ success: true, requestId })
  } catch (error) {
    console.error('Vehicle change request error:', error)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID required' }, { status: 400 })
    }

    const requests = await query<any[]>(
      `SELECT * FROM vehicle_change_requests 
       WHERE driver_id = ? 
       ORDER BY requested_at DESC`,
      [driverId]
    )

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Get vehicle requests error:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}