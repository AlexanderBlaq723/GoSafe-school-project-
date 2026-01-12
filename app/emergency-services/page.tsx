"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Clock, MapPin, Activity, CheckCircle, Truck, Heart, Shield, Play, Pause } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Assignment {
  id: string
  report_id: string
  incident_type: string
  description: string
  location: string
  severity: string
  status: string
  assigned_at: string
  acknowledged_at?: string
  completed_at?: string
  feedback?: string
  notes?: string
}

const SERVICES = {
  ambulance: { name: "Ambulance Service", icon: Heart, color: "red" },
  towing: { name: "Towing Service", icon: Truck, color: "blue" },
  police: { name: "Police Service", icon: Shield, color: "green" }
}

export default function NewEmergencyPortal() {
  const [currentService, setCurrentService] = useState<keyof typeof SERVICES>("ambulance")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [feedback, setFeedback] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const serviceId = user?.id || "es-ambulance-001"

  useEffect(() => {
    fetchAssignments()
  }, [currentService, serviceId])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/service-feedback?serviceId=${serviceId}`)

      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText)
        return
      }

      const data = await response.json()
      console.log('API response:', data)
      setAssignments(data.assignments || [])
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      const response = await fetch("/api/service-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          status,
          feedback: feedback || undefined,
          resolution: notes || undefined
        })
      })

      if (response.ok) {
        alert('Status updated successfully')
        await fetchAssignments()
        setSelectedAssignment(null)
        setFeedback("")
        setNotes("")
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error("Failed to update assignment:", error)
      alert('Failed to update assignment')
    }
  }

  const ServiceIcon = SERVICES[currentService].icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl text-white ${
                  SERVICES[currentService].color === 'red' ? 'bg-red-500' :
                  SERVICES[currentService].color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  <ServiceIcon className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {user?.fullName || SERVICES[currentService].name}
                  </h1>
                  <p className="text-gray-600 font-medium">
                    {(user as any)?.service_type ? `${(user as any).service_type.charAt(0).toUpperCase() + (user as any).service_type.slice(1)} Service` : 'Emergency Response Portal'} • ID: {user?.id || 'N/A'}
                    {(user as any)?.branch_number && ` • Branch: ${(user as any).branch_number}`}
                  </p>
                </div>
              </div>

              {/* Service Switcher */}
              <div className="flex gap-2">
                {Object.entries(SERVICES).map(([key, service]) => (
                  <Button
                    key={key}
                    onClick={() => setCurrentService(key as keyof typeof SERVICES)}
                    variant={currentService === key ? "default" : "outline"}
                    size="sm"
                  >
                    <service.icon className="h-4 w-4 mr-2" />
                    {service.name.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignments List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Active Assignments</h2>
              <Badge variant="outline" className="px-4 py-2 text-lg font-semibold">
                {assignments.length} Cases
              </Badge>
            </div>

            <div className="space-y-4">
              {loading ? (
                <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Assignments</h3>
                    <p className="text-gray-500">Fetching your active cases...</p>
                  </CardContent>
                </Card>
              ) : assignments.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Assignments</h3>
                    <p className="text-gray-500">All clear! No emergency cases assigned.</p>
                  </CardContent>
                </Card>
              ) : (
                assignments.map((assignment) => (
                  <Card 
                    key={assignment.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-0 shadow-lg bg-white/80 ${
                      selectedAssignment?.id === assignment.id ? "ring-2 ring-blue-400" : ""
                    }`}
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                            {assignment.incident_type.replace("_", " ").toUpperCase()}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {assignment.location}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant={assignment.status === 'assigned' ? 'outline' : 'default'}>
                            {assignment.status.replace("_", " ")}
                          </Badge>
                          <div className={`text-xs px-2 py-1 rounded-full font-bold ${
                            assignment.severity === 'high' ? 'bg-red-100 text-red-700' :
                            assignment.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {assignment.severity.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-3">{assignment.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {new Date(assignment.assigned_at).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="space-y-6">
            {selectedAssignment ? (
              <Card className="border-0 shadow-lg bg-white/80">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Assignment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedAssignment.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Location</h4>
                    <p className="text-gray-600">{selectedAssignment.location}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Case Notes</h4>
                    <Textarea
                      placeholder="Add detailed notes about your response and actions taken..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mb-3"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Resolution Feedback</h4>
                    <Textarea
                      placeholder="Provide feedback on case resolution and outcome..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="mb-3"
                    />
                  </div>

                  <div className="space-y-2">
                    {selectedAssignment.status === "assigned" && (
                      <Button
                        onClick={() => updateAssignmentStatus(selectedAssignment.id, "acknowledged")}
                        className="w-full"
                        variant="outline"
                      >
                        Acknowledge
                      </Button>
                    )}
                    {(selectedAssignment.status === "acknowledged" || selectedAssignment.status === "assigned") && (
                      <Button
                        onClick={() => updateAssignmentStatus(selectedAssignment.id, "in_progress")}
                        className="w-full"
                      >
                        Start Response
                      </Button>
                    )}
                    {selectedAssignment.status === "in_progress" && (
                      <Button
                        onClick={() => updateAssignmentStatus(selectedAssignment.id, "completed")}
                        className="w-full"
                        variant="default"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-white/60">
                <CardContent className="p-8 text-center">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Select an assignment to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}