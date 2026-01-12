"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter } from "lucide-react"

export default function AllReportsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports?role=admin')
      const data = await response.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch = !searchQuery || 
      report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    const matchesType = typeFilter === "all" || report.incident_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Reports</h1>
            <p className="text-gray-600 mt-1">View and manage all incident reports submitted by users.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Management</CardTitle>
              <CardDescription>Search, filter, and take action on reports</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by title, location, or user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="reckless_driving">Reckless Driving</SelectItem>
                      <SelectItem value="overloading">Vehicle Overloading</SelectItem>
                      <SelectItem value="driver_misconduct">Driver Misconduct</SelectItem>
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
              </div>

              {/* Table */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No reports found</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.id}</TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="truncate">{report.description}</div>
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">{report.incident_type.replace("_", " ")}</span>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="truncate">{report.location}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(report.severity)}>{report.severity}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{new Date(report.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/admin/reports/${report.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
