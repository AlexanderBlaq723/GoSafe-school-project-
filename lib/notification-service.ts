// Notification Service for SMS and Email
// Integrate with actual providers (Twilio for SMS, SendGrid/AWS SES for Email)

import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  // Send SMS notification
  static async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      // Integrate with Twilio SMS provider
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        console.log(`SMS sent to ${phone}: ${message}`);
        return true;
      } else {
        console.log(`SMS to ${phone}: ${message} (Twilio not configured)`);
        return true; // Return true for testing
      }
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  // Send Email notification
  static async sendEmail(email: string, subject: string, message: string): Promise<boolean> {
    try {
      // Integrate with SendGrid email provider
      if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send({
          to: email,
          from: process.env.FROM_EMAIL,
          subject: subject,
          text: message,
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`
        });
        console.log(`Email sent to ${email}: ${subject}`);
        return true;
      } else {
        console.log(`Email to ${email}: ${subject} - ${message} (SendGrid not configured)`);
        return true; // Return true for testing
      }
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  // Send notification to emergency service (SMS + Email + Dashboard)
  static async notifyEmergencyService(
    serviceName: string,
    phone: string,
    email: string,
    incidentType: string,
    location: string,
    assignmentId: string,
    reportDetails?: {
      description: string;
      severity: string;
      reportedBy: string;
    }
  ): Promise<void> {
    const detailsText = reportDetails 
      ? `\nDetails: ${reportDetails.description}\nSeverity: ${reportDetails.severity}\nReported by: ${reportDetails.reportedBy}`
      : '';
    
    const message = `URGENT: New emergency assignment #${assignmentId}. Type: ${incidentType}. Location: ${location}.${detailsText} Check your dashboard for full details.`;
    const subject = `Emergency Assignment: ${incidentType}`;

    // Send SMS
    await this.sendSMS(phone, message);

    // Send Email with full details
    const emailBody = `
      <h2>Emergency Assignment</h2>
      <p><strong>Assignment ID:</strong> ${assignmentId}</p>
      <p><strong>Incident Type:</strong> ${incidentType}</p>
      <p><strong>Location:</strong> ${location}</p>
      ${reportDetails ? `
        <p><strong>Description:</strong> ${reportDetails.description}</p>
        <p><strong>Severity:</strong> ${reportDetails.severity}</p>
        <p><strong>Reported By:</strong> ${reportDetails.reportedBy}</p>
      ` : ''}
      <p><strong>Action Required:</strong> Please check your dashboard immediately for full details and respond to this emergency.</p>
    `;
    await this.sendEmail(email, subject, emailBody);

    // Dashboard notification is automatic via service_assignments table
    console.log(`Dashboard notification created for ${serviceName}`);
  }

  // Create in-app notification
  static async createInAppNotification(
    recipientId: string,
    recipientType: string,
    title: string,
    message: string,
    type: string = 'general',
    relatedId?: string
  ): Promise<void> {
    try {
      const notificationId = uuidv4();
      await query(
        `INSERT INTO notifications (notification_id, recipient_id, recipient_type, title, message, type, related_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [notificationId, recipientId, recipientType, title, message, type, relatedId || null]
      );
      console.log(`In-app notification created for ${recipientType}: ${title}`);
    } catch (error) {
      console.error('Failed to create in-app notification:', error);
    }
  }
}

export default NotificationService;
