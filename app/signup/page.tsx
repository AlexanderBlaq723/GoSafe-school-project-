"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"passenger" | "driver" | "admin" | "towing_service" | "emergency_service">(
    "passenger",
  )
  const [phoneNumber, setPhoneNumber] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [transportCompany, setTransportCompany] = useState("")
  const [dvlaOffices, setDvlaOffices] = useState<Array<any>>([])
  const [dvlaOfficeId, setDvlaOfficeId] = useState<string | undefined>(undefined)
  const [officeNumber, setOfficeNumber] = useState("")
  const [branchLocation, setBranchLocation] = useState("")
  const [serviceType, setServiceType] = useState<string | undefined>(undefined)
  const [branchNumber, setBranchNumber] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState("")
  const { signup, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password || !fullName || !phoneNumber) {
      setError("Please fill in all required fields")
      return
    }

    if (role === "driver" && (!licenseNumber || !vehicleNumber)) {
      setError("License number and vehicle number are required for drivers")
      return
    }

    if (role === "admin" && (!dvlaOfficeId || !officeNumber || !branchLocation)) {
      setError("DVLA office, office number and branch location are required for admin registration")
      return
    }

    if ((role === 'towing_service') && !companyName) {
      setError('Company name is required for towing services')
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      const result = await signup(
        email,
        password,
        fullName,
        role,
        phoneNumber,
        licenseNumber,
        vehicleNumber,
        transportCompany,
        companyName,
        dvlaOfficeId,
        officeNumber,
        branchLocation,
        serviceType,
        branchNumber,
        registrationNumber,
      )

      if (result?.requiresApproval) {
        const msg = result.message || 'Registration submitted. Awaiting approval.'
        const special = result.specialId ? `Your GoSafe ID: ${result.specialId}` : ''
        alert(`${msg}\n${special}`)
        router.push('/login')
        return
      }

      router.push(role === "admin" ? "/admin" : "/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account")
    }
  }

  useEffect(() => {
    if (role === 'admin') {
      fetch('/api/dvla-offices')
        .then((r) => r.json())
        .then((d) => setDvlaOffices(d.offices || []))
        .catch(() => setDvlaOffices([]))
    }
  }, [role])

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
          <CardTitle className="text-2xl font-bold text-center">Create GoSafe Account</CardTitle>
          <CardDescription className="text-center">Join the road safety platform</CardDescription>
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
                  <SelectItem value="admin">Government Official (DVLA/MTTD)</SelectItem>
                  <SelectItem value="towing_service">Towing/Mechanic Service</SelectItem>
                  <SelectItem value="emergency_service">Emergency Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="024XXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {role === "driver" && (
              <>
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

                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">
                    Vehicle Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vehicleNumber"
                    type="text"
                    placeholder="GT-XXXX-XX"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportCompany">Transport Company (Optional)</Label>
                  <Input
                    id="transportCompany"
                    type="text"
                    placeholder="Metro Mass Transit"
                    value={transportCompany}
                    onChange={(e) => setTransportCompany(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {role === "admin" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dvlaOffice">DVLA Office</Label>
                  <Select value={dvlaOfficeId} onValueChange={(v: any) => setDvlaOfficeId(v)}>
                    <SelectTrigger id="dvlaOffice">
                      <SelectValue placeholder="Select DVLA office" />
                    </SelectTrigger>
                    <SelectContent>
                      {dvlaOffices.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{`${o.office_name} — ${o.region}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="officeNumber">Office Number</Label>
                  <Input id="officeNumber" type="text" placeholder="Office number" value={officeNumber} onChange={(e) => setOfficeNumber(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchLocation">Branch Location</Label>
                  <Input id="branchLocation" type="text" placeholder="Branch location" value={branchLocation} onChange={(e) => setBranchLocation(e.target.value)} />
                </div>
              </>
            )}

            {role === 'emergency_service' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select value={serviceType} onValueChange={(v: any) => setServiceType(v)}>
                    <SelectTrigger id="serviceType">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambulance">Ambulance</SelectItem>
                      <SelectItem value="fire">Fire</SelectItem>
                      <SelectItem value="police">Police</SelectItem>
                      <SelectItem value="rescue">Rescue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input id="registrationNumber" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchNumber">Branch Number (optional)</Label>
                  <Input id="branchNumber" value={branchNumber} onChange={(e) => setBranchNumber(e.target.value)} />
                </div>
              </>
            )}

            {role === 'towing_service' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input id="registrationNumber" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchNumber">Branch Number (optional)</Label>
                  <Input id="branchNumber" value={branchNumber} onChange={(e) => setBranchNumber(e.target.value)} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
