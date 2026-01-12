"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, AlertTriangle } from "lucide-react"

export default function BusRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [hotSpots, setHotSpots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
    fetchHotSpots()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/bus-requests?driverId=${user?.id}`)
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Failed to fetch requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHotSpots = async () => {
    try {
      const response = await fetch("/api/bus-requests?hotSpots=true")
      const data = await response.json()
      setHotSpots(data.hotSpots || [])
    } catch (error) {
      console.error("Failed to fetch hot spots:", error)
    }
  }

  const acceptRequest = async (requestId: string) => {
    const busNumber = prompt("Enter Bus Number:")
    if (!busNumber) return

    const busCapacity = prompt("Enter Bus Capacity:")
    if (!busCapacity || isNaN(parseInt(busCapacity))) {
      alert("Invalid capacity")
      return
    }

    const driverPhone = prompt("Enter Your Phone Number:")
    if (!driverPhone) return

    const payload = {
      requestId,
      driverId: user?.id,
      driverName: user?.fullName,
      driverPhone,
      busNumber,
      busCapacity: parseInt(busCapacity),
      action: "accept"
    }

    console.log("Sending payload:", payload)

    try {
      const response = await fetch("/api/bus-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log("Response:", data)

      if (response.ok) {
        alert(data.message + `\nCapacity: ${data.totalCapacity}/${data.requiredCapacity}`)
        fetchRequests()
      } else {
        alert(data.error || "Failed to accept request")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error accepting request")
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diff < 1) return "Just now"
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Bus Requests</h1>
            <p className="text-gray-600">View and accept passenger bus requests</p>
          </div>

          {/* Hot Spots Alert */}
          {hotSpots.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  High Demand Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hotSpots.map((spot, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{spot.location}</span>
                      </div>
                      <Badge variant="destructive">{spot.request_count} requests</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No pending requests</div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{request.location}</span>
                            {request.is_peak_hour && (
                              <Badge variant="secondary">Peak Hour</Badge>
                            )}
                          </div>
                          
                          {request.destination && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>→</span>
                              <span>{request.destination}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{request.passenger_count} needed</span>
                              {request.total_capacity_accepted > 0 && (
                                <span className="text-green-600 font-medium">
                                  ({request.total_capacity_accepted} accepted)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(request.request_time)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => acceptRequest(request.id)}
                          size="sm"
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}