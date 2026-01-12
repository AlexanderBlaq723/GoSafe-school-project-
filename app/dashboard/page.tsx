"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, Plus, Bus, Car, Activity } from "lucide-react"
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
    <ProtectedRoute allowedRoles={["driver", "passenger", "towing_service", "emergency_service"]}>
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {user?.role === "towing_service" || user?.role === "emergency_service" ? (
            <div className="max-w-6xl mx-auto p-6 space-y-8">
              <div className="animate-in slide-in-from-top duration-500">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white">
                      <Car className="h-12 w-12" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                        Welcome, {user?.fullName}
                      </h1>
                      <p className="text-gray-600 text-lg font-medium">
                        {user.role === "towing_service" ? "Towing" : "Emergency"} Service Dashboard
                      </p>
                      {user?.specialId && (
                        <p className="text-sm text-blue-600 font-semibold mt-2 bg-blue-50 px-3 py-1 rounded-full w-fit">
                          Service ID: {user.specialId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-in slide-in-from-bottom duration-700">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="text-2xl font-bold">Service Information</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-1">Service Type</div>
                        <div className="text-lg font-bold text-gray-900">{(user as any).service_type || (user as any).serviceType || 'N/A'}</div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                        <div className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">Service ID</div>
                        <div className="text-lg font-bold text-gray-900">{user.id}</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {(user as any).branch_number && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                          <div className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1">Branch Number</div>
                          <div className="text-lg font-bold text-gray-900">{(user as any).branch_number}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button asChild className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-lg transition-all duration-200 hover:scale-105">
                      <Link href="/emergency-portal">
                        <Activity className="mr-3 h-6 w-6" />
                        Access Service Portal
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto p-6 space-y-8">
              {/* Welcome Section */}
              <div className="animate-in slide-in-from-top duration-500">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white animate-float">
                        <AlertCircle className="h-12 w-12" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                          Welcome back, {user?.fullName}
                        </h1>
                        <p className="text-gray-600 text-lg font-medium">
                          Here's what's happening with your reports today.
                        </p>
                        {user?.specialId && (
                          <p className="text-sm text-blue-600 font-semibold mt-2 bg-blue-50 px-3 py-1 rounded-full w-fit">
                            Your ID: {user.specialId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button asChild size="lg" className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold transition-all duration-200 hover:scale-105">
                        <Link href="/dashboard/report">
                          <Plus className="mr-3 h-6 w-6" />
                          New Report
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions for Passengers */}
              {user?.role === 'passenger' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-left duration-700">
                  <div className="hover-lift">
                    <BusRequestForm />
                  </div>
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover-lift">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <Bus className="h-6 w-6" />
                        My Bus Requests
                      </CardTitle>
                      <CardDescription className="text-green-100">
                        View your bus requests and driver acceptances
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Button asChild className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold transition-all duration-200 hover:scale-105">
                        <Link href="/dashboard/my-bus-requests">View My Requests</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Quick Actions for Drivers */}
              {user?.role === 'driver' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right duration-700">
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover-lift">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Bus className="h-5 w-5" />
                        Bus Requests
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        View and accept passenger requests
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Button asChild className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-200 hover:scale-105">
                        <Link href="/dashboard/bus-requests">View Requests</Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover-lift">
                    <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Report Issue
                      </CardTitle>
                      <CardDescription className="text-orange-100">
                        Report road hazards and incidents
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Button asChild className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white font-semibold transition-all duration-200 hover:scale-105">
                        <Link href="/dashboard/report">Report Issue</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover-lift">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Change Vehicle
                      </CardTitle>
                      <CardDescription className="text-purple-100">
                        Request vehicle change approval
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Button asChild className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-semibold transition-all duration-200 hover:scale-105">
                        <Link href="/dashboard/vehicle-change">Request Change</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-1000">
                {statsDisplay.map((stat, index) => {
                  const Icon = stat.icon
                  const gradients = [
                    'from-blue-50 to-blue-100',
                    'from-yellow-50 to-yellow-100', 
                    'from-orange-50 to-orange-100',
                    'from-green-50 to-green-100'
                  ]
                  const iconBgs = [
                    'bg-blue-200',
                    'bg-yellow-200',
                    'bg-orange-200', 
                    'bg-green-200'
                  ]
                  return (
                    <Card key={stat.label} className={`border-0 shadow-xl bg-gradient-to-br ${gradients[index]} hover-lift animate-fade-in-scale`} style={{ animationDelay: `${index * 150}ms` }}>
                      <CardContent className="pt-8 pb-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">{stat.label}</p>
                            <p className="text-4xl font-bold mt-3 text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-600 mt-1">Total count</p>
                          </div>
                          <div className={`p-4 rounded-2xl ${iconBgs[index]} ${stat.color}`}>
                            <Icon className="h-8 w-8" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Recent Activity */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-in slide-in-from-bottom duration-1200">
                <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-t-lg">
                  <CardTitle className="text-2xl font-bold">Recent Reports</CardTitle>
                  <CardDescription className="text-slate-200">
                    Your latest incident reports and their current status
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-600 text-lg">Loading reports...</p>
                    </div>
                  ) : recentReports.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                        <AlertCircle className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Yet</h3>
                      <p className="text-gray-500 text-lg">Submit your first report to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentReports.map((report, index) => (
                        <div
                          key={report.id}
                          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-0 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up`}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-lg text-gray-900">{report.description || report.title || 'Untitled Report'}</h3>
                              <Badge className="bg-blue-100 text-blue-800 px-3 py-1 font-semibold">
                                {getTypeLabel(report.incident_type || report.type || 'other')}
                              </Badge>
                            </div>
                            <p className="text-gray-700 font-medium">{report.location}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {formatDate(report.created_at)}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(report.status)} px-4 py-2 font-bold text-sm`}>
                            {report.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-8">
                    <Button asChild className="w-full h-12 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white font-semibold transition-all duration-200 hover:scale-105">
                      <Link href="/dashboard/history">View All Reports</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
