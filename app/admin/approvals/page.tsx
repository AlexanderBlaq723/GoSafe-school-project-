"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ApprovalsPage() {
  const [pendingAdmins, setPendingAdmins] = useState<any[]>([])
  const [pendingServices, setPendingServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/approvals')
      const data = await res.json()
      setPendingAdmins(data.pendingAdmins || [])
      setPendingServices(data.pendingServices || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject', entity: 'service' | 'admin' = 'service') => {
    const adminId = window.localStorage.getItem('user') ? JSON.parse(window.localStorage.getItem('user') || '{}').id : null
    if (!adminId) return alert('Admin identity required')
    const notes = prompt('Optional notes for rejection/approval') || ''
    const payload = {
      id,
      action: entity === 'admin' ? `${action}-admin` : action,
      adminId,
      notes,
    }

    try {
      const res = await fetch('/api/admin/approvals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (res.ok) {
        alert(data.message || 'Done')
        fetchPending()
      } else {
        alert(data.error || 'Failed')
      }
    } catch (err) {
      console.error(err)
      alert('Failed')
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Approvals</h1>
      {pendingAdmins.length === 0 && pendingServices.length === 0 ? (
        <div>No pending registrations.</div>
      ) : (
        <div className="space-y-6">
          {pendingAdmins.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Administrator Signups</h2>
              <div className="grid gap-4">
                {pendingAdmins.map((admin) => (
                  <Card key={admin.id}>
                    <CardHeader>
                      <CardTitle>{admin.full_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-700">Email: {admin.email}</div>
                      <div className="text-sm text-gray-700">Office: {admin.office_number} / {admin.branch_location}</div>
                      <div className="text-sm text-gray-700">Status: {admin.approval_status || 'pending'}</div>
                      <div className="flex gap-2 mt-3">
                        <Button onClick={() => handleAction(admin.id, 'approve', 'admin')}>Approve</Button>
                        <Button variant="destructive" onClick={() => handleAction(admin.id, 'reject', 'admin')}>Reject</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pendingServices.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Service Registrations</h2>
              <div className="grid gap-4">
                {pendingServices.map((p) => (
                  <Card key={p.id}>
                    <CardHeader>
                      <CardTitle>{p.service_name} — {p.service_type}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-700">Contact: {p.contact_person} | Phone: {p.phone} | Email: {p.email}</div>
                      <div className="mt-2">Address: {p.address}</div>
                      <div className="flex gap-2 mt-3">
                        <Button onClick={() => handleAction(p.id, 'approve', 'service')}>Approve</Button>
                        <Button variant="destructive" onClick={() => handleAction(p.id, 'reject', 'service')}>Reject</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
