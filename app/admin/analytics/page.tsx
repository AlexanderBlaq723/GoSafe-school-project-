"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function AnalyticsPage() {
  // Mock data for charts
  const statusData = [
    { name: "Handled", value: 45, fill: "#22c55e" },
    { name: "Reviewed", value: 32, fill: "#f97316" },
    { name: "Sent", value: 23, fill: "#3b82f6" },
  ]

  const monthlyData = [
    { month: "Jan", handled: 40, notHandled: 24 },
    { month: "Feb", handled: 52, notHandled: 18 },
    { month: "Mar", handled: 48, notHandled: 22 },
    { month: "Apr", handled: 61, notHandled: 15 },
    { month: "May", handled: 55, notHandled: 28 },
    { month: "Jun", handled: 67, notHandled: 19 },
  ]

  const reportTypeData = [
    { type: "Pothole", count: 45 },
    { type: "Street Light", count: 32 },
    { type: "Emergency", count: 12 },
    { type: "Other", count: 23 },
  ]

  const responseTimeData = [
    { day: "Mon", avgTime: 4.2 },
    { day: "Tue", avgTime: 3.8 },
    { day: "Wed", avgTime: 5.1 },
    { day: "Thu", avgTime: 3.5 },
    { day: "Fri", avgTime: 4.7 },
    { day: "Sat", avgTime: 6.2 },
    { day: "Sun", avgTime: 5.8 },
  ]

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into report data and system performance.</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Report Status Distribution</CardTitle>
                    <CardDescription>Current status of all reports in the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        handled: { label: "Handled", color: "#22c55e" },
                        reviewed: { label: "Reviewed", color: "#f97316" },
                        sent: { label: "Sent", color: "#3b82f6" },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reports by Type</CardTitle>
                    <CardDescription>Breakdown of report categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: { label: "Reports", color: "#3b82f6" },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportTypeData}>
                          <XAxis dataKey="type" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Report Trends</CardTitle>
                  <CardDescription>Comparison of handled vs not handled reports over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      handled: { label: "Handled", color: "#22c55e" },
                      notHandled: { label: "Not Handled", color: "#ef4444" },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="handled" fill="#22c55e" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="notHandled" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Average Response Time</CardTitle>
                  <CardDescription>Average time (in hours) to address reports by day of week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      avgTime: { label: "Avg Response Time (hours)", color: "#8b5cf6" },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={responseTimeData}>
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="avgTime" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
