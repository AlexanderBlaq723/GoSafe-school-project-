"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ApprovalsPage() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/approvals')
      const data = await res.json()
      setPending(data.pending || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const adminId = window.localStorage.getItem('user') ? JSON.parse(window.localStorage.getItem('user') || '{}').id : null
    if (!adminId) return alert('Admin identity required')
    const notes = prompt('Optional notes for rejection/approval') || ''
    try {
      const res = await fetch('/api/admin/approvals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, adminId, notes }) })
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
      <h1 className="text-2xl font-bold mb-4">Pending Service Registrations</h1>
      {pending.length === 0 ? <div>No pending registrations.</div> : (
        <div className="grid gap-4">
          {pending.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.service_name} — {p.service_type}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">Contact: {p.contact_person} | Phone: {p.phone} | Email: {p.email}</div>
                <div className="mt-2">Address: {p.address}</div>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => handleAction(p.id, 'approve')}>Approve</Button>
                  <Button variant="destructive" onClick={() => handleAction(p.id, 'reject')}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
