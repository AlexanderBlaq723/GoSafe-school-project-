"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    if (!identifier) {
      setMessage("Please enter your email, phone number, or your GoSafe ID")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessage(data.message || 'Check your email or SMS for the reset token')
      // Optionally navigate to reset page
      router.push('/reset-password')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to request reset')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Enter email, phone, or GoSafe ID</Label>
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            </div>
            {message && <div className="text-sm text-gray-600">{message}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Requesting...' : 'Request Reset'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
