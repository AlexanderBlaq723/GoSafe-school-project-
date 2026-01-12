"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Users, Car, Shield, CheckCircle, XCircle, MapPin, Clock, Bus, Phone } from "lucide-react"

function BusRequestsTab() {
  const [busRequests, setBusRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBusRequests()
  }, [])

  const fetchBusRequests = async () => {
    try {
      console.log("Fetching bus requests for admin...")
      const response = await fetch('/api/bus-requests?adminView=true')
      const data = await response.json()
      console.log("Admin bus requests:", data)
      setBusRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch bus requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "completed": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bus Requests</CardTitle>
        <CardDescription>View all passenger bus requests and driver acceptances</CardDescription>
      </CardHeader>
      <CardContent>
        {busRequests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No bus requests yet</p>
        ) : (
          <div className="space-y-4">
            {busRequests.map((request) => {
              const acceptances = request.acceptances ? JSON.parse(request.acceptances) : []
              return (
                <div key={request.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{request.location}</span>
                        <Badge className={getStatusColor(request.request_status)}>
                          {request.request_status}
                        </Badge>
                      </div>
                      {request.destination && (
                        <div className="text-sm text-gray-600">→ {request.destination}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-gray-600">Passenger</p>
                      <p className="font-medium">{request.passenger_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Request Details</p>
                      <p><Users className="inline h-3 w-3 mr-1" />{request.passenger_count} passengers</p>
                      <p><Clock className="inline h-3 w-3 mr-1" />{formatTime(request.request_time)}</p>
                    </div>
                  </div>

                  {acceptances && acceptances.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Bus className="h-4 w-4" />
                        Accepted by {acceptances.length} driver(s)
                      </h4>
                      <div className="space-y-2">
                        {acceptances.map((acc: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                            <div className="font-medium">{acc.driver_name}</div>
                            <div className="text-gray-600">
                              <Phone className="inline h-3 w-3 mr-1" />{acc.driver_phone}
                            </div>
                            <div className="text-gray-600">
                              Bus: {acc.bus_number} | Capacity: {acc.bus_capacity}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm font-medium">
                        Total Capacity: {request.total_capacity_accepted || 0} / {request.passenger_count}
                      </div>
                    </div>
                  )}

                  {(!acceptances || acceptances.length === 0) && (
                    <div className="text-sm text-gray-500 italic border-t pt-3 mt-3">
                      No drivers have accepted yet
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicleRequests, setVehicleRequests] = useState<any[]>([])
  const [flaggedDrivers, setFlaggedDrivers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [emergencyServices, setEmergencyServices] = useState<any[]>([])
  const [allEmergencyServices, setAllEmergencyServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [driversRes, requestsRes, flaggedRes, reportsRes, servicesRes, allServicesRes] = await Promise.all([
        fetch('/api/admin?action=drivers'),
        fetch('/api/admin?action=vehicle-requests'),
        fetch('/api/admin?action=flagged-drivers'),
        fetch('/api/reports?role=admin'),
        fetch('/api/admin?action=pending-approvals'),
        fetch('/api/admin?action=emergency-services-all')
      ])
      
      const driversData = await driversRes.json()
      const requestsData = await requestsRes.json()
      const flaggedData = await flaggedRes.json()
      const reportsData = await reportsRes.json()
      const approvalsData = await servicesRes.json()
      const allServicesData = await allServicesRes.json()
      
      setDrivers(driversData.drivers || [])
      setVehicleRequests(requestsData.requests || [])
      setFlaggedDrivers(flaggedData.flaggedDrivers || [])
      setReports(reportsData.reports || [])
      setEmergencyServices([...(approvalsData.pendingEmergency || []), ...(approvalsData.pendingTowing || [])])
      setAllEmergencyServices(allServicesData.services || [])
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVehicleRequest = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'approve' ? 'approve-vehicle-change' : 'reject-vehicle-change',
          requestId,
          adminId: 'admin-user-id',
          notes
        })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to handle vehicle request:', error)
    }
  }

  const handleDriverFlag = async (driverId: string, flag: boolean) => {
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: flag ? 'flag-driver' : 'unflag-driver',
          driverId
        })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to flag driver:', error)
    }
  }

  const handleEmergencyServiceApproval = async (serviceId: string, serviceType: string, action: 'approve' | 'reject') => {
    try {
      const actionType = serviceType === 'towing' ? (action === 'approve' ? 'approve-towing' : 'reject-towing') : (action === 'approve' ? 'approve-emergency' : 'reject-emergency')
      
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          serviceId,
          adminId: 'admin-user-id'
        })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to handle service approval:', error)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Loading Dashboard</h2>
              <p className="text-gray-600 text-lg">Fetching system data...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="animate-in slide-in-from-top duration-500">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-gradient-to-r from-slate-600 to-slate-800 rounded-2xl text-white">
                    <Shield className="h-12 w-12" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                      Admin Control Center
                    </h1>
                    <p className="text-gray-600 text-lg font-medium">
                      Comprehensive system management and oversight
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-700">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-orange-700 uppercase tracking-wide">Total Reports</p>
                      <p className="text-4xl font-bold text-orange-900 mt-2">{reports.length}</p>
                      <p className="text-xs text-orange-600 mt-1">Active incidents</p>
                    </div>
                    <div className="p-3 bg-orange-200 rounded-xl">
                      <AlertTriangle className="h-8 w-8 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-blue-700 uppercase tracking-wide">Active Drivers</p>
                      <p className="text-4xl font-bold text-blue-900 mt-2">{drivers.length}</p>
                      <p className="text-xs text-blue-600 mt-1">Registered users</p>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-xl">
                      <Users className="h-8 w-8 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-red-700 uppercase tracking-wide">Flagged Drivers</p>
                      <p className="text-4xl font-bold text-red-900 mt-2">{flaggedDrivers.length}</p>
                      <p className="text-xs text-red-600 mt-1">Require attention</p>
                    </div>
                    <div className="p-3 bg-red-200 rounded-xl">
                      <AlertTriangle className="h-8 w-8 text-red-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-700 uppercase tracking-wide">Pending Approvals</p>
                      <p className="text-4xl font-bold text-amber-900 mt-2">{vehicleRequests.filter(r => r.status === 'pending').length + emergencyServices.length}</p>
                      <p className="text-xs text-amber-600 mt-1">Awaiting review</p>
                    </div>
                    <div className="p-3 bg-amber-200 rounded-xl">
                      <Car className="h-8 w-8 text-amber-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="reports" className="space-y-6 animate-in fade-in duration-1000">
              <TabsList className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg p-2 rounded-xl">
                <TabsTrigger value="reports" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200">Incident Reports</TabsTrigger>
                <TabsTrigger value="bus-requests" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200">Bus Requests</TabsTrigger>
                <TabsTrigger value="emergency-services" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200">Service Approvals</TabsTrigger>
                <TabsTrigger value="emergency-services-all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200">All Services</TabsTrigger>
                <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200">Driver Management</TabsTrigger>
                <TabsTrigger value="vehicle-requests" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200">Vehicle Requests</TabsTrigger>
                <TabsTrigger value="flagged" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200">Flagged Drivers</TabsTrigger>
              </TabsList>

              <TabsContent value="reports">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6" />
                      Incident Reports
                    </CardTitle>
                    <CardDescription className="text-orange-100">
                      Review and manage reported incidents across the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {reports.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                            <AlertTriangle className="h-12 w-12 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Yet</h3>
                          <p className="text-gray-500">All clear! No incidents have been reported.</p>
                        </div>
                      ) : (
                        reports.map((report: any, index) => (
                          <div key={report.id} className={`p-6 border-0 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-left duration-500`} style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h3 className="font-bold text-lg text-gray-900">{report.description || 'Untitled Report'}</h3>
                                  <Badge 
                                    className={`px-3 py-1 font-semibold ${
                                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                      report.status === 'resolved' ? 'bg-green-100 text-green-800' : 
                                      'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {report.status.toUpperCase()}
                                  </Badge>
                                  <Badge className="bg-blue-100 text-blue-800 px-3 py-1 font-semibold">
                                    {report.incident_type.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                  <div className="space-y-2">
                                    <p className="flex items-center gap-2 font-medium">
                                      <MapPin className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-700">{report.location}</span>
                                    </p>
                                    <p className={`font-bold ${
                                      report.severity === 'high' ? 'text-red-600' :
                                      report.severity === 'medium' ? 'text-yellow-600' :
                                      'text-green-600'
                                    }`}>
                                      Severity: {(report.severity || 'medium').toUpperCase()}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    {report.vehicle_number && (
                                      <p className="flex items-center gap-2 font-medium">
                                        <Car className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-700">{report.vehicle_number}</span>
                                      </p>
                                    )}
                                    <p className="flex items-center gap-2 text-gray-600">
                                      <Clock className="h-4 w-4" />
                                      {new Date(report.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 hover:scale-105" asChild>
                                  <Link href={`/admin/reports/${report.id}`}>View Details</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            <TabsContent value="bus-requests">
              <BusRequestsTab />
            </TabsContent>

            <TabsContent value="emergency-services">
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Services Approval</CardTitle>
                  <CardDescription>Review and approve emergency service registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emergencyServices.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No pending approvals</p>
                    ) : (
                      emergencyServices.map((service: any) => (
                        <div key={service.service_id || service.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{service.service_name || service.company_name}</h3>
                                <Badge variant="outline">{service.service_type}</Badge>
                                <Badge variant="secondary">Pending Approval</Badge>
                              </div>
                              <div className="text-sm space-y-1">
                                <p><strong>Contact:</strong> {service.contact_person || 'N/A'}</p>
                                <p><strong>Phone:</strong> {service.phone || service.contact_number}</p>
                                <p><strong>Email:</strong> {service.email}</p>
                                <p><strong>Registration #:</strong> {service.registration_number}</p>
                                {service.branch_number && <p><strong>Branch #:</strong> {service.branch_number}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEmergencyServiceApproval(service.service_id || service.id, service.service_type, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleEmergencyServiceApproval(service.service_id || service.id, service.service_type, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emergency-services-all">
              <Card>
                <CardHeader>
                  <CardTitle>All Emergency Services</CardTitle>
                  <CardDescription>Complete history of emergency service registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allEmergencyServices.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No emergency services yet</p>
                    ) : (
                      allEmergencyServices.map((service: any) => (
                        <div key={service.service_id || service.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{service.service_name || service.company_name}</h3>
                                <Badge variant="outline">{service.service_type}</Badge>
                                <Badge 
                                  variant={service.is_approved ? 'default' : 'secondary'}
                                >
                                  {service.is_approved ? 'Approved' : 'Pending'}
                                </Badge>
                              </div>
                              <div className="text-sm space-y-1">
                                <p><strong>Contact:</strong> {service.contact_person || 'N/A'}</p>
                                <p><strong>Phone:</strong> {service.phone || service.contact_number}</p>
                                <p><strong>Email:</strong> {service.email}</p>
                                {service.branch_number && <p><strong>Service #:</strong> {service.branch_number}</p>}
                                <p><strong>Registration #:</strong> {service.registration_number}</p>
                                <p><strong>Registered:</strong> {new Date(service.created_at).toLocaleString()}</p>
                                {service.is_approved && service.approved_at && (
                                  <p><strong>Approved:</strong> {new Date(service.approved_at).toLocaleString()}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drivers">
              <Card>
                <CardHeader>
                  <CardTitle>All Drivers</CardTitle>
                  <CardDescription>Manage driver accounts and monitor activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {drivers.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No drivers registered yet</p>
                    ) : (
                      drivers.map((driver: any) => (
                        <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{driver.full_name}</h3>
                              {driver.is_flagged && <Badge variant="destructive">Flagged</Badge>}
                              {driver.reported_count > 0 && (
                                <Badge variant="outline">{driver.reported_count} reports</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{driver.email} • {driver.phone}</p>
                            <p className="text-sm text-gray-500">Vehicle: {driver.vehicle_number || 'Not set'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={driver.is_flagged ? "outline" : "destructive"}
                              onClick={() => handleDriverFlag(driver.id, !driver.is_flagged)}
                            >
                              {driver.is_flagged ? 'Unflag' : 'Flag'}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vehicle-requests">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Change Requests</CardTitle>
                  <CardDescription>Review and approve driver vehicle changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vehicleRequests.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No vehicle change requests</p>
                    ) : (
                      vehicleRequests.map((request: any) => (
                        <div key={request.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{request.full_name}</h3>
                                <Badge 
                                  variant={request.status === 'pending' ? 'outline' : 
                                          request.status === 'approved' ? 'default' : 'destructive'}
                                >
                                  {request.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{request.email} • {request.phone}</p>
                              <div className="text-sm space-y-1">
                                <p><strong>From:</strong> {request.old_vehicle_number || 'Not set'}</p>
                                <p><strong>To:</strong> {request.new_vehicle_number}</p>
                                <p><strong>Reason:</strong> {request.reason}</p>
                                {request.proof_document_url && (
                                  <p><strong>Proof:</strong> <a href={request.proof_document_url} className="text-blue-600 underline">View Document</a></p>
                                )}
                              </div>
                            </div>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVehicleRequest(request.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleVehicleRequest(request.id, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flagged">
              <Card>
                <CardHeader>
                  <CardTitle>Flagged Drivers</CardTitle>
                  <CardDescription>Drivers with multiple reports or flagged for review</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {flaggedDrivers.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No flagged drivers</p>
                    ) : (
                      flaggedDrivers.map((driver: any) => (
                        <div key={driver.id} className="p-4 border rounded-lg border-red-200 bg-red-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{driver.full_name}</h3>
                                <Badge variant="destructive">{driver.reported_count} reports</Badge>
                                {driver.recent_reports > 0 && (
                                  <Badge variant="outline">{driver.recent_reports} recent</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{driver.email} • {driver.phone}</p>
                              <p className="text-sm text-gray-500">Vehicle: {driver.vehicle_number}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDriverFlag(driver.id, false)}
                            >
                              Remove Flag
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
