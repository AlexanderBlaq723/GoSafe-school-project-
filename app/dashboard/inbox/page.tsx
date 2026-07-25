"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, AlertCircle, CheckCircle, Info, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const { user } = useAuth()

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      try {
        if (!user) return
        const res = await fetch(`/api/notifications?userId=${encodeURIComponent(user.id)}&recipientType=${encodeURIComponent(user.role)}`)
        const data = await res.json()
        const items = (data.notifications || []).map((n: any) => ({
          id: n.notification_id || n.id,
          type: n.type || 'system',
          title: n.title,
          message: n.message,
          reportId: n.related_id || n.report_id || null,
          date: n.created_at ? new Date(n.created_at).toLocaleDateString() : '',
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString() : '',
          isRead: !!n.is_read,
          raw: n,
          icon: n.type === 'alert' ? AlertCircle : n.type === 'update' ? CheckCircle : Info,
        }))
        setNotifications(items)
        // notify layouts to update unread badges
        window.dispatchEvent(new CustomEvent('notificationsUpdated'))
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "alert":
        return "text-red-600 bg-red-50"
      case "update":
        return "text-blue-600 bg-blue-50"
      case "system":
        return "text-gray-600 bg-gray-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const markAsRead = async (id: any) => {
    try {
      const notif = notifications.find((n) => n.id === id)
      if (!notif) return
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notif.raw.notification_id || notif.raw.id, isRead: true })
      })
      const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      setNotifications(updated)
      window.dispatchEvent(new CustomEvent('notificationsUpdated'))
    } catch (err) {
      console.error('Failed to mark as read', err)
    }
  }

  const deleteNotification = async (id: any) => {
    try {
      const notif = notifications.find((n) => n.id === id)
      if (!notif) return
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notif.raw.notification_id || notif.raw.id })
      })
      setNotifications((prev) => prev.filter((notif) => notif.id !== id))
      window.dispatchEvent(new CustomEvent('notificationsUpdated'))
    } catch (err) {
      console.error('Failed to delete notification', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead)
      await Promise.all(unread.map((n) => fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: n.raw.notification_id || n.raw.id, isRead: true })
      })))
      setNotifications(notifications.map((notif) => ({ ...notif, isRead: true })))
      window.dispatchEvent(new CustomEvent('notificationsUpdated'))
    } catch (err) {
      console.error('Failed to mark all as read', err)
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead)
  const readNotifications = notifications.filter((n) => n.isRead)

  return (
    <ProtectedRoute allowedRoles={["driver", "passenger"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
              <p className="text-gray-600 mt-1">
                View notifications and updates about your reports.{" "}
                {unreadNotifications.length > 0 && (
                  <span className="font-medium text-blue-600">{unreadNotifications.length} unread</span>
                )}
              </p>
            </div>
            {unreadNotifications.length > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                Mark All as Read
              </Button>
            )}
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadNotifications.length > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white">{unreadNotifications.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">Read ({readNotifications.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : notifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No notifications yet</p>
                  </CardContent>
                </Card>
              ) : (
                notifications.map((notification) => {
                  const Icon = notification.icon
                  return (
                    <Card
                      key={notification.id}
                      className={`${!notification.isRead ? "border-l-4 border-l-blue-600" : ""}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className={`p-3 rounded-full ${getTypeColor(notification.type)} flex-shrink-0 h-fit`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{notification.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span>
                                    {notification.date} at {notification.time}
                                  </span>
                                  {notification.reportId && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs">
                                        {notification.reportId}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                              {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex gap-2 pt-2">
                              {!notification.isRead && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs"
                                >
                                  Mark as Read
                                </Button>
                              )}
                              {notification.reportId && (
                                <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                  View Report
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="unread" className="space-y-3">
              {unreadNotifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">All caught up!</p>
                  </CardContent>
                </Card>
              ) : (
                unreadNotifications.map((notification) => {
                  const Icon = notification.icon
                  return (
                    <Card key={notification.id} className="border-l-4 border-l-blue-600">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className={`p-3 rounded-full ${getTypeColor(notification.type)} flex-shrink-0 h-fit`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{notification.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span>
                                    {notification.date} at {notification.time}
                                  </span>
                                  {notification.reportId && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs">
                                        {notification.reportId}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs"
                              >
                                Mark as Read
                              </Button>
                              {notification.reportId && (
                                <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                  View Report
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="read" className="space-y-3">
              {readNotifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No read notifications</p>
                  </CardContent>
                </Card>
              ) : (
                readNotifications.map((notification) => {
                  const Icon = notification.icon
                  return (
                    <Card key={notification.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className={`p-3 rounded-full ${getTypeColor(notification.type)} flex-shrink-0 h-fit`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg">{notification.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span>
                                  {notification.date} at {notification.time}
                                </span>
                                {notification.reportId && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">
                                      {notification.reportId}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              {notification.reportId && (
                                <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                  View Report
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
