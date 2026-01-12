import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    const pending = await query<any[]>(`SELECT * FROM emergency_services WHERE is_approved = false ORDER BY created_at ASC`)
    return NextResponse.json({ pending })
  } catch (error) {
    console.error('Fetch pending approvals error:', error)
    return NextResponse.json({ error: 'Failed to fetch pending approvals' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, adminId, notes } = body
    if (!id || !action || !adminId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    if (action === 'approve') {
      await query('UPDATE emergency_services SET is_approved = true, approved_by = ?, approved_at = NOW() WHERE id = ?', [adminId, id])
      // notify service
      const rows = await query('SELECT * FROM emergency_services WHERE id = ?', [id])
      if (rows.length > 0) {
        const svc = rows[0]
        const title = 'Your service has been approved'
        const message = `Your ${svc.service_type} service (${svc.service_name}) has been approved by admin.`
        if (svc.email) await NotificationService.sendEmail(svc.email, title, message)
        if (svc.phone) await NotificationService.sendSMS(svc.phone, message)
      }
      return NextResponse.json({ success: true, message: 'Approved' })
    } else if (action === 'reject') {
      await query('UPDATE emergency_services SET is_approved = false WHERE id = ?', [id])
      const rows = await query('SELECT * FROM emergency_services WHERE id = ?', [id])
      if (rows.length > 0) {
        const svc = rows[0]
        const title = 'Your service registration was rejected'
        const message = `Your ${svc.service_type} service (${svc.service_name}) was rejected by admin. Notes: ${notes || 'No notes'}`
        if (svc.email) await NotificationService.sendEmail(svc.email, title, message)
        if (svc.phone) await NotificationService.sendSMS(svc.phone, message)
      }
      return NextResponse.json({ success: true, message: 'Rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Approve/reject error:', error)
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
  }
}
