"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, MapPin, Calendar } from "lucide-react"
import Link from "next/link"

export default function ReportDetailPage() {
  const params = useParams()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [response, setResponse] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [serviceAssignments, setServiceAssignments] = useState<any[]>([])

  useEffect(() => {
    fetchReport()
  }, [params.id])

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports/${params.id}`)
      const data = await res.json()
      setReport(data.report)
      setNewStatus(data.report?.status || "pending")
      
      // Fetch service assignments
      const assignRes = await fetch(`/api/service-assignments?reportId=${params.id}`)
      if (assignRes.ok) {
        const assignData = await assignRes.json()
        setServiceAssignments(assignData.assignments || [])
      }
    } catch (error) {
      console.error("Failed to fetch report:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async () => {
    setSubmitting(true)
    try {
      await fetch(`/api/reports/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          response: response || "Status updated",
        }),
      })
      alert("Response submitted successfully")
      setResponse("")
      fetchReport()
    } catch (error) {
      console.error("Failed to submit response:", error)
      alert("Failed to submit response")
    } finally {
      setSubmitting(false)
    }
  }

  const handleForwardToService = async (serviceType: string) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/emergency-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: params.id,
          serviceTypes: [serviceType],
          latitude: report.latitude || 5.5560,
          longitude: report.longitude || -0.1969
        })
      })

      const data = await res.json()
      if (res.ok) {
        alert(`Successfully forwarded to ${serviceType} service. ${data.message}`)
      } else {
        alert(`Failed to forward: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to forward to service:', error)
      alert('Failed to forward to emergency service')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="p-8 text-center">Loading...</div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (!report) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="p-8 text-center">Report not found</div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{report.description || "Incident Report"}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge>{report.status}</Badge>
                    <Badge variant="secondary">{report.incident_type}</Badge>
                    <Badge variant="outline">{report.severity || "medium"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">{report.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h3>
                      <p className="text-gray-700">{report.location}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Reported
                      </h3>
                      <p className="text-gray-700">{new Date(report.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {report.vehicle_number && (
                    <div>
                      <h3 className="font-semibold mb-1">Vehicle Number</h3>
                      <p className="text-gray-700">{report.vehicle_number}</p>
                    </div>
                  )}

                  {report.image_urls && JSON.parse(report.image_urls).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Evidence</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {JSON.parse(report.image_urls).map((url: string, i: number) => (
                          <img key={i} src={url} alt={`Evidence ${i + 1}`} className="rounded border w-full h-48 object-cover" />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Admin Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Response</label>
                    <Textarea
                      placeholder="Enter response..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <Button onClick={handleSubmitResponse} disabled={submitting} className="w-full">
                    {submitting ? "Submitting..." : "Submit Response"}
                  </Button>

                  {(report.incident_type === 'accident' || report.incident_type === 'emergency' || report.severity === 'critical' || report.severity === 'high') && (
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3">Forward to Emergency Services</h3>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => handleForwardToService('police')} 
                          variant="outline" 
                          className="w-full"
                        >
                          Forward to Police
                        </Button>
                        <Button 
                          onClick={() => handleForwardToService('ambulance')} 
                          variant="outline" 
                          className="w-full"
                        >
                          Forward to Ambulance
                        </Button>
                        <Button 
                          onClick={() => handleForwardToService('fire')} 
                          variant="outline" 
                          className="w-full"
                        >
                          Forward to Fire Service
                        </Button>
                        <Button 
                          onClick={() => handleForwardToService('towing')} 
                          variant="outline" 
                          className="w-full"
                        >
                          Forward to Towing Service
                        </Button>
                      </div>
                    </div>
                  )}

                  {serviceAssignments.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3">Service Updates</h3>
                      <div className="space-y-3">
                        {serviceAssignments.map((assignment: any) => (
                          <div key={assignment.id} className="p-3 bg-gray-50 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{assignment.service_name || 'Service'}</span>
                              <Badge>{assignment.status}</Badge>
                            </div>
                            {assignment.notes && (
                              <div className="text-sm text-gray-600 mb-1">
                                <strong>Notes:</strong> {assignment.notes}
                              </div>
                            )}
                            {assignment.feedback && (
                              <div className="text-sm text-gray-600">
                                <strong>Feedback:</strong> {assignment.feedback}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
