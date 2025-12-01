import nodemailer, { Transporter } from 'nodemailer';
import { AppError } from '../utils/errors';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

interface EmailResponse {
  id: string;
  messageId?: string;
}

class SMTPService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection on startup
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP Server is ready to send emails (Brevo)');
    } catch (error: any) {
      console.error('❌ SMTP Server verification failed:', error.message);
      console.error('   Check your SMTP credentials in .env file');
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    const { to, subject, html, attachments } = options;

    try {
      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'AutoSecure',
          address: process.env.SMTP_FROM_EMAIL || 'noreply@autosecure.local',
        },
        to,
        subject,
        html,
        attachments: attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email sent successfully to ${to}`);
      console.log(`   Message ID: ${info.messageId}`);

      return {
        id: info.messageId,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);
      throw new AppError(`Email sending failed: ${error.message}`, 500);
    }
  }

  /**
   * Send test email (for debugging)
   */
  async sendTestEmail(to: string): Promise<void> {
    try {
      await this.sendEmail({
        to,
        subject: 'AutoSecure - Test Email',
        html: `
          <h1>Test Email from AutoSecure</h1>
          <p>This is a test email sent via Brevo SMTP.</p>
          <p>If you received this, your email configuration is working correctly!</p>
        `,
      });
      console.log('✅ Test email sent successfully');
    } catch (error) {
      console.error('❌ Test email failed:', error);
      throw error;
    }
  }
}

export const smtpService = new SMTPService();
