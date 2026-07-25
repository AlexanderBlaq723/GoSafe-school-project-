import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { NotificationService } from '@/lib/notification-service'
import { ensureAdminApprovalColumns } from '@/lib/db-helpers'

export async function GET(request: NextRequest) {
  try {
    await ensureAdminApprovalColumns()
    const pendingServices = await query<any[]>(`SELECT service_id as id, service_name, service_type, contact_person, phone, email, address, branch_number, registration_number, created_at FROM emergency_services WHERE is_approved = false ORDER BY created_at ASC`)
    const pendingAdmins = await query<any[]>(`SELECT admin_id as id, full_name, email, dvla_office_id, office_number, branch_location, special_id, approval_status, created_at FROM administrators WHERE is_approved = false ORDER BY created_at ASC`)
    return NextResponse.json({ pendingServices, pendingAdmins })
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
      await query('UPDATE emergency_services SET is_approved = true, approved_by = ?, approved_at = NOW() WHERE service_id = ?', [adminId, id])
      // notify service
      const rows = await query('SELECT * FROM emergency_services WHERE service_id = ?', [id])
      if (rows.length > 0) {
        const svc = rows[0]
        const title = 'Your service has been approved'
        const message = `Your ${svc.service_type} service (${svc.service_name}) has been approved by admin.`
        if (svc.email) await NotificationService.sendEmail(svc.email, title, message)
        if (svc.phone) await NotificationService.sendSMS(svc.phone, message)
      }
      return NextResponse.json({ success: true, message: 'Approved' })
    } else if (action === 'reject') {
      await query('UPDATE emergency_services SET is_approved = false WHERE service_id = ?', [id])
      const rows = await query('SELECT * FROM emergency_services WHERE service_id = ?', [id])
      if (rows.length > 0) {
        const svc = rows[0]
        const title = 'Your service registration was rejected'
        const message = `Your ${svc.service_type} service (${svc.service_name}) was rejected by admin. Notes: ${notes || 'No notes'}`
        if (svc.email) await NotificationService.sendEmail(svc.email, title, message)
        if (svc.phone) await NotificationService.sendSMS(svc.phone, message)
      }
      return NextResponse.json({ success: true, message: 'Rejected' })
    } else if (action === 'approve-admin') {
      await ensureAdminApprovalColumns()
      await query('UPDATE administrators SET is_approved = true, approval_status = ?, approved_by = ?, approved_at = NOW() WHERE admin_id = ?', ['approved', adminId, id])
      const rows = await query('SELECT * FROM administrators WHERE admin_id = ?', [id])
      if (rows.length > 0) {
        const admin = rows[0]
        const title = 'Your administrator account has been approved'
        const message = `Your administrator account for ${admin.email} has been approved.`
        if (admin.email) await NotificationService.sendEmail(admin.email, title, message)
      }
      return NextResponse.json({ success: true, message: 'Admin approved' })
    } else if (action === 'reject-admin') {
      await ensureAdminApprovalColumns()
      await query('UPDATE administrators SET is_approved = false, approval_status = ? WHERE admin_id = ?', ['rejected', id])
      const rows = await query('SELECT * FROM administrators WHERE admin_id = ?', [id])
      if (rows.length > 0) {
        const admin = rows[0]
        const title = 'Your administrator registration was rejected'
        const message = `Your administrator registration for ${admin.email} was rejected by admin. Notes: ${notes || 'No notes'}`
        if (admin.email) await NotificationService.sendEmail(admin.email, title, message)
      }
      return NextResponse.json({ success: true, message: 'Admin rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Approve/reject error:', error)
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
  }
}
