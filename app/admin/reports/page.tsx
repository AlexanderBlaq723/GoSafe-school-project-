"use client"

import { useState } from "react"
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

  // Mock data
  const reports = [
    {
      id: "RPT-001",
      title: "Large pothole on Main Street",
      type: "pothole",
      user: "John Driver",
      location: "Main Street & 5th Ave",
      status: "reviewed",
      priority: "high",
      date: "2024-01-03",
    },
    {
      id: "RPT-002",
      title: "Broken street light",
      type: "street_light",
      user: "Jane Passenger",
      location: "123 Park Avenue",
      status: "sent",
      priority: "medium",
      date: "2024-01-04",
    },
    {
      id: "RPT-003",
      title: "Accident on Highway 101",
      type: "emergency",
      user: "Mike Driver",
      location: "Highway 101 Mile 45",
      status: "handled",
      priority: "critical",
      date: "2024-01-02",
    },
    {
      id: "RPT-004",
      title: "Damaged road sign",
      type: "other",
      user: "Sarah Passenger",
      location: "Oak Street",
      status: "sent",
      priority: "low",
      date: "2024-01-05",
    },
    {
      id: "RPT-005",
      title: "Multiple potholes on residential street",
      type: "pothole",
      user: "Tom Driver",
      location: "Elm Street (blocks 50-60)",
      status: "reviewed",
      priority: "medium",
      date: "2024-01-05",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "reviewed":
        return "bg-orange-100 text-orange-800"
      case "handled":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
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
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="handled">Handled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="pothole">Pothole</SelectItem>
                      <SelectItem value="street_light">Street Light</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.id}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate">{report.title}</div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{report.type.replace("_", " ")}</span>
                        </TableCell>
                        <TableCell>{report.user}</TableCell>
                        <TableCell className="max-w-[150px]">
                          <div className="truncate">{report.location}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(report.priority)}>{report.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{report.date}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
