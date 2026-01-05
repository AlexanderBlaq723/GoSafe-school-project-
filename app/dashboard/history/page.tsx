"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, MapPin } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data
  const reports = [
    {
      id: "RPT-001",
      title: "Large pothole on Main Street",
      type: "pothole",
      location: "Main Street & 5th Avenue",
      description: "There is a dangerous pothole near the intersection that needs immediate attention.",
      status: "reviewed",
      priority: "high",
      date: "2024-01-03",
      time: "10:30 AM",
      updates: [
        { status: "sent", date: "2024-01-03", message: "Report submitted successfully" },
        { status: "reviewed", date: "2024-01-04", message: "Report under review by maintenance team" },
      ],
    },
    {
      id: "RPT-002",
      title: "Broken street light",
      type: "street_light",
      location: "123 Park Avenue",
      description: "Street light has been out for 3 days, making the area unsafe at night.",
      status: "sent",
      priority: "medium",
      date: "2024-01-04",
      time: "2:15 PM",
      updates: [{ status: "sent", date: "2024-01-04", message: "Report submitted successfully" }],
    },
    {
      id: "RPT-003",
      title: "Accident on Highway 101",
      type: "emergency",
      location: "Highway 101 Mile 45",
      description: "Multi-vehicle accident blocking two lanes, emergency services needed.",
      status: "handled",
      priority: "critical",
      date: "2024-01-02",
      time: "8:45 AM",
      updates: [
        { status: "sent", date: "2024-01-02", message: "Report submitted successfully" },
        { status: "reviewed", date: "2024-01-02", message: "Emergency services dispatched" },
        { status: "handled", date: "2024-01-02", message: "Situation resolved, lanes cleared" },
      ],
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

  const filteredReports = statusFilter === "all" ? reports : reports.filter((report) => report.status === statusFilter)

  return (
    <ProtectedRoute allowedRoles={["driver", "passenger"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Report History</h1>
            <p className="text-gray-600 mt-1">View and track all your submitted reports.</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by title or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="md:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="handled">Handled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-xl">{report.title}</CardTitle>
                        <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        <Badge className={getPriorityColor(report.priority)}>{report.priority}</Badge>
                      </div>
                      <CardDescription className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {report.location}
                        </span>
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {report.date} at {report.time}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {report.id}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="updates">Updates ({report.updates.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{report.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View on Map
                        </Button>
                        <Button variant="outline" size="sm">
                          Contact Support
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="updates" className="mt-4">
                      <div className="space-y-3">
                        {report.updates.map((update, index) => (
                          <div key={index} className="flex gap-3 pb-3 border-b last:border-0">
                            <div className="flex flex-col items-center">
                              <div className="h-3 w-3 rounded-full bg-blue-600 mt-1" />
                              {index !== report.updates.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(update.status)} variant="outline">
                                  {update.status}
                                </Badge>
                                <span className="text-xs text-gray-500">{update.date}</span>
                              </div>
                              <p className="text-sm text-gray-600">{update.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
