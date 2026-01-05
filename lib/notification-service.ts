import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

interface NotificationData {
  recipientType: 'passenger' | 'driver' | 'admin' | 'all'
  recipientId?: string
  title: string
  message: string
  notificationType: 'alert' | 'update' | 'system' | 'assignment'
  incidentId?: string
}

export class NotificationService {
  static async createNotification(data: NotificationData) {
    const notificationId = uuidv4()
    
    await query(
      `INSERT INTO notifications (notification_id, recipient_type, recipient_id, title, message, notification_type, incident_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [notificationId, data.recipientType, data.recipientId || null, data.title, data.message, data.notificationType, data.incidentId || null]
    )
    
    return notificationId
  }

  static async sendSMS(phoneNumber: string, message: string) {
    // SMS implementation would go here
    console.log(`SMS to ${phoneNumber}: ${message}`)
  }

  static async sendEmail(email: string, subject: string, message: string) {
    // Email implementation would go here
    console.log(`Email to ${email}: ${subject} - ${message}`)
  }

  static async sendPushNotification(userId: string, title: string, message: string) {
    // Push notification implementation would go here
    console.log(`Push to ${userId}: ${title} - ${message}`)
  }

  static async notifyIncidentUpdate(incidentId: string, status: string) {
    const incident = await query(
      "SELECT * FROM incidents WHERE incident_id = ?",
      [incidentId]
    )
    
    if (incident.length > 0) {
      const inc = incident[0] as any
      await this.createNotification({
        recipientType: 'passenger',
        recipientId: inc.passenger_id,
        title: 'Incident Update',
        message: `Your incident report has been ${status}`,
        notificationType: 'update',
        incidentId
      })
    }
  }
}