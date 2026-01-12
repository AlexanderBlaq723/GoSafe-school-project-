"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Clock, MapPin, Activity, CheckCircle, Play, Pause } from "lucide-react"
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
  image_urls?: string
  video_urls?: string
}

export default function EmergencyServicesPortal() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [feedback, setFeedback] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const serviceId = user?.id || "es-police-001"

  // Add logout function
  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("sessionExpiry")
    window.location.reload()
  }

  useEffect(() => {
    fetchAssignments()
  }, [serviceId]) // Add serviceId as dependency

  const fetchAssignments = async () => {
    try {
      const currentServiceId = user?.id || "es-police-001"
      console.log('Fetching assignments for service:', currentServiceId)
      const response = await fetch(`/api/service-feedback?serviceId=${currentServiceId}`)
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText)
        return
      }
      
      const text = await response.text()
      console.log('Raw response:', text)
      
      let data
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError)
        console.error('Response text:', text)
        return
      }
      
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
      console.log('Updating assignment:', assignmentId, 'to status:', status)
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
        console.log('Status updated successfully')
        alert('Status updated successfully')
        await fetchAssignments()
        setSelectedAssignment(null)
        setFeedback("")
        setNotes("")
      } else {
        console.error('Failed to update:', response.status)
        alert('Failed to update status')
      }
    } catch (error) {
      console.error("Failed to update assignment:", error)
      alert('Error updating status')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      assigned: "outline",
      acknowledged: "secondary",
      in_progress: "default",
      completed: "default",
      cancelled: "destructive"
    }
    return <Badge variant={variants[status] || "outline"}>{status.replace("_", " ")}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Fetching your assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-in slide-in-from-top duration-500">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {user?.fullName || 'Emergency Services Portal'}
                </h1>
                <p className="text-gray-600 font-medium">
                  {(user as any)?.service_type ? `${(user as any).service_type.charAt(0).toUpperCase() + (user as any).service_type.slice(1)} Service` : 'Service'} • ID: {user?.id || 'N/A'}
                  {(user as any)?.branch_number && ` • Branch: ${(user as any).branch_number}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Active Assignments</h2>
              <Badge variant="outline" className="px-4 py-2 text-lg font-semibold">
                {assignments.length} Cases
              </Badge>
            </div>
            
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm animate-in fade-in duration-700">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <AlertCircle className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Assignments</h3>
                    <p className="text-gray-500 mb-4">You're all caught up! New cases will appear here.</p>
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 font-medium mb-2">
                        🔍 Debug Info:
                      </p>
                      <div className="text-xs text-gray-600 space-y-1 text-left">
                        <p>• Current Service ID: <code>{serviceId}</code></p>
                        <p>• User Object: <code>{JSON.stringify(user, null, 2)}</code></p>
                        <p>• API URL: <code>/api/service-feedback?serviceId={serviceId}</code></p>
                      </div>
                    </div>
                    
                    {user?.id === 'es-police-001' && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium mb-2">
                          📝 Police Service - No assignments
                        </p>
                        <p className="text-xs text-blue-600">
                          Police service currently has no emergency cases assigned.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                assignments.map((assignment, index) => (
                  <Card 
                    key={assignment.id} 
                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-in slide-in-from-left duration-500 ${
                      selectedAssignment?.id === assignment.id ? "ring-2 ring-blue-400 shadow-blue-200/50 scale-[1.02]" : "hover:shadow-blue-100/50"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                            {assignment.incident_type.replace("_", " ").toUpperCase()}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-base font-medium">
                            <MapPin className="h-5 w-5 text-blue-500" />
                            {assignment.location}
                          </CardDescription>
                        </div>
                        <div className="text-right space-y-2">
                          {getStatusBadge(assignment.status)}
                          <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                            assignment.severity === 'high' ? 'bg-red-100 text-red-700' :
                            assignment.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {assignment.severity.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-700 mb-3 font-medium">{assignment.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {new Date(assignment.assigned_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          {assignment.status === 'assigned' && <Play className="h-4 w-4 text-blue-500" />}
                          {assignment.status === 'in_progress' && <Activity className="h-4 w-4 text-orange-500 animate-pulse" />}
                          {assignment.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            {selectedAssignment ? (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-in slide-in-from-right duration-500 sticky top-4">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="text-xl font-bold">Case Details</CardTitle>
                  <CardDescription className="text-blue-100">
                    Manage and update case status
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      Incident Information
                    </h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between p-2 bg-white rounded-lg">
                        <span className="font-medium text-gray-600">Type:</span>
                        <span className="font-bold text-gray-900">{selectedAssignment.incident_type.replace("_", " ").toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-white rounded-lg">
                        <span className="font-medium text-gray-600">Location:</span>
                        <span className="font-bold text-gray-900">{selectedAssignment.location}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-white rounded-lg">
                        <span className="font-medium text-gray-600">Severity:</span>
                        <span className={`font-bold ${
                          selectedAssignment.severity === 'high' ? 'text-red-600' :
                          selectedAssignment.severity === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>{selectedAssignment.severity.toUpperCase()}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg">
                        <span className="font-medium text-gray-600 block mb-1">Description:</span>
                        <span className="text-gray-900">{selectedAssignment.description}</span>
                      </div>
                    </div>
                  </div>

                  {(selectedAssignment.image_urls || selectedAssignment.video_urls) && (
                    <div className="bg-gray-50 p-4 rounded-xl border">
                      <h4 className="font-bold text-gray-900 mb-3">Evidence</h4>
                      {selectedAssignment.image_urls && JSON.parse(selectedAssignment.image_urls).length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {JSON.parse(selectedAssignment.image_urls).map((url: string, i: number) => (
                            <img key={i} src={url} alt={`Evidence ${i + 1}`} className="rounded border w-full h-32 object-cover" />
                          ))}
                        </div>
                      )}
                      {selectedAssignment.video_urls && JSON.parse(selectedAssignment.video_urls).length > 0 && (
                        <div className="space-y-2">
                          {JSON.parse(selectedAssignment.video_urls).map((url: string, i: number) => (
                            <video key={i} src={url} controls className="rounded border w-full" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedAssignment.status !== "completed" && selectedAssignment.status !== "cancelled" && (
                    <>
                      <div className="space-y-3">
                        <label className="block text-lg font-bold text-gray-900">Quick Actions</label>
                        <div className="grid grid-cols-1 gap-3">
                          {selectedAssignment.status === "assigned" && (
                            <Button 
                              onClick={() => updateAssignmentStatus(selectedAssignment.id, "acknowledged")}
                              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 hover:scale-105"
                            >
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Acknowledge Case
                            </Button>
                          )}
                          {(selectedAssignment.status === "acknowledged" || selectedAssignment.status === "assigned") && (
                            <Button 
                              onClick={() => updateAssignmentStatus(selectedAssignment.id, "in_progress")}
                              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all duration-200 hover:scale-105"
                            >
                              <Play className="h-5 w-5 mr-2" />
                              Start Working
                            </Button>
                          )}
                          {selectedAssignment.status === "in_progress" && (
                            <Button 
                              onClick={() => updateAssignmentStatus(selectedAssignment.id, "completed")}
                              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200 hover:scale-105"
                            >
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-lg font-bold text-gray-900">Case Notes</label>
                        <Textarea
                          placeholder="Add detailed notes about your response and actions taken..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                          className="resize-none border-2 border-gray-200 focus:border-blue-400 transition-colors"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-lg font-bold text-gray-900">Resolution Feedback</label>
                        <Textarea
                          placeholder="Provide feedback on case resolution and outcome..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={4}
                          className="resize-none border-2 border-gray-200 focus:border-blue-400 transition-colors"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm animate-in fade-in duration-700 sticky top-4">
                <CardContent className="p-12 text-center">
                  <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-fit mx-auto mb-6">
                    <AlertCircle className="h-16 w-16 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Select a Case</h3>
                  <p className="text-gray-600 text-lg">Choose an assignment from the list to view details and manage the case.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}