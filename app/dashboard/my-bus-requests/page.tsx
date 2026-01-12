"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Clock, Bus, Phone } from "lucide-react"

export default function MyBusRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [user])

  const fetchRequests = async () => {
    if (!user) return
    console.log("Fetching requests for passenger:", user.id)
    try {
      const response = await fetch(`/api/bus-requests?passengerId=${user.id}`)
      const data = await response.json()
      console.log("Passenger requests response:", data)
      console.log("Number of requests:", data.requests?.length || 0)
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Failed to fetch requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "completed": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <ProtectedRoute allowedRoles={["passenger"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">My Bus Requests</h1>
            <p className="text-gray-600">View your bus requests and driver acceptances</p>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No bus requests yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const acceptances = request.acceptances ? JSON.parse(request.acceptances) : []
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{request.location}</span>
                          </div>
                          {request.destination && (
                            <div className="text-sm text-gray-600">→ {request.destination}</div>
                          )}
                        </div>
                        <Badge className={getStatusColor(request.request_status)}>
                          {request.request_status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{request.passenger_count} passengers needed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(request.request_time)}</span>
                        </div>
                      </div>

                      {acceptances && acceptances.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Bus className="h-4 w-4" />
                            Accepted by {acceptances.length} driver(s)
                          </h4>
                          <div className="space-y-3">
                            {acceptances.map((acc: any, idx: number) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg space-y-1">
                                <div className="font-medium">{acc.driver_name}</div>
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {acc.driver_phone}
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">Bus:</span> {acc.bus_number}
                                  <span className="text-gray-600 ml-3">Capacity:</span> {acc.bus_capacity}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Accepted: {formatTime(acc.accepted_at)}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 text-sm font-medium">
                            Total Capacity: {request.total_capacity_accepted || 0} / {request.passenger_count}
                          </div>
                        </div>
                      )}

                      {(!acceptances || acceptances.length === 0) && (
                        <div className="text-sm text-gray-500 italic">
                          Waiting for drivers to accept...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
