"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, Plus, Bus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import BusRequestForm from "@/components/bus-request-form"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    reviewedReports: 0,
    handledReports: 0,
  })
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        const [statsRes, reportsRes] = await Promise.all([
          fetch(`/api/dashboard/stats?userId=${user.id}&role=${user.role}`),
          fetch(`/api/reports?userId=${user.id}&role=${user.role}`),
        ])

        const statsData = await statsRes.json()
        const reportsData = await reportsRes.json()

        setStats({
          totalReports: statsData.totalReports || 0,
          pendingReports: statsData.pendingReports || 0,
          reviewedReports: statsData.reviewedReports || 0,
          handledReports: statsData.handledReports || 0,
        })

        setRecentReports(reportsData.reports?.slice(0, 3) || [])
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const statsDisplay = [
    { label: "Total Reports", value: stats.totalReports.toString(), icon: AlertCircle, color: "text-blue-600" },
    { label: "Pending", value: stats.pendingReports.toString(), icon: Clock, color: "text-yellow-600" },
    { label: "Reviewed", value: stats.reviewedReports.toString(), icon: AlertCircle, color: "text-orange-600" },
    { label: "Handled", value: stats.handledReports.toString(), icon: CheckCircle, color: "text-green-600" },
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

  const getTypeLabel = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <ProtectedRoute allowedRoles={["driver", "passenger"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.fullName}</h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your reports today.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="lg">
                <Link href="/dashboard/report">
                  <Plus className="mr-2 h-5 w-5" />
                  New Report
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Actions for Passengers */}
          {user?.role === 'passenger' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BusRequestForm />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Quick Report
                  </CardTitle>
                  <CardDescription>Report incidents with photo/video evidence</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/report">Report Issue</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions for Drivers */}
          {user?.role === 'driver' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Bus Requests
                  </CardTitle>
                  <CardDescription>View and accept passenger bus requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/bus-requests">View Requests</Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Report Issue
                  </CardTitle>
                  <CardDescription>Report road hazards and incidents</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/report">Report Issue</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsDisplay.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your latest incident reports and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : recentReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No reports yet. Submit your first report!</div>
              ) : (
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{report.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(report.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{report.location}</p>
                        <p className="text-xs text-gray-500">{formatDate(report.created_at)}</p>
                      </div>
                      <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/dashboard/history">View All Reports</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
