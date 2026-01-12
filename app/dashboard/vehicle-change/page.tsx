"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Car } from "lucide-react"

export default function VehicleChangePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    newVehicleNumber: "",
    reason: "",
    proofDocument: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch("/api/vehicle-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: user.id,
          oldVehicleNumber: user.vehicle_number,
          newVehicleNumber: formData.newVehicleNumber,
          reason: formData.reason,
          proofDocumentUrl: formData.proofDocument
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert("Vehicle change request submitted successfully! Awaiting admin approval.")
        setFormData({ newVehicleNumber: "", reason: "", proofDocument: "" })
      } else {
        alert(data.error || "Failed to submit request")
      }
    } catch (error) {
      alert("Error submitting request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Request Vehicle Change</h1>
            <p className="text-gray-600 mt-1">Submit a request to change your registered vehicle</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Change Request
              </CardTitle>
              <CardDescription>
                Current Vehicle: {user?.vehicle_number || "Not set"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="newVehicleNumber">New Vehicle Number *</Label>
                  <Input
                    id="newVehicleNumber"
                    value={formData.newVehicleNumber}
                    onChange={(e) => setFormData({...formData, newVehicleNumber: e.target.value})}
                    placeholder="e.g., GH-5678-21"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Change *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Explain why you need to change your vehicle..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="proofDocument">Proof Document URL (Optional)</Label>
                  <Input
                    id="proofDocument"
                    value={formData.proofDocument}
                    onChange={(e) => setFormData({...formData, proofDocument: e.target.value})}
                    placeholder="Link to proof document (e.g., new registration)"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload your document to a cloud service and paste the link here
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>• Your request will be reviewed by an administrator</p>
              <p>• You will continue using your current vehicle until approved</p>
              <p>• Provide accurate information to speed up the approval process</p>
              <p>• You can check the status of your request in the admin notifications</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
