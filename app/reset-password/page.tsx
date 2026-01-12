"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    if (!token || !newPassword) {
      setMessage('Please provide token and new password')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/confirm-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')
      setMessage(data.message || 'Password updated')
      router.push('/login')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Reset Token</Label>
              <Input value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            {message && <div className="text-sm text-gray-600">{message}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Resetting...' : 'Reset Password'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
