"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users, FileText, Bus, MapPin } from "lucide-react"

export default function AdminDashboardPage() {
  // Mock data
  const stats = [
    { label: "Total Reports", value: "156", icon: FileText, change: "+12%", color: "text-blue-600" },
    { label: "Active Users", value: "89", icon: Users, change: "+5%", color: "text-purple-600" },
    { label: "Bus Requests", value: "34", icon: Bus, change: "+25%", color: "text-green-600" },
    { label: "Hot Spots", value: "7", icon: MapPin, change: "+3%", color: "text-red-600" },
  ]

  const urgentReports = [
    {
      id: 1,
      type: "emergency",
      title: "Multi-vehicle accident on Highway 101",
      user: "John Driver",
      location: "Highway 101 Mile 45",
      priority: "critical",
      time: "5 min ago",
    },
    {
      id: 2,
      type: "pothole",
      title: "Dangerous pothole causing flat tires",
      user: "Sarah Passenger",
      location: "Main St & 2nd Ave",
      priority: "high",
      time: "15 min ago",
    },
    {
      id: 3,
      type: "street_light",
      title: "Complete power outage on Park Street",
      user: "Mike Driver",
      location: "Park St (blocks 100-200)",
      priority: "high",
      time: "1 hour ago",
    },
  ]

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
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all incident reports across the system.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              const isPositive = stat.change.startsWith("+")
              return (
                <Card key={stat.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className={`h-4 w-4 ${isPositive ? "text-green-600" : "text-red-600"}`} />
                          <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {stat.change}
                          </span>
                          <span className="text-sm text-gray-600">vs last week</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Urgent Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Urgent Reports</CardTitle>
                <CardDescription>High priority reports requiring immediate attention</CardDescription>
              </div>
              <Button variant="outline">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {urgentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{report.title}</h3>
                        <Badge className={getPriorityColor(report.priority)}>{report.priority}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          <span className="font-medium">Reported by:</span> {report.user}
                        </span>
                        <span>
                          <span className="font-medium">Location:</span> {report.location}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{report.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                      <Button size="sm">Take Action</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Report #145 marked as handled</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New user registered: mike@example.com</p>
                      <p className="text-xs text-gray-500">10 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Report #143 escalated to high priority</p>
                      <p className="text-xs text-gray-500">25 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">5 new reports submitted</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">API Status</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium">Response Time</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Slow</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Storage</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">65% Used</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
