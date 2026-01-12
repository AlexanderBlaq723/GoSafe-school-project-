"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
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
  const [reportType, setReportType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [analytics, setAnalytics] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [reportType, startDate, endDate])

  const fetchAnalytics = async () => {
    try {
      let url = `/api/analytics?reportType=${reportType}`
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }
      const response = await fetch(url)
      if (!response.ok) {
        console.error('Analytics API error:', response.status)
        setLoading(false)
        return
      }
      const data = await response.json()
      setAnalytics(data.analytics || [])
      setSummary(data.summary || {})
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into report data and system performance.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
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
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summary.total || 0}</div>
                <p className="text-sm text-gray-600">Total Reports</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{summary.resolved || 0}</div>
                <p className="text-sm text-gray-600">Resolved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{summary.pending || 0}</div>
                <p className="text-sm text-gray-600">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{summary.avg_resolution_hours ? Number(summary.avg_resolution_hours).toFixed(1) : 0}h</div>
                <p className="text-sm text-gray-600">Avg Resolution Time</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          <BarChart data={analytics}>
                            <XAxis dataKey="incident_type" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Report Trends</CardTitle>
                    <CardDescription>Report volume over selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: { label: "Reports", color: "#22c55e" },
                      }}
                      className="h-[400px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics}>
                          <XAxis dataKey="period" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Report Type Distribution</CardTitle>
                    <CardDescription>Breakdown of report categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        resolved: { label: "Resolved", color: "#22c55e" },
                        pending: { label: "Pending", color: "#f97316" },
                      }}
                      className="h-[400px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics}>
                          <XAxis dataKey="incident_type" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
