// Notification Service for SMS and Email
// Integrate with actual providers (Twilio for SMS, SendGrid/AWS SES for Email)

export class NotificationService {
  // Send SMS notification
  static async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      // TODO: Integrate with SMS provider (e.g., Twilio, AWS SNS)
      // Example Twilio integration:
      // const client = require('twilio')(accountSid, authToken);
      // await client.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phone
      // });
      
      console.log(`SMS to ${phone}: ${message}`);
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  // Send Email notification
  static async sendEmail(email: string, subject: string, message: string): Promise<boolean> {
    try {
      // TODO: Integrate with Email provider (e.g., SendGrid, AWS SES, Nodemailer)
      // Example SendGrid integration:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.send({
      //   to: email,
      //   from: process.env.FROM_EMAIL,
      //   subject: subject,
      //   text: message,
      //   html: `<p>${message}</p>`
      // });
      
      console.log(`Email to ${email}: ${subject} - ${message}`);
      return true;
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
}

export default NotificationService;