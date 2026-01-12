"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import FileUpload from "@/components/file-upload"

export default function ReportPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [type, setType] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [priority, setPriority] = useState("medium")
  const [reportedDriverLicense, setReportedDriverLicense] = useState("")
  const [reportedVehicleNumber, setReportedVehicleNumber] = useState("")
  const [requiresTowing, setRequiresTowing] = useState(false)
  const [requiresEmergency, setRequiresEmergency] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleFilesUploaded = (files: any[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!type || !title || !description || !location) {
      setError("Please fill in all required fields")
      return
    }

    // No validation for driver details - they are optional

    setIsSubmitting(true)

    try {
      // Separate images and videos
      const imageUrls = uploadedFiles.filter(f => f.type.startsWith('image/')).map(f => f.url)
      const videoUrls = uploadedFiles.filter(f => f.type.startsWith('video/')).map(f => f.url)

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          type,
          title,
          description,
          location,
          latitude,
          longitude,
          priority,
          vehicleNumber: reportedVehicleNumber || null,
          requestTowing: requiresTowing,
          requestEmergency: requiresEmergency,
          imageUrls,
          videoUrls
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const needsDriverDetails =
    type === "reckless_driving" ||
    type === "overloading" ||
    type === "driver_misconduct" ||
    type === "overcharging" ||
    type === "accident"

  return (
    <ProtectedRoute allowedRoles={["driver", "passenger"]}>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Submit Incident Report</CardTitle>
              <CardDescription>
                Report road safety issues, driver misconduct, infrastructure problems, or emergencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 text-green-900 border-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>Report submitted successfully! Redirecting...</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="type">Incident Type *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reckless_driving">Reckless Driving</SelectItem>
                      <SelectItem value="overloading">Vehicle Overloading</SelectItem>
                      <SelectItem value="driver_misconduct">Driver Misconduct/Maltreatment</SelectItem>
                      <SelectItem value="overcharging">Overcharging</SelectItem>
                      <SelectItem value="vehicle_breakdown">Vehicle Breakdown</SelectItem>
                      <SelectItem value="pothole">Pothole/Damaged Road</SelectItem>
                      <SelectItem value="streetlight_needed">Streetlight Needed</SelectItem>
                      <SelectItem value="accident">Traffic Accident</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="other">Other Safety Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the incident"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about the incident"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* File Upload Section */}
                <FileUpload onFilesUploaded={handleFilesUploaded} />

                {needsDriverDetails && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reportedVehicleNumber">Vehicle Number (Optional)</Label>
                      <Input
                        id="reportedVehicleNumber"
                        placeholder="GT-XXXX-XX (if known)"
                        value={reportedVehicleNumber}
                        onChange={(e) => setReportedVehicleNumber(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="Street address or landmark"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setLatitude(position.coords.latitude)
                            setLongitude(position.coords.longitude)
                            alert('Location captured successfully')
                          },
                          (error) => {
                            alert('Failed to get location. Please enable location services.')
                          }
                        )
                      } else {
                        alert('Geolocation is not supported by your browser')
                      }
                    }}
                  >
                    Get Current Location
                  </Button>
                  {latitude && longitude && (
                    <p className="text-xs text-green-600">Location captured: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Severity Level</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === "vehicle_breakdown" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresTowing"
                      checked={requiresTowing}
                      onCheckedChange={(checked) => setRequiresTowing(checked as boolean)}
                    />
                    <Label htmlFor="requiresTowing" className="text-sm font-normal">
                      Request towing/mechanic service
                    </Label>
                  </div>
                )}

                {(type === "accident" || type === "emergency") && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresEmergency"
                      checked={requiresEmergency}
                      onCheckedChange={(checked) => setRequiresEmergency(checked as boolean)}
                    />
                    <Label htmlFor="requiresEmergency" className="text-sm font-normal">
                      Alert emergency services (Police/Ambulance)
                    </Label>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
