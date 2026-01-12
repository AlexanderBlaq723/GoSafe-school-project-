"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"passenger" | "driver" | "admin" | "towing_service" | "emergency_service">(
    "passenger",
  )
  const [licenseNumber, setLicenseNumber] = useState("")
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!identifier || !password) {
      setError("Please fill in all fields")
      return
    }

    if (role === "driver" && !licenseNumber) {
      setError("License number is required for drivers")
      return
    }

    try {
      await login(identifier, password, role, licenseNumber)
      router.push(role === "admin" ? "/admin" : "/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome to GoSafe</CardTitle>
          <CardDescription className="text-center">Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger">Passenger/Citizen</SelectItem>
                  <SelectItem value="driver">Driver/Transport Company</SelectItem>
                  <SelectItem value="admin">Government Official</SelectItem>
                  <SelectItem value="towing_service">Towing/Mechanic Service</SelectItem>
                  <SelectItem value="emergency_service">Emergency Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">Email / Phone / GoSafe ID</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="you@example.com or 024XXXXXXX or GSAFE-xxxx"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {role === "driver" && (
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">
                  Driver License Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="licenseNumber"
                  type="text"
                  placeholder="DL-2023-XXXXXX"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Your license will be validated by the system</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
              <div className="mt-2">
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
