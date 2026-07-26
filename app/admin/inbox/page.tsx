"use client"

import { useState, useEffect, Component, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle, AlertCircle, Info, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// ── Error Boundary ────────────────────────────────────────────────────────────
class InboxErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-700 font-semibold">Unable to load inbox messages</p>
            <p className="text-gray-500 text-sm mt-1">Please refresh the page or try again later.</p>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function AdminInboxContent() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch(
        `/api/notifications?userId=${encodeURIComponent(user!.id)}&recipientType=${encodeURIComponent(user!.role)}`
      )
      if (res.status === 401 || res.status === 403) {
        setApiError("You are not authorised to view these notifications.")
        return
      }
      if (!res.ok) {
        setApiError("Failed to load notifications. Please try again.")
        return
      }
      const data = await res.json()
      const items = (data.notifications ?? []).map((n: any) => ({
        id: n.notification_id ?? n.id,
        type: n.type ?? "system",
        title: n.title ?? "Notification",
        message: n.message ?? "",
        date: n.created_at ? new Date(n.created_at).toLocaleDateString() : "",
        time: n.created_at ? new Date(n.created_at).toLocaleTimeString() : "",
        isRead: !!n.is_read,
        raw: n,
      }))
      setNotifications(items)
      window.dispatchEvent(new CustomEvent("notificationsUpdated"))
    } catch {
      setApiError("A network error occurred. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: any) => {
    const notif = notifications.find(n => n.id === id)
    if (!notif) return
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.raw.notification_id ?? notif.raw.id, isRead: true }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      window.dispatchEvent(new CustomEvent("notificationsUpdated"))
    } catch { /* non-critical */ }
  }

  const deleteNotification = async (id: any) => {
    const notif = notifications.find(n => n.id === id)
    if (!notif) return
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.raw.notification_id ?? notif.raw.id }),
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
      window.dispatchEvent(new CustomEvent("notificationsUpdated"))
    } catch { /* non-critical */ }
  }

  const getIcon = (type: string) => {
    if (type === "alert") return AlertCircle
    if (type === "update") return CheckCircle
    return Info
  }

  const getTypeColor = (type: string) => {
    if (type === "alert") return "text-red-600 bg-red-50"
    if (type === "update") return "text-blue-600 bg-blue-50"
    return "text-gray-600 bg-gray-50"
  }

  if (loading) return <div className="text-center py-12">Loading notifications...</div>

  if (apiError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{apiError}</AlertDescription>
      </Alert>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No notifications yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {(notifications ?? []).map(notification => {
        const Icon = getIcon(notification.type)
        return (
          <Card key={notification.id} className={!notification.isRead ? "border-l-4 border-l-blue-600" : ""}>
            <CardContent className="pt-5 pb-4">
              <div className="flex gap-4">
                <div className={`p-3 rounded-full ${getTypeColor(notification.type)} flex-shrink-0 h-fit`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.date} at {notification.time}</p>
                    </div>
                    {!notification.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {!notification.isRead && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => markAsRead(notification.id)}>
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      size="sm" variant="ghost"
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteNotification(notification.id)}
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
      })}
    </div>
  )
}

export default function AdminInboxPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Inbox</h1>
            <p className="text-gray-600 mt-1">System notifications and alerts for your account.</p>
          </div>
          <InboxErrorBoundary>
            <AdminInboxContent />
          </InboxErrorBoundary>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
