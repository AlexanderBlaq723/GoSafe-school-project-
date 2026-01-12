"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function PassengerReportDetailPage() {
  const params = useParams()
  const [report, setReport] = useState<any>(null)
  const [serviceAssignments, setServiceAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [params.id])

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports/${params.id}`)
      const data = await res.json()
      setReport(data.report)
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "in_progress": return "bg-blue-100 text-blue-800"
      case "resolved": return "bg-green-100 text-green-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["driver", "passenger"]}>
        <DashboardLayout>
          <div className="p-8 text-center">Loading...</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!report) {
    return (
      <ProtectedRoute allowedRoles={["driver", "passenger"]}>
        <DashboardLayout>
          <div className="p-8 text-center">Report not found</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["driver", "passenger"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/history">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{report.description || "Incident Report"}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                <Badge variant="secondary">{report.incident_type.replace('_', ' ')}</Badge>
                <Badge variant="outline">{report.severity || "medium"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {report.admin_response && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Admin Response
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-800">{report.admin_response}</p>
                    {report.updated_at && (
                      <p className="text-sm text-gray-500 mt-2">
                        Updated: {new Date(report.updated_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {serviceAssignments.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Service Updates</h3>
                  <div className="space-y-3">
                    {serviceAssignments.map((assignment: any) => (
                      <div key={assignment.id} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{assignment.service_name || 'Service'}</span>
                          <Badge>{assignment.status}</Badge>
                        </div>
                        {assignment.notes && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Notes:</strong> {assignment.notes}
                          </div>
                        )}
                        {assignment.feedback && (
                          <div className="text-sm text-gray-600">
                            <strong>Feedback:</strong> {assignment.feedback}
                          </div>
                        )}
                        {assignment.completed_at && (
                          <div className="text-xs text-gray-500 mt-2">
                            Completed: {new Date(assignment.completed_at).toLocaleString()}
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}
